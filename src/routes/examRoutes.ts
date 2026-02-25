import express from 'express';
import { createExam, getCourseExams, submitExam, getExamDetails } from '../controllers/examController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/', authorize('instructor', 'admin'), createExam);
router.get('/course/:courseId', getCourseExams);
router.get('/:id', getExamDetails);
router.post('/:examId/submit', submitExam);

export default router;
