import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:notificationId/read', markAsRead);

export default router;
