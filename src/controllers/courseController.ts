import { Request, Response } from 'express';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import CourseMaterial from '../models/CourseMaterial';
import Review from '../models/Review';
import User from '../models/User';
import { logAudit } from '../utils/auditService';
import { sendCourseCreatedEmail } from '../utils/emailService';
import fs from 'fs';
import path from 'path';

export const createCourse = async (req: any, res: Response) => {
    try {
        const { title, description, category, price, level } = req.body;

        // Auto-generate slug (simple version)
        const slug = title.toLowerCase().split(' ').join('-') + '-' + Date.now();

        const course = await Course.create({
            title,
            slug,
            description,
            category,
            price,
            level,
            instructor: req.user.id,
            status: 'draft',
            isApproved: false
        });

        await logAudit({
            userId: req.user.id,
            action: 'COURSE_CREATE',
            resourceType: 'Course',
            resourceId: course.id,
            description: `Instructor created course: ${course.title}`,
            req
        });

        // Fetch instructor user to get email for notification
        const instructorUser = await User.findById(req.user.id);
        if (instructorUser && instructorUser.email) {
            sendCourseCreatedEmail(instructorUser.email, instructorUser.name, course.title).catch(console.error);
        }

        res.status(201).json(course);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getInstructorCourses = async (req: any, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            console.error('getInstructorCourses: No user or user ID found in request');
            return res.status(401).json({ message: 'Not authorized, no user data' });
        }
        const courses = await Course.find({ instructor: req.user.id }).lean();

        // Add enrollment count to each course
        const coursesWithStats = await Promise.all(courses.map(async (course: any) => {
            const enrolledCount = await Enrollment.countDocuments({
                course: course._id,
                status: 'active'
            });
            return { ...course, enrolledCount };
        }));

        res.json(coursesWithStats);
    } catch (error: any) {
        const errorLog = `${new Date().toISOString()} - Error in getInstructorCourses: ${error.message}\n${error.stack}\n\n`;
        const logFile = 'C:\\Users\\meraw\\OneDrive\\Documents\\Desktop\\LMSUOG\\server\\debug.log';
        try {
            fs.appendFileSync(logFile, errorLog);
        } catch (e) { }

        console.error('Error in getInstructorCourses:', error);
        res.status(500).json({
            message: error.message,
            stack: error.stack,
            details: 'Debugging instructor courses error',
            userFound: !!req.user,
            userId: req.user?.id
        });
    }
};

