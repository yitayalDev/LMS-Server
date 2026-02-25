import express from 'express';
import { uploadScormPackage, scormUpload } from '../controllers/scormController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/upload', protect, authorize('admin', 'instructor'), scormUpload.single('scorm'), uploadScormPackage);

export default router;
