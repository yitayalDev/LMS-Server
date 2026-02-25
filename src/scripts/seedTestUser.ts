import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import path from 'path';

const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const seedTestUser = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/lmsuog';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const email = 'testuser@example.com';
        const password = 'password123';

        // Delete existing if any
        await User.deleteOne({ email });

        const user = await User.create({
            name: 'Test User',
            email,
            password, // Hook will hash it
            role: 'student',
            isVerified: true
        });

        console.log(`Created test user: ${email} / ${password}`);
        console.log(`Hash length: ${user.password.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

seedTestUser();
