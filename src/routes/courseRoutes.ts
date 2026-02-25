import express, { Response } from 'express';
import { createCourse, getInstructorCourses, getCourseById, addModule, updateModule, deleteModule, reorderModules, getAllCourses, getCourseBySlug, updateCourseStatus, approveCourse, rejectCourse, updateCourse, addCourseReview, getCourseReviews, deleteCourse } from '../controllers/courseController';
import { protect, authorize, protectOptional } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

router.get('/', protectOptional, getAllCourses);
router.get('/details/:slug', getCourseBySlug);
router.get('/instructor', protect, authorize('instructor', 'admin'), getInstructorCourses);
router.get('/:id', protect, getCourseById);
router.get('/:id/reviews', getCourseReviews); // Public/Student accessible view
router.post('/:id/reviews', protect, addCourseReview); // Enrolled student only

// All course management routes require instructor or admin role
router.use(protect);

router.patch('/:id/status', updateCourseStatus);
router.patch('/:id/approve', authorize('admin'), approveCourse);
router.patch('/:id/reject', authorize('admin'), rejectCourse);
router.patch('/:id', authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', authorize('instructor', 'admin'), deleteCourse);

router.use(authorize('instructor', 'admin'));

router.post('/', createCourse);
router.post('/:id/modules', addModule);
router.put('/:courseId/modules/:moduleId', updateModule);
router.delete('/:courseId/modules/:moduleId', deleteModule);
router.put('/:id/modules/reorder', reorderModules);

router.post('/upload', upload.single('file'), (req: any, res: Response) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Normalize path and ensure it's relative to the project root starting with /uploads
    let normalizedPath = req.file.path.replace(/\\/g, '/');

    // If for some reason path is absolute, extract from 'uploads' onwards
    if (normalizedPath.includes('uploads/')) {
        normalizedPath = normalizedPath.substring(normalizedPath.indexOf('uploads/'));
    }

    res.json({
        url: `/${normalizedPath}`,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
    });
});

export default router;
