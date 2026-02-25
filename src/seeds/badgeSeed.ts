import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Badge from '../models/Badge';

dotenv.config();

const badges = [
    {
        name: 'First Step',
        description: 'Complete your first lesson',
        icon: 'Footprints',
        criteriaType: 'lessons_completed',
        criteriaValue: 1
    },
    {
        name: 'Scholar',
        description: 'Pass your first exam',
        icon: 'GraduationCap',
        criteriaType: 'exam_passed',
        criteriaValue: 1
    },
    {
        name: 'Dedication',
        description: 'Earn 100 points',
        icon: 'Zap',
        criteriaType: 'points_milestone',
        criteriaValue: 100
    },
    {
        name: 'Master',
        description: 'Earn 500 points',
        icon: 'Trophy',
        criteriaType: 'points_milestone',
        criteriaValue: 500
    }
];

const seedBadges = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lmsuog');
        console.log('Connected to MongoDB');

        await Badge.deleteMany({});
        await Badge.insertMany(badges);

        console.log('Badges seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding badges:', error);
        process.exit(1);
    }
};

seedBadges();
