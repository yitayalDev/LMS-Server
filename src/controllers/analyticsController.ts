import { Request, Response } from 'express';
import Order from '../models/Order';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import ExamAttempt from '../models/ExamAttempt';
import User from '../models/User';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export const getInstructorStats = async (req: any, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            console.error('getInstructorStats: No user or user ID found in request');
            return res.status(401).json({ message: 'Not authorized, no user data' });
        }

        const instructorId = new mongoose.Types.ObjectId(req.user.id);
        const courses = await Course.find({ instructor: instructorId });

        if (courses.length === 0) {
            return res.json({
                totalCourses: 0,
                totalStudents: 0,
                revenue: [],
                enrollments: []
            });
        }

        const courseIds = courses.map(c => c._id);

        // 1. Total Students (Unique enrollments across instructor courses)
        const totalStudents = await Enrollment.distinct('user', { course: { $in: courseIds } });

        // 2. Revenue over time (Last 6 months)
        const revenueStats = await Order.aggregate([
            { $match: { course: { $in: courseIds }, status: 'completed' } },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // 3. Enrollment distribution per course
        const enrollmentStats = await Enrollment.aggregate([
            { $match: { course: { $in: courseIds } } },
            {
                $group: {
                    _id: '$course',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'courseDetails'
                }
            },
            { $unwind: '$courseDetails' },
            {
                $project: {
                    name: '$courseDetails.title',
                    students: '$count'
                }
            }
        ]);

        res.json({
            totalCourses: courses.length,
            totalStudents: totalStudents.length,
            revenue: revenueStats,
            enrollments: enrollmentStats
        });
    } catch (error: any) {
        const errorLog = `${new Date().toISOString()} - Error in getInstructorStats: ${error.message}\n${error.stack}\n\n`;
        const logFile = 'C:\\Users\\meraw\\OneDrive\\Documents\\Desktop\\LMSUOG\\server\\debug.log';
        try {
            fs.appendFileSync(logFile, errorLog);
        } catch (e) { }
        res.status(500).json({ message: error.message });
    }
};

export const getStudentProgressStats = async (req: any, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // 1. Course Progress distribution
        const enrollments = await Enrollment.find({ user: userId }).populate('course', 'title');

        // 2. Exam Scores history
        const examAttempts = await ExamAttempt.find({ user: userId })
            .populate('exam', 'title')
            .sort({ createdAt: 1 })
            .limit(10);

        res.json({
            progress: enrollments.map(e => ({
                name: (e.course as any).title,
                progress: e.progress
            })),
            exams: examAttempts.map(a => ({
                name: (a.exam as any).title,
                score: a.percentage,
                date: a.completedAt
            }))
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAdminStats = async (req: any, res: Response) => {
    try {
        // 1. Users by role
        const userStats = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // 2. Revenue growth (Monthly)
        const revenueStats = await Order.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // 3. Top Courses by enrollment
        const topCourses = await Enrollment.aggregate([
            { $group: { _id: '$course', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: '$course' },
            {
                $project: {
                    title: '$course.title',
                    count: 1
                }
            }
        ]);

        // 4. Totals
        const totalCourses = await Course.countDocuments();
        const totalOrders = await Order.countDocuments({ status: 'completed' });

        res.json({
            users: userStats,
            revenue: revenueStats,
            topCourses,
            totalCourses,
            totalOrders
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

