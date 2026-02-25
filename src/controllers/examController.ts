import { Request, Response } from 'express';
import Exam from '../models/Exam';
import ExamAttempt from '../models/ExamAttempt';
import Certificate from '../models/Certificate';
import User from '../models/User';
import crypto from 'crypto';
import { awardPoints } from './gamificationController';
import { sendExamResultEmail } from '../utils/emailService';

export const createExam = async (req: any, res: Response) => {
    try {
        const { title, description, course, questions, timeLimit, passingScore } = req.body;

        const exam = await Exam.create({
            title,
            description,
            course,
            questions,
            timeLimit,
            passingScore,
            createdBy: req.user.id
        });

        res.status(201).json(exam);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getCourseExams = async (req: Request, res: Response) => {
    try {
        const exams = await Exam.find({ course: req.params.courseId });
        res.json(exams);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const submitExam = async (req: any, res: Response) => {
    try {
        const { answers } = req.body;
        const examId = req.params.examId;
        const userId = req.user.id;

        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        let score = 0;
        let totalPossiblePoints = 0;

        exam.questions.forEach((question, index) => {
            totalPossiblePoints += question.points;
            if (answers[index] === question.correctAnswer) {
                score += question.points;
            }
        });

        const percentage = (score / totalPossiblePoints) * 100;
        const status = percentage >= exam.passingScore ? 'passed' : 'failed';

        const attempt = await ExamAttempt.create({
            user: userId,
            exam: examId,
            course: exam.course,
            answers,
            score,
            percentage,
            status,
            completedAt: new Date()
        });

        let certificateId = null;
        let certificate = null;

        // Generate Certificate if passed
        if (status === 'passed') {
            const certCode = `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            certificate = await Certificate.create({
                user: userId,
                course: exam.course,
                exam: examId,
                certificateId: certCode
            });
            certificateId = certificate._id;

            // Award points for passing exam
            await awardPoints(userId, 50, `Passed Exam: ${exam.title}`);
        }

        // Send async notification of exam result
        const studentUser = await User.findById(userId);
        if (studentUser && studentUser.email) {
            sendExamResultEmail(studentUser.email, studentUser.name, exam.title, Math.round(percentage), status as 'passed' | 'failed').catch(console.error);
        }

        res.json({ ...attempt.toObject(), certificateId });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getExamDetails = async (req: Request, res: Response) => {
    try {
        // Find exam and hide correct answers for students
        const exam = await Exam.findById(req.params.id)
            .select('-questions.correctAnswer');

        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
