import express from 'express';
import { askTutor, generateQuiz, getRecommendations } from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/ask', protect, askTutor);
router.post('/generate-quiz', protect, generateQuiz);
router.get('/recommendations', protect, getRecommendations);

export default router;
