import express from 'express';
import { setupMfa, verifyMfa, disableMfa } from '../controllers/mfaController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect); // All MFA routes require authentication

router.post('/setup', setupMfa);
router.post('/verify', verifyMfa);
router.post('/disable', disableMfa);

export default router;
