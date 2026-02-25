import { Request, Response, NextFunction } from 'express';
import Organization from '../models/Organization';

/**
 * IP Whitelist Middleware
 * If an organization has allowedIPs defined, only those IPs can access protected routes.
 */
export const checkIpWhitelist = async (req: any, res: Response, next: NextFunction) => {
    try {
        // Only enforce if user belongs to an organization
        const organizationId = req.user?.organization;
        if (!organizationId) return next();

        const org = await Organization.findById(organizationId).select('allowedIPs');
        if (!org || !org.allowedIPs || org.allowedIPs.length === 0) {
            // No whitelist configured — allow all
            return next();
        }

        const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '';
        const isAllowed = org.allowedIPs.some(allowedIp => {
            // Simple prefix match to support CIDR-like ranges (e.g., "192.168.1.")
            return clientIp.startsWith(allowedIp) || clientIp === allowedIp;
        });

        if (!isAllowed) {
            return res.status(403).json({
                message: 'Access denied: Your IP address is not whitelisted for this organization.'
            });
        }

        next();
    } catch (error) {
        next(); // On error, fail open — don't block legitimate users
    }
};
