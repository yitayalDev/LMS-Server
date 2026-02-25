import express from 'express';
import { getLeaderboard, getMyRewards } from '../controllers/gamificationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/me', protect, getMyRewards);

export default router;
