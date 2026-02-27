import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import mongoose from 'mongoose';
import { initSocket } from './socket';
import User from './models/User'; // Added User model import

// TEMPORARY: Admin seeding logic
const runAdminSeed = async () => {
    try {
        const adminEmail = 'admin@lmsuog.com';
        const admin = await User.findOne({ email: adminEmail });

        if (admin) {
            admin.password = 'admin123';
            admin.role = 'admin';
            admin.isVerified = true;
            await admin.save();
            console.log(`✅ Admin account updated: ${adminEmail} / admin123`);
        } else {
            await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: 'admin123',
                role: 'admin',
                isVerified: true
            });
            console.log(`✅ Admin account created: ${adminEmail} / admin123`);
        }
    } catch (err) {
        console.error('❌ Admin seeding failed:', err);
    }
};

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('FATAL ERROR: Neither MONGO_URI nor MONGODB_URI is defined in environment variables.');
    // In production, we should exit if critical config is missing
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

console.log('Attempting to connect to MongoDB...');
mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/lmsuog')
    .then(async () => {
        console.log('✅ MongoDB Connected successfully');
        await runAdminSeed(); // Run the seed here
        server.listen(PORT, () => {
            console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    })
    .catch((err: any) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    });
