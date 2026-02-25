import express from 'express';
import { getComplianceSummary, getUserComplianceDetail } from '../controllers/complianceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'organization', 'manager'));

router.get('/summary', getComplianceSummary);
router.get('/user/:userId', getUserComplianceDetail);

export default router;
