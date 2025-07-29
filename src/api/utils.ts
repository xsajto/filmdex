import { Response } from 'express';
import { log } from '@crawlus/core';

// Helper function for pagination
export const getPagination = (page: unknown, limit: unknown) => {
    const pageNum = Math.max(1, parseInt(String(page || '1')) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '20')) || 20));
    return {
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        page: pageNum,
        limit: limitNum
    };
};

// Helper function for error responses
export const handleError = (res: Response, error: unknown, message: string) => {
    log.error(message, error);
    res.status(500).json({ error: message });
};
