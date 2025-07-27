import { PrismaClient } from '../../../generated/prisma';

export abstract class BaseDatabaseService {
    protected prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async initialize(): Promise<void> {
        await this.prisma.$connect();
    }

    async close(): Promise<void> {
        await this.prisma.$disconnect();
    }

    protected createSlug(input: string): string {
        return input
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
}