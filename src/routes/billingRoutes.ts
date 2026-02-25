import express from 'express';
import { createCheckoutSession, createPortalSession, handleWebhook } from '../controllers/billingController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Webhook needs raw body, already handled in app.ts
router.post('/webhook', handleWebhook);

// Protected routes
router.use(protect);
router.use(authorize('organization', 'admin'));

router.post('/checkout', createCheckoutSession);
router.post('/portal', createPortalSession);

export default router;
