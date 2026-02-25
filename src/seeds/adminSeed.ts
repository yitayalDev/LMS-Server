import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lmsuog');
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ email: 'admin@lmsuog.com' });
        if (admin) {
            admin.password = 'admin123';
            admin.role = 'admin'; // Ensure role is restored if demoted
            await admin.save();
            console.log('Admin account restored and password reset (admin@lmsuog.com / admin123)');
            process.exit();
        }

        await User.create({
            name: 'System Admin',
            email: 'admin@lmsuog.com',
            password: 'admin123',
            role: 'admin',
            isVerified: true
        });

        console.log('Admin user seeded successfully (admin@lmsuog.com / admin123)');
        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
