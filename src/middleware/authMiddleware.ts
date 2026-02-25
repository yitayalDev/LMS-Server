import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.query && req.query.token) {
        token = req.query.token as string;
    }

    const logFile = 'C:\\Users\\meraw\\OneDrive\\Documents\\Desktop\\LMSUOG\\server\\debug.log';
    const fs = require('fs');
    const log = (msg: string) => {
        try { fs.appendFileSync(logFile, `${new Date().toISOString()} - [AUTH] ${msg}\n`); } catch (e) { }
    };

    if (!token) {
        log(`No token found in request: ${req.method} ${req.url}`);
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role ${req.user?.role} is not authorized` });
        }
        next();
    };
};

export const protectOptional = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next();
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (error) {
        // Just proceed without user if token is invalid
        next();
    }
};
