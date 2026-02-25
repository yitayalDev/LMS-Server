import express from 'express';
import { createSession, getCourseSessions, updateSessionStatus, getInstructorSessions, getMyUpcomingSessions } from '../controllers/virtualClassroomController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, authorize('instructor', 'admin'), getInstructorSessions);
router.post('/', protect, authorize('instructor', 'admin'), createSession);
router.get('/course/:courseId', protect, getCourseSessions);
router.get('/my-sessions', protect, getMyUpcomingSessions);
router.patch('/:id/status', protect, authorize('instructor', 'admin'), updateSessionStatus);

export default router;
