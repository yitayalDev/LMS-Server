import express from 'express';
import { exportUserProgressReport, exportComplianceReport } from '../controllers/reportingController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'organization', 'manager'));

router.get('/user-progress', exportUserProgressReport);
router.get('/compliance', exportComplianceReport);

export default router;
