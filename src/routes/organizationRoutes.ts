import express from 'express';
import { createOrganization, getOrganizationDetails, addMemberToOrganization, getAllOrganizations, getMyBilling, updateOrgSettings } from '../controllers/organizationController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/all', protect, authorize('admin'), getAllOrganizations);
router.get('/my-billing', protect, authorize('organization', 'admin', 'manager'), getMyBilling);
router.post('/', protect, authorize('admin'), createOrganization);
router.get('/:id', getOrganizationDetails);
router.post('/:id/members', protect, authorize('admin', 'organization'), addMemberToOrganization);
router.patch('/:id/settings', protect, authorize('admin', 'organization'), updateOrgSettings);

export default router;
