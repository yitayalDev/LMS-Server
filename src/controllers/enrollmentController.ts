import { Request, Response } from 'express';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import { updateEnrollmentCompliance } from '../services/complianceService';

export const enrollInCourse = async (req: any, res: Response) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Only allow direct enrollment for free courses
        if (course.price > 0) {
            return res.status(402).json({
                message: 'Payment required for this course',
                price: course.price
            });
        }

        // Check if progress already exists
        const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        const enrollment = await Enrollment.create({
            user: userId,
            course: courseId,
            progress: 0,
            status: 'active',
            formData: req.body.formData
        });

        res.status(201).json(enrollment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyEnrollments = async (req: any, res: Response) => {
    try {
        const enrollments = await Enrollment.find({ user: req.user.id }).populate('course');
        res.json(enrollments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const completeModule = async (req: any, res: Response) => {
    try {
        const { courseId } = req.params;
        const { moduleId } = req.body;
        const userId = req.user.id;

        const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        if (!enrollment.completedModules.includes(moduleId)) {
            enrollment.completedModules.push(moduleId);

            // Calculate new progress percentage
            const course = await Course.findById(courseId);
            if (course && course.modules.length > 0) {
                enrollment.progress = Math.round((enrollment.completedModules.length / course.modules.length) * 100);

                // Handle course completion
                if (enrollment.progress === 100) {
                    enrollment.status = 'completed';
                    enrollment.completedAt = new Date();
                }

                // Update compliance status
                updateEnrollmentCompliance(enrollment, course);
            }

            await enrollment.save();
        }

        res.json(enrollment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getEnrollmentByCourse = async (req: any, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        res.json(enrollment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getCourseStudents = async (req: any, res: Response) => {
    try {
        const { courseId } = req.params;
        const instructorId = req.user.id;

        // Verify if the course belongs to this instructor
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (course.instructor.toString() !== instructorId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const enrollments = await Enrollment.find({ course: courseId }).populate('user', 'name email avatar');
        res.json(enrollments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
