import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
    user?: any;
}

export const restrictDemo = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.isDemo) {
        const restrictedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

        // Allow login/logout and some specific safe POST/PUT if needed
        const allowedPaths = [
            '/api/auth/login',
            '/api/auth/logout',
            '/api/auth/me'
        ];

        if (restrictedMethods.includes(req.method) && !allowedPaths.includes(req.baseUrl + req.path)) {
            return res.status(403).json({
                message: 'Action restricted in demo mode. Some actions are limited for security reasons.'
            });
        }
    }
    next();
};
