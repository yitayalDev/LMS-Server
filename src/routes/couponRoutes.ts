import express from 'express';
import { validateCoupon, getAllCoupons, createCoupon, deleteCoupon, getCourseCoupons } from '../controllers/couponController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/course/:courseId', getCourseCoupons); // Public - no auth needed
router.post('/validate', protect, validateCoupon);
router.get('/', protect, authorize('admin'), getAllCoupons);
router.post('/', protect, authorize('admin'), createCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

export default router;



