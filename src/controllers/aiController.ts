import { Request, Response } from 'express';
import { aiService } from '../utils/aiService';
import Course from '../models/Course';

/**
 * AI Controller
 */
export const askTutor = async (req: Request, res: Response) => {
    try {
        const { courseId, question, context } = req.body;

        // Use provided context or fetch course title
        let courseContext = context;
        if (courseId && !courseContext) {
            const course = await Course.findById(courseId);
            courseContext = course?.title || 'General Tutoring';
        }

        const response = await aiService.generateTutorResponse(courseContext || 'General Learning', question);
        res.json({ answer: response });
    } catch (error: any) {
        const fs = require('fs');
        const logFile = 'C:\\Users\\meraw\\OneDrive\\Documents\\Desktop\\LMSUOG\\server\\debug.log';
        fs.appendFileSync(logFile, `${new Date().toISOString()} - AI CONTROLLER ERROR: ${error.message}\n${error.stack}\n\n`);
        console.error('AI Controller Error:', error);

        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: error.message });
    }
};

export const generateQuiz = async (req: Request, res: Response) => {
    try {
        const { content, count } = req.body;
        if (!content) return res.status(400).json({ message: 'Content is required' });

        const questions = await aiService.generateQuizQuestions(content, count || 5);
        res.json(questions);
    } catch (error: any) {
        console.error('AI Quiz Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getRecommendations = async (req: any, res: Response) => {
    try {
        const availableCourses = await Course.find({ status: 'published', isApproved: true }).limit(10);

        const studentInfo = {
            interests: req.user?.role === 'student' ? 'General learning' : 'Teaching',
            completedCourses: []
        };

        const recommendedIds = await aiService.getRecommendations(studentInfo, availableCourses);
        const recommendations = await Course.find({ _id: { $in: recommendedIds } }).populate('instructor', 'name');

        res.json(recommendations);
    } catch (error: any) {
        console.error('AI Recommendation Error:', error);
        res.status(500).json({ message: error.message });
    }
};
