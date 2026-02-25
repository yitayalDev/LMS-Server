import express from 'express';
import { createCheckoutSession, stripeWebhook } from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Webhook must be BEFORE express.json() if we want to use raw body for verification
// But in this setup, we'll handle it carefully in app.ts or use a separate path
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

router.post('/create-checkout-session', protect, createCheckoutSession);

export default router;
