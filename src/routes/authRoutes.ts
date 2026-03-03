import express from 'express';
import { register, login, getMe, getAllUsers, adminCreateUser, adminUpdateUserStatus, adminUpdateUser, searchUsers } from '../controllers/authController';
import { protect, authorize } from '../middleware/authMiddleware';
import { restrictDemo } from '../middleware/demoMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/search', protect, searchUsers);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.post('/admin/create-user', protect, authorize('admin'), restrictDemo, adminCreateUser);
router.patch('/admin/update-status/:id', protect, authorize('admin'), restrictDemo, adminUpdateUserStatus);
router.patch('/admin/update-user/:id', protect, authorize('admin'), restrictDemo, adminUpdateUser);
router.get('/me', protect, getMe);

export default router;
