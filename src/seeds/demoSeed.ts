import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const seedDemoUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lmsuog');
        console.log('Connected to MongoDB');

        const demoUsers = [
            {
                name: 'Admin Demo',
                email: 'admin-demo@lmsuog.com',
                password: 'demo1234',
                role: 'admin',
                isVerified: true,
                isDemo: true
            },
            {
                name: 'Instructor Demo',
                email: 'instructor-demo@lmsuog.com',
                password: 'demo1234',
                role: 'instructor',
                isVerified: true,
                isDemo: true
            },
            {
                name: 'Student Demo',
                email: 'student-demo@lmsuog.com',
                password: 'demo1234',
                role: 'student',
                isVerified: true,
                isDemo: true
            }
        ];

        for (const userData of demoUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                existingUser.password = userData.password;
                existingUser.role = userData.role as any;
                existingUser.isDemo = true;
                existingUser.isVerified = true;
                // Explicitly mark password as modified to ensure pre-save hook runs
                existingUser.markModified('password');
                await existingUser.save();
                console.log(`Updated demo user: ${userData.email}`);
            } else {
                await User.create(userData);
                console.log(`Created demo user: ${userData.email}`);
            }
        }

        console.log('Demo users seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding demo users:', error);
        process.exit(1);
    }
};

seedDemoUsers();
