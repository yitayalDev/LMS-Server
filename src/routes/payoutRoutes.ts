import express from 'express';
import {
    requestPayout,
    getInstructorPayouts,
    getAllPayouts,
    updatePayoutStatus,
    getPlatformStats,
    getInstructorStats
} from '../controllers/payoutController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

// Instructor routes
router.post('/request', authorize('instructor'), requestPayout);
router.get('/my-payouts', authorize('instructor'), getInstructorPayouts);
router.get('/instructor-stats', authorize('instructor'), getInstructorStats);

// Admin routes
router.get('/all', authorize('admin'), getAllPayouts);
router.patch('/:id/status', authorize('admin'), updatePayoutStatus);
router.get('/platform-stats', authorize('admin'), getPlatformStats);

export default router;
