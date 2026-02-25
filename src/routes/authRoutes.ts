import express from 'express';
import { register, login, getMe, getAllUsers, adminCreateUser, adminUpdateUserStatus, adminUpdateUser, searchUsers } from '../controllers/authController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/search', protect, searchUsers);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.post('/admin/create-user', protect, authorize('admin'), adminCreateUser);
router.patch('/admin/update-status/:id', protect, authorize('admin'), adminUpdateUserStatus);
router.patch('/admin/update-user/:id', protect, authorize('admin'), adminUpdateUser);
router.get('/me', protect, getMe);

export default router;
