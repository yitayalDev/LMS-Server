import express from 'express';
import { getReferralStats } from '../controllers/referralController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/stats', protect, getReferralStats);

export default router;
