import express from 'express';
import {
    uploadMaterial,
    uploadMultipleMaterials,
    getCourseMaterials,
    getMyMaterials,
    getAllMaterials,
    approveMaterial,
    rejectMaterial,
    updateMaterial,
    deleteMaterial,
    downloadMaterial,
    streamMaterial,
    getStorageStats
} from '../controllers/materialController';
import { protect, authorize } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

// Public/Student routes (require authentication)
router.get('/course/:courseId', protect, getCourseMaterials);
router.get('/download/:id', protect, downloadMaterial);
router.get('/stream/:id', protect, streamMaterial);

// Instructor routes
router.post('/upload', protect, authorize('instructor', 'admin'), upload.single('file'), uploadMaterial);
router.post('/upload-multiple', protect, authorize('instructor', 'admin'), upload.array('files', 10), uploadMultipleMaterials);
router.get('/my-materials', protect, authorize('instructor', 'admin'), getMyMaterials);
router.put('/:id', protect, authorize('instructor', 'admin'), updateMaterial);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteMaterial);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllMaterials);
router.post('/approve/:id', protect, authorize('admin'), approveMaterial);
router.post('/reject/:id', protect, authorize('admin'), rejectMaterial);

// Stats routes
router.get('/stats', protect, authorize('instructor', 'admin'), getStorageStats);

export default router;
