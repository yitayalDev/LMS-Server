import express from 'express';
import { getInstructorStats, getStudentProgressStats, getAdminStats } from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/instructor', authorize('instructor', 'admin'), getInstructorStats);
router.get('/admin', authorize('admin'), getAdminStats);
router.get('/student', getStudentProgressStats);

export default router;