export const addModule = async (req: Request, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const { title, description, contentType, contentData, duration, isFreePreview } = req.body;

        // Calculate order based on current modules length
        const order = course.modules.length;

        course.modules.push({
            title,
            description,
            contentType,
            contentData,
            duration,
            order,
            isFreePreview: isFreePreview || false
        });

        await course.save();
        res.json(course);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateModule = async (req: Request, res: Response) => {
    try {
        const { courseId, moduleId } = req.params;
        const { title, description, contentType, contentData, duration, isFreePreview, order } = req.body;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const moduleIndex = course.modules.findIndex((m: any) => m._id.toString() === moduleId);
        if (moduleIndex === -1) return res.status(404).json({ message: 'Module not found' });

        const module = course.modules[moduleIndex];
        if (title) module.title = title;
        if (description !== undefined) module.description = description;
        if (contentType) module.contentType = contentType;
        if (contentData !== undefined) module.contentData = contentData;
        if (duration !== undefined) module.duration = duration;
        if (order !== undefined) module.order = order;
        if (isFreePreview !== undefined) module.isFreePreview = isFreePreview;

        await course.save();
        res.json(course);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteModule = async (req: Request, res: Response) => {
    try {
        const { courseId, moduleId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        course.modules = course.modules.filter((m: any) => m._id.toString() !== moduleId) as any;

        // Re-calculate orders after deletion
        course.modules.sort((a, b) => a.order - b.order).forEach((m, index) => {
            m.order = index;
        });

        await course.save();
        res.json(course);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const reorderModules = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // courseId
        const { moduleOrders } = req.body; // Array of { moduleId, order }

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        moduleOrders.forEach((item: { moduleId: string, order: number }) => {
            const module = course.modules.find((m: any) => m._id.toString() === item.moduleId);
            if (module) {
                module.order = item.order;
            }
        });

        course.modules.sort((a, b) => a.order - b.order);
        await course.save();

        res.json(course);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllCourses = async (req: any, res: Response) => {
    try {
        let query: any = { status: 'published', isApproved: true };

        // If user is admin, they should see everything
        if (req.user && req.user.role === 'admin') {
            query = {};
        }

        const courses = await Course.find(query).populate('instructor', 'name').lean();

        // Add enrollment count to each course
        const coursesWithStats = await Promise.all(courses.map(async (course: any) => {
            const enrolledCount = await Enrollment.countDocuments({
                course: course._id,
                status: 'active'
            });
            return { ...course, enrolledCount };
        }));

        res.json(coursesWithStats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCourseStatus = async (req: any, res: Response) => {
    try {
        const { status } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) return res.status(404).json({ message: 'Course not found' });

        // Only instructor or admin can update status
        if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        course.status = status;
        await course.save();

        res.json(course);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const approveCourse = async (req: any, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) return res.status(404).json({ message: 'Course not found' });

        course.isApproved = true;
        course.status = 'published'; // Auto-publish on approval
        await course.save();

        await logAudit({
            userId: req.user.id,
            action: 'COURSE_APPROVE',
            resourceType: 'Course',
            resourceId: course.id,
            description: `Admin approved course: ${course.title}`,
            req
        });

        res.json(course);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getCourseBySlug = async (req: Request, res: Response) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug }).populate('instructor', 'name bio').lean();
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const enrolledCount = await Enrollment.countDocuments({
            course: course._id,
            status: 'active'
        });

        // Fetch approved materials for this course
        const materials = await CourseMaterial.find({
            course: course._id,
            status: 'approved'
        }).lean();

        // Merge materials into modules if they aren't already there
        const synthesizedModules = [...(course.modules || [])];

        materials.forEach((mat: any) => {
            // Avoid duplicates if the material was already added as a module
            const exists = synthesizedModules.some((m: any) =>
                m.contentData?.url === mat.fileUrl || m.contentData?.materialId?.toString() === mat._id.toString()
            );

            if (!exists) {
                synthesizedModules.push({
                    _id: mat._id,
                    title: mat.title,
                    description: mat.description,
                    contentType: mat.fileType === 'pdf' ? 'document' : (mat.fileType === 'video' ? 'video' : 'document'),
                    contentData: {
                        url: mat.fileUrl,
                        filename: mat.fileName,
                        materialId: mat._id
                    },
                    order: synthesizedModules.length,
                    isFreePreview: false
                });
            }
        });

        res.json({ ...course, modules: synthesizedModules, enrolledCount });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const rejectCourse = async (req: any, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) return res.status(404).json({ message: 'Course not found' });

        course.isApproved = false;
        course.status = 'draft'; // Move back to draft on rejection
        await course.save();

        await logAudit({
            userId: req.user.id,
            action: 'COURSE_REJECT',
            resourceType: 'Course',
            resourceId: course.id,
            description: `Admin rejected course: ${course.title}`,
            req
        });

        res.json(course);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCourse = async (req: any, res: Response) => {
    try {
        const { title, description, category, price, level } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) return res.status(404).json({ message: 'Course not found' });

        // Only instructor or admin can update
        if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (title) course.title = title;
        if (description) course.description = description;
        if (category) course.category = category;
        if (price !== undefined) course.price = price;
        if (level) course.level = level;

        await course.save();
        res.json(course);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getCourseById = async (req: Request, res: Response) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructor', 'name bio').lean();
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const enrolledCount = await Enrollment.countDocuments({
            course: course._id,
            status: 'active'
        });

        // Fetch approved materials for this course
        const materials = await CourseMaterial.find({
            course: course._id,
            status: 'approved'
        }).lean();

        // Merge materials into modules
        const synthesizedModules = [...(course.modules || [])];

        materials.forEach((mat: any) => {
            const exists = synthesizedModules.some((m: any) =>
                m.contentData?.url === mat.fileUrl || m.contentData?.materialId?.toString() === mat._id.toString()
            );

            if (!exists) {
                synthesizedModules.push({
                    _id: mat._id,
                    title: mat.title,
                    description: mat.description,
                    contentType: mat.fileType === 'pdf' ? 'document' : (mat.fileType === 'video' ? 'video' : 'document'),
                    contentData: {
                        url: mat.fileUrl,
                        filename: mat.fileName,
                        materialId: mat._id
                    },
                    order: synthesizedModules.length,
                    isFreePreview: false
                });
            }
        });

        res.json({ ...course, modules: synthesizedModules, enrolledCount });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const addCourseReview = async (req: any, res: Response) => {
    try {
        const { rating, comment } = req.body;
        const courseId = req.params.id;
        const userId = req.user.id;

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // Check enrollment (cannot review unless enrolled)
        const enrollment = await Enrollment.findOne({ course: courseId, user: userId });
        if (!enrollment && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You must be enrolled to review this course' });
        }

        // Check for existing review
        const existingReview = await Review.findOne({ course: courseId, user: userId });

        if (existingReview) {
            // Update existing review
            existingReview.rating = Number(rating);
            if (comment) existingReview.comment = comment;
            await existingReview.save();
        } else {
            // Create new review
            await Review.create({
                course: courseId,
                user: userId,
                rating: Number(rating),
                comment
            });
        }

        // Calculate new average rating
        const allReviews = await Review.find({ course: courseId });
        const numReviews = allReviews.length;
        const avgRating = allReviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

        // Update Course with new rating metrics Let's initialize if undefined to be safe.
        if (!course.ratings) {
            course.ratings = { average: 0, count: 0 };
        }

        course.ratings.average = avgRating;
        course.ratings.count = numReviews;

        await course.save();

        res.status(201).json({ message: 'Review added/updated successfully', ratings: course.ratings });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getCourseReviews = async (req: Request, res: Response) => {
    try {
        const reviews = await Review.find({ course: req.params.id })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteCourse = async (req: any, res: Response) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Only instructor of the course or admin can delete
        if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete associated data
        await Enrollment.deleteMany({ course: course._id });
        await Review.deleteMany({ course: course._id });
        await CourseMaterial.deleteMany({ course: course._id });

        // Delete the course itself
        await Course.findByIdAndDelete(req.params.id);

        await logAudit({
            userId: req.user.id,
            action: 'COURSE_DELETE',
            resourceType: 'Course',
            resourceId: course.id,
            description: `${req.user.role === 'admin' ? 'Admin' : 'Instructor'} deleted course: ${course.title}`,
            req
        });

        res.json({ message: 'Course deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
