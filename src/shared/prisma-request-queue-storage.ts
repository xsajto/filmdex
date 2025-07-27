import { 
  IRequestQueueStorage, 
  QueuedRequest, 
  RequestStatus, 
  QueueStats,
  Request
} from '@crawlus/core';
import { PrismaClient, RequestQueue } from '../../generated/prisma';

export class PrismaRequestQueueStorage implements IRequestQueueStorage {
  public readonly name: string;
  public readonly maxSize?: number;
  
  private prisma: PrismaClient;
  private config: {
    name: string;
    maxSize?: number;
    defaultPriority: number;
    retryLimit: number;
    processingTimeout: number;
    cleanupInterval: number;
  };

  constructor(name: string, client: PrismaClient = new PrismaClient()) {
    this.name = name;
    this.config = {
      name: name,
      defaultPriority: 0.5,
      retryLimit: 3,
      processingTimeout: 300000, // 5 minutes
      cleanupInterval: 60000 // 1 minute
    };
    this.prisma = client;
    
    // Start cleanup interval
    if (this.config.cleanupInterval) {
      this.startCleanupInterval();
    }
  }

  async enqueue(request: Request, priority?: number): Promise<void> {
    try {
      await this.prisma.requestQueue.create({
        data: {
          url: request.url,
          priority: priority ?? this.config.defaultPriority ?? 1,
          status: 'PENDING',
          method: request.method || 'GET',
          headers: request.headers ? JSON.stringify(request.headers) : null,
          payload: request.payload ? JSON.stringify(request.payload) : null,
          userData: request.userData ? JSON.stringify(request.userData) : null,
          retryCount: 0,
          uniqueKey: request.uniqueKey,
          queueName: this.config.name
        }
      });
    } catch (error: unknown) {
      // Handle duplicate unique key constraint - silently ignore as request already exists
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        // Request already exists in queue, this is expected behavior
        return;
      }
      throw error;
    }
  }

  async enqueueBatch(requests: Request[], priority?: number): Promise<void> {
    const data = requests.map(request => ({
      url: request.url,
      priority: priority ?? this.config.defaultPriority ?? 0.5,
      status: 'PENDING' as const,
      method: request.method || 'GET',
      headers: request.headers ? JSON.stringify(request.headers) : null,
      payload: request.payload ? JSON.stringify(request.payload) : null,
      userData: request.userData ? JSON.stringify(request.userData) : null,
      retryCount: 0,
      uniqueKey: request.uniqueKey || request.url,
      queueName: this.config.name
    }));

    await this.prisma.requestQueue.createMany({
      data,
      skipDuplicates: true
    });
  }

  async next(): Promise<QueuedRequest | null> {
    // Find and lock the next pending request with longer timeout
    const result = await this.prisma.$transaction(async (tx) => {
      const nextRequest = await tx.requestQueue.findFirst({
        where: {
          queueName: this.config.name,
          status: 'PENDING'
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ]
      });

      if (!nextRequest) {
        return null;
      }

      // Update status to processing
      await tx.requestQueue.update({
        where: { id: nextRequest.id },
        data: {
          status: 'PROCESSING',
          processingStartedAt: new Date()
        }
      });

      return nextRequest;
    }, {
      timeout: 30000 // 30 seconds timeout
    });

    if (!result) {
      return null;
    }

    return this.mapToQueuedRequest(result);
  }

  async peek(): Promise<QueuedRequest | null> {
    const nextRequest = await this.prisma.requestQueue.findFirst({
      where: {
        queueName: this.config.name,
        status: 'PENDING'
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    if (!nextRequest) {
      return null;
    }

    return this.mapToQueuedRequest(nextRequest);
  }

  async markProcessed(requestId: string): Promise<void> {
    await this.prisma.requestQueue.update({
      where: { id: requestId },
      data: {
        status: 'PROCESSED',
        processingCompletedAt: new Date()
      }
    });
  }

  async markFailed(requestId: string, error: string, retryable?: boolean): Promise<void> {
    const request = await this.prisma.requestQueue.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    const shouldRetry = retryable !== false && request.retryCount < (this.config.retryLimit ?? 3);

    await this.prisma.requestQueue.update({
      where: { id: requestId },
      data: {
        status: shouldRetry ? 'RETRYING' : 'FAILED',
        lastError: error,
        processingCompletedAt: new Date()
      }
    });
  }

  async retry(requestId: string, priority?: number): Promise<void> {
    const request = await this.prisma.requestQueue.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    await this.prisma.requestQueue.update({
      where: { id: requestId },
      data: {
        status: 'PENDING',
        priority: priority ?? request.priority,
        retryCount: request.retryCount + 1,
        processingStartedAt: null,
        processingCompletedAt: null
      }
    });
  }

  async getStats(): Promise<QueueStats> {
    const [total, pending, processing, processed, failed, retrying] = await Promise.all([
      this.prisma.requestQueue.count({ where: { queueName: this.config.name } }),
      this.prisma.requestQueue.count({ where: { queueName: this.config.name, status: 'PENDING' } }),
      this.prisma.requestQueue.count({ where: { queueName: this.config.name, status: 'PROCESSING' } }),
      this.prisma.requestQueue.count({ where: { queueName: this.config.name, status: 'PROCESSED' } }),
      this.prisma.requestQueue.count({ where: { queueName: this.config.name, status: 'FAILED' } }),
      this.prisma.requestQueue.count({ where: { queueName: this.config.name, status: 'RETRYING' } })
    ]);

    // Calculate average processing time
    const completedRequests = await this.prisma.requestQueue.findMany({
      where: {
        queueName: this.config.name,
        status: 'PROCESSED',
        processingStartedAt: { not: null },
        processingCompletedAt: { not: null }
      },
      select: {
        processingStartedAt: true,
        processingCompletedAt: true
      },
      take: 100,
      orderBy: { processingCompletedAt: 'desc' }
    });

    let avgProcessingTime: number | undefined;
    if (completedRequests.length > 0) {
      const totalTime = completedRequests.reduce((sum, req) => {
        const start = req.processingStartedAt!.getTime();
        const end = req.processingCompletedAt!.getTime();
        return sum + (end - start);
      }, 0);
      avgProcessingTime = totalTime / completedRequests.length;
    }

    return {
      total,
      pending,
      processing,
      processed,
      failed,
      retrying,
      avgProcessingTime
    };
  }

  async isEmpty(): Promise<boolean> {
    const count = await this.prisma.requestQueue.count({
      where: {
        queueName: this.config.name,
        status: 'PENDING'
      }
    });
    return count === 0;
  }

  async size(): Promise<number> {
    return this.prisma.requestQueue.count({
      where: {
        queueName: this.config.name,
        status: 'PENDING'
      }
    });
  }

  async clear(): Promise<void> {
    await this.prisma.requestQueue.deleteMany({
      where: { queueName: this.config.name }
    });
  }

  async getByStatus(status: RequestStatus, limit?: number): Promise<QueuedRequest[]> {
    const dbStatus = this.mapStatusToDb(status);
    const requests = await this.prisma.requestQueue.findMany({
      where: {
        queueName: this.config.name,
        status: dbStatus as 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'RETRYING'
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return requests.map(req => this.mapToQueuedRequest(req));
  }

  async remove(requestIds: string[]): Promise<number> {
    const result = await this.prisma.requestQueue.deleteMany({
      where: {
        id: { in: requestIds },
        queueName: this.config.name
      }
    });
    return result.count;
  }

  private mapToQueuedRequest(dbRequest: RequestQueue): QueuedRequest {
    const request = Request.create({
      url: dbRequest.url,
      method: dbRequest.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      headers: dbRequest.headers ? JSON.parse(dbRequest.headers) : undefined,
      payload: dbRequest.payload ? JSON.parse(dbRequest.payload) : undefined,
      userData: dbRequest.userData ? JSON.parse(dbRequest.userData) : undefined
    });

    return {
      id: dbRequest.id,
      request,
      priority: dbRequest.priority,
      status: this.mapStatusFromDb(dbRequest.status),
      enqueuedAt: dbRequest.createdAt,
      processedAt: dbRequest.processingCompletedAt || undefined,
      retryCount: dbRequest.retryCount,
      lastError: dbRequest.lastError || undefined,
      metadata: dbRequest.metadata ? JSON.parse(dbRequest.metadata) : undefined
    };
  }

  private mapStatusToDb(status: RequestStatus): string {
    const mapping: Record<RequestStatus, string> = {
      'pending': 'PENDING',
      'processing': 'PROCESSING',
      'processed': 'PROCESSED',
      'failed': 'FAILED',
      'retrying': 'RETRYING'
    };
    return mapping[status];
  }

  private mapStatusFromDb(dbStatus: string): RequestStatus {
    const mapping: Record<string, RequestStatus> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'PROCESSED': 'processed',
      'FAILED': 'failed',
      'RETRYING': 'retrying'
    };
    return mapping[dbStatus] || 'pending';
  }

  private startCleanupInterval(): void {
    setInterval(async () => {
      try {
        // Reset stuck processing requests
        const timeout = this.config.processingTimeout ?? 300000; // 5 minutes default
        const cutoffTime = new Date(Date.now() - timeout);
        
        await this.prisma.requestQueue.updateMany({
          where: {
            queueName: this.config.name,
            status: 'PROCESSING',
            processingStartedAt: { lt: cutoffTime }
          },
          data: {
            status: 'RETRYING',
            retryCount: { increment: 1 }
          }
        });
      } catch (error) {
        console.error('Cleanup interval error:', error);
      }
    }, this.config.cleanupInterval);
  }
}
