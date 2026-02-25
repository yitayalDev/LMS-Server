import express from 'express';
import { enrollInCourse, getMyEnrollments, completeModule, getEnrollmentByCourse, getCourseStudents } from '../controllers/enrollmentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/enroll/:courseId', enrollInCourse);
router.get('/my-courses', getMyEnrollments);
router.get('/course/:courseId', getEnrollmentByCourse);
router.get('/course/:courseId/students', getCourseStudents);
router.post('/course/:courseId/complete-module', completeModule);

export default router;
