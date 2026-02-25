import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const migrateCourses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lmsuog');
        console.log('Connected to MongoDB');

        // Using any to bypass TS checks on the removed 'curriculum' field
        const courses: any[] = await Course.find({});
        let updatedCount = 0;

        for (const course of courses) {
            // Check if course has legacy curriculum but no new modules
            if (course.curriculum && course.curriculum.length > 0 && (!course.modules || course.modules.length === 0)) {
                console.log(`Migrating course: ${course.title}`);
                const newModules: any[] = [];
                let order = 0;

                for (const module of course.curriculum) {
                    for (const lesson of module.lessons) {
                        newModules.push({
                            title: `${module.title}: ${lesson.title}`,
                            description: lesson.description || `Part of ${module.title}`,
                            contentType: lesson.type || 'video',
                            contentData: {
                                url: lesson.contentUrl,
                            },
                            duration: lesson.duration || 0,
                            order: order++,
                            isFreePreview: lesson.isFreePreview || false
                        });
                    }
                }

                course.modules = newModules;
                // Optional: course.curriculum = undefined; // If you want to delete the old field
                await course.save();
                updatedCount++;
            }
        }

        console.log(`Migration complete. ${updatedCount} courses updated.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateCourses();
