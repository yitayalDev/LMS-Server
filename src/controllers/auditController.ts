import { Response } from 'express';
import AuditLog from '../models/AuditLog';

/**
 * Get all audit logs (Admin only)
 * GET /api/audit-logs
 */
export const getAuditLogs = async (req: any, res: Response) => {
    try {
        const { action, resourceType, userEmail, page = 1, limit = 50 } = req.query;
        const query: any = {};

        if (action) query.action = action;
        if (resourceType) query.resourceType = resourceType;

        // If filtering by user email, we'd need a lookup. 
        // For now, simpler filtering.

        const logs = await AuditLog.find(query)
            .populate('user', 'name email role')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await AuditLog.countDocuments(query);

        res.json({
            logs,
            total,
            pages: Math.ceil(total / Number(limit))
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
