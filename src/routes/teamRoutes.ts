import express from 'express';
import {
    createTeam,
    getOrganizationTeams,
    addTeamMember,
    getTeamAnalytics
} from '../controllers/teamController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, authorize('admin', 'organization'), createTeam);
router.get('/organization', protect, authorize('admin', 'organization'), getOrganizationTeams);
router.post('/:teamId/members', protect, authorize('admin', 'organization', 'manager'), addTeamMember);
router.get('/analytics', protect, authorize('manager'), getTeamAnalytics);

export default router;
