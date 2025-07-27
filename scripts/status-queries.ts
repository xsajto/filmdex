#!/usr/bin/env npx tsx

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function checkDatabaseConnection(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        return false;
    }
}

async function getQueueStats() {
    try {
        const result = await prisma.$queryRaw<Array<{
            total: bigint,
            handled: bigint,
            failed: bigint,
            handled_percentage: number,
            failed_percentage: number
        }>>`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN handled = true THEN 1 END) as handled,
                COUNT(CASE WHEN handled = false AND "retryCount" >= 3 THEN 1 END) as failed,
                ROUND(
                    COUNT(CASE WHEN handled = true THEN 1 END)::numeric / COUNT(*)::numeric * 100, 
                    4
                ) as handled_percentage,
                ROUND(
                    COUNT(CASE WHEN handled = false AND "retryCount" >= 3 THEN 1 END)::numeric / COUNT(*)::numeric * 100, 
                    4
                ) as failed_percentage
            FROM "RequestQueue"
        `;
        
        if (result.length > 0) {
            const stats = result[0];
            const total = Number(stats.total);
            const handled = Number(stats.handled);
            const failed = Number(stats.failed);
            const handledPercentage = Number(stats.handled_percentage);
            const failedPercentage = Number(stats.failed_percentage);
            
            console.log(`Total Requests: ${total.toLocaleString()}`);
            console.log(`Handled: ${handled.toLocaleString()} (${handledPercentage}%)`);
            console.log(`Failed: ${failed.toLocaleString()} (${failedPercentage}%)`);
        } else {
            console.log('No requests found in queue');
        }
    } catch (error) {
        console.error('Database connection failed');
        process.exit(1);
    }
}

async function main() {
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
        console.error('Database connection failed');
        process.exit(1);
    }
    
    await getQueueStats();
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());