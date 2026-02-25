import AuditLog from '../models/AuditLog';
import { Request } from 'express';

interface AuditParams {
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    description: string;
    changes?: {
        before?: any;
        after?: any;
    };
    req?: Request;
}

/**
 * Logs an administrative or security-critical action to the AuditLog collection.
 */
export const logAudit = async ({
    userId,
    action,
    resourceType,
    resourceId,
    description,
    changes,
    req
}: AuditParams) => {
    try {
        const auditData: any = {
            user: userId,
            action,
            resourceType,
            resourceId,
            description,
            changes,
            ipAddress: req?.ip || (req?.headers ? req.headers['x-forwarded-for'] : undefined),
            userAgent: req?.headers ? req.headers['user-agent'] : undefined
        };
        await AuditLog.create(auditData);
    } catch (error) {
        console.error('FAILED TO WRITE AUDIT LOG:', error);
    }
};
