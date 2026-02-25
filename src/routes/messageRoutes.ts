import express from 'express';
import { getConversations, getMessages, startConversation, sendMessage, getCourseConversation, markAsRead } from '../controllers/messageController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.get('/conversations/course/:courseId', getCourseConversation);
router.post('/conversations', startConversation);
router.post('/messages', sendMessage);
router.patch('/conversations/:conversationId/read', markAsRead);

export default router;
