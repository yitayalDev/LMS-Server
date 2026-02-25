import express from 'express';
import {
    updateProfile,
    uploadAvatar as uploadAvatarController,
    updatePassword,
    updateNotificationPreferences,
    getNotificationPreferences,
    getPublicProfile
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { uploadAvatar } from '../middleware/uploadMiddleware';

const router = express.Router();

// All routes require authentication
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, uploadAvatar.single('avatar'), uploadAvatarController);
router.put('/password', protect, updatePassword);
router.put('/notifications', protect, updateNotificationPreferences);
router.get('/notifications', protect, getNotificationPreferences);
router.get('/public-profile/:id', getPublicProfile);

export default router;
