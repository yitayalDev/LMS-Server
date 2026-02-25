import express from 'express';
import { getSettings, updateSettings, uploadLogo } from '../controllers/settingsController';
import { protect, authorize } from '../middleware/authMiddleware';
import { uploadBranding } from '../middleware/uploadMiddleware';

const router = express.Router();

// Public route to fetch platform branding/settings
router.get('/', getSettings);

// Protected admin-only routes
router.patch('/', protect, authorize('admin'), updateSettings);
router.post('/upload-logo', protect, authorize('admin'), uploadBranding.single('logo'), uploadLogo);

export default router;
