import { Request, Response } from 'express';
import VirtualClassroom from '../models/VirtualClassroom';
import Enrollment from '../models/Enrollment';

export const getInstructorSessions = async (req: any, res: Response) => {
    try {
        const sessions = await VirtualClassroom.find({ instructor: req.user.id })
            .populate('course', 'title')
            .sort({ startTime: 1 });
        res.json(sessions);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createSession = async (req: any, res: Response) => {
    try {
        const { course, title, description, startTime, duration, platform } = req.body;

        // Simulated link generation
        const meetingId = Math.random().toString(36).substring(7).toUpperCase();
        const joinUrl = platform === 'zoom'
            ? `https://zoom.us/j/${meetingId}`
            : platform === 'teams'
                ? `https://teams.microsoft.com/l/meetup-join/${meetingId}`
                : `https://meet.lmsuog.com/${meetingId}`;

        const session = await VirtualClassroom.create({
            course,
            instructor: req.user.id,
            title,
            description,
            startTime,
            duration,
            platform,
            joinUrl,
            meetingId
        });

        res.status(201).json(session);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getCourseSessions = async (req: Request, res: Response) => {
    try {
        const sessions = await VirtualClassroom.find({ course: req.params.courseId })
            .sort({ startTime: 1 });
        res.json(sessions);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateSessionStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const session = await VirtualClassroom.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(session);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyUpcomingSessions = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        // 1. Find all active enrollments for the user
        const enrollments = await Enrollment.find({ user: userId, status: 'active' }).select('course');
        const enrolledCourseIds = enrollments.map(e => e.course);

        // 2. Find upcoming sessions for these courses
        const sessions = await VirtualClassroom.find({
            course: { $in: enrolledCourseIds },
            startTime: { $gte: new Date() },
            status: { $in: ['scheduled', 'live'] }
        })
            .populate('course', 'title')
            .populate('instructor', 'name avatar')
            .sort({ startTime: 1 });

        res.json(sessions);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

