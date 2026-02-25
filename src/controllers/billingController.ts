import { Request, Response } from 'express';
import Stripe from 'stripe';
import Organization from '../models/Organization';
import Subscription from '../models/Subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-01-27' as any,
});

export const createCheckoutSession = async (req: any, res: Response) => {
    try {
        const { planId } = req.body;
        const userId = req.user.id;
        const organizationId = req.user.organization;

        if (!organizationId) {
            return res.status(403).json({ message: 'Only organizations can subscribe to plans' });
        }

        const organization = await Organization.findById(organizationId);
        if (!organization) return res.status(404).json({ message: 'Organization not found' });

        // Map internal plan IDs to Stripe Price IDs
        const planPriceMap: { [key: string]: string } = {
            starter: process.env.STRIPE_PRICE_STARTER || '',
            pro: process.env.STRIPE_PRICE_PRO || '',
            enterprise: process.env.STRIPE_PRICE_ENTERPRISE || ''
        };

        const priceId = planPriceMap[planId];
        if (!priceId) return res.status(400).json({ message: 'Invalid plan selected' });

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.CLIENT_URL}/dashboard/organization/billing?success=true`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard/organization/billing?canceled=true`,
            customer_email: req.user.email,
            client_reference_id: organizationId.toString(),
            metadata: { organizationId: organizationId.toString(), planId }
        });

        res.json({ url: session.url });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createPortalSession = async (req: any, res: Response) => {
    try {
        const organizationId = req.user.organization;
        const subscription = await Subscription.findOne({ owner: organizationId });

        if (!subscription || !subscription.stripeCustomerId) {
            return res.status(404).json({ message: 'No active subscription found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${process.env.CLIENT_URL}/dashboard/organization/billing`,
        });

        res.json({ url: session.url });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            (req as any).rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const stripeSubscription = event.data.object as any;
                const organizationId = stripeSubscription.metadata.organizationId;
                const planId = stripeSubscription.metadata.planId;

                const status = stripeSubscription.status;
                const currentPeriodEnd = new Date((stripeSubscription.current_period_end || stripeSubscription.billing_cycle_anchor) * 1000);

                await Subscription.findOneAndUpdate(
                    { stripeSubscriptionId: stripeSubscription.id },
                    {
                        owner: organizationId,
                        ownerType: 'Organization',
                        stripeCustomerId: stripeSubscription.customer as string,
                        planId,
                        status,
                        currentPeriodEnd,
                        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
                    },
                    { upsert: true }
                );

                // Update Organization seat limits
                const seatLimits: { [key: string]: number } = { starter: 10, pro: 50, enterprise: 500 };
                const subDoc = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
                await Organization.findByIdAndUpdate(organizationId, {
                    subscription: subDoc?._id,
                    maxSeats: seatLimits[planId as string] || 5
                });
                break;
            }
            case 'customer.subscription.deleted': {
                const deletedSub = event.data.object as any;
                await Subscription.findOneAndUpdate(
                    { stripeSubscriptionId: deletedSub.id },
                    { status: 'canceled' }
                );
                break;
            }
        }
        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing failed', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};
