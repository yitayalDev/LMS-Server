import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import passport from 'passport';
import morgan from 'morgan';
import { configurePassport } from './utils/passportConfig';
import authRoutes from './routes/authRoutes';
import courseRoutes from './routes/courseRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import examRoutes from './routes/examRoutes';
import certificateRoutes from './routes/certificateRoutes';
import paymentRoutes from './routes/paymentRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import messageRoutes from './routes/messageRoutes';
import gamificationRoutes from './routes/gamificationRoutes';
import organizationRoutes from './routes/organizationRoutes';
import aiRoutes from './routes/aiRoutes';
import virtualClassroomRoutes from './routes/virtualClassroomRoutes';
import payoutRoutes from './routes/payoutRoutes';
import materialRoutes from './routes/materialRoutes';
import teamRoutes from './routes/teamRoutes';
import ssoRoutes from './routes/ssoRoutes'; // Added ssoRoutes import
import auditRoutes from './routes/auditRoutes';
import userRoutes from './routes/userRoutes';
import settingsRoutes from './routes/settingsRoutes';
import complianceRoutes from './routes/complianceRoutes';
import billingRoutes from './routes/billingRoutes';
import mfaRoutes from './routes/mfaRoutes';
import scormRoutes from './routes/scormRoutes';
import discussionRoutes from './routes/discussionRoutes';
import notificationRoutes from './routes/notificationRoutes';
import referralRoutes from './routes/referralRoutes';
import reportingRoutes from './routes/reportingRoutes';
import couponRoutes from './routes/couponRoutes';

const app = express();

// Special middleware for Stripe Webhooks to capture raw body
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }), (req: any, res, next) => {
    // This allows us to access req.rawBody in the controller
    req.rawBody = req.body;
    next();
});

// Configure Passport
configurePassport();

// Middleware
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = [clientUrl, 'http://127.0.0.1:3000', 'http://localhost:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.includes(origin) ||
            origin.startsWith('http://10.') ||
            origin.endsWith('.vercel.app');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json());

// JSON Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
        console.error('JSON Parse Error:', err.message);
    }
    next(err);
});

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'LMS UOG API is running',
        healthCheck: '/api/health',
        documentation: 'https://github.com/yitayalDev/LMS-Server'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.use(cookieParser());
app.use(passport.initialize()); // Added passport.initialize()
app.use(morgan('dev')); // Added morgan
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sso', ssoRoutes); // Registered /api/sso route
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/virtual-classrooms', virtualClassroomRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/scorm', scormRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/coupons', couponRoutes);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
    const errorLog = `${new Date().toISOString()} - GLOBAL ERROR (${req.method} ${req.url}): ${err.message}\n${err.stack}\n\n`;
    const logFile = process.env.DEBUG_LOG_PATH || path.join(process.cwd(), 'debug.log');
    try {
        const fs = require('fs');
        fs.appendFileSync(logFile, errorLog);
    } catch (e) { }

    console.error('Global Error:', err);
    res.status(500).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

export default app;
