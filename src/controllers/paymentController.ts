import { Request, Response } from 'express';
import Stripe from 'stripe';
import Order from '../models/Order';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import User from '../models/User';
import Coupon from '../models/Coupon';
import { awardPoints } from './gamificationController';
import { sendPaymentSuccessEmail } from '../utils/emailService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18' as any, // Resolved version format mismatch
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

export const createCheckoutSession = async (req: any, res: Response) => {
    try {
        const { courseId, formData, couponCode } = req.body;
        const userId = req.user.id;

        console.log('Creating checkout session for user:', userId, 'course:', courseId);

        const course = await Course.findById(courseId);
        if (!course) {
            console.log('Course not found:', courseId);
            return res.status(404).json({ message: 'Course not found' });
        }

        console.log('Course found:', course.title, 'Price:', course.price);

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId });
        if (existingEnrollment) {
            console.log('User already enrolled in course');
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        // Coupon Logic
        let finalPrice = course.price;
        let appliedCoupon = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
            if (coupon) {
                const now = new Date();
                const isExpired = new Date(coupon.expiryDate) < now;
                const limitReached = coupon.maxUses && coupon.currentUses >= coupon.maxUses;
                const courseMismatch = coupon.course && coupon.course.toString() !== courseId;

                if (!isExpired && !limitReached && !courseMismatch) {
                    if (coupon.discountType === 'percentage') {
                        finalPrice = course.price * (1 - coupon.discountValue / 100);
                    } else {
                        finalPrice = Math.max(0, course.price - coupon.discountValue);
                    }
                    appliedCoupon = coupon;
                }
            }
        }

        // Development mode bypass - if Stripe keys are placeholders, enroll directly
        const isDevMode = !process.env.STRIPE_SECRET_KEY ||
            process.env.STRIPE_SECRET_KEY === '' ||
            process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder';

        if (isDevMode) {
            console.log('⚠️  DEVELOPMENT MODE: Bypassing Stripe payment, enrolling directly');

            // Create a mock order for record keeping
            await Order.create({
                user: userId,
                course: courseId,
                instructor: course.instructor,
                organization: course.organization,
                amount: finalPrice,
                stripeSessionId: `dev_${Date.now()}`,
                status: 'completed',
                platformFee: finalPrice * 0.20,
                instructorEarnings: finalPrice * 0.80,
                formData
            });

            if (appliedCoupon) {
                appliedCoupon.currentUses += 1;
                await appliedCoupon.save();
            }

            // Update instructor balance
            await User.findByIdAndUpdate(course.instructor, {
                $inc: { balance: finalPrice * 0.80 }
            });

            // Enroll user directly
            await Enrollment.create({
                user: userId,
                course: courseId,
                status: 'active',
                progress: 0,
                formData
            });

            // Award points for course purchase
            await awardPoints(userId as string, 100, 'Course Purchase');

            // Send async payment success notification
            const studentUser = await User.findById(userId);
            if (studentUser && studentUser.email) {
                sendPaymentSuccessEmail(studentUser.email, studentUser.name, course.title, course.price).catch(console.error);
            }

            console.log('✅ Development enrollment completed');

            // Return a mock success URL that redirects to the course
            return res.json({
                id: `dev_session_${Date.now()}`,
                url: `${CLIENT_URL}/learn/${course.slug}?dev_enrolled=true`
            });
        }

        // Production mode - use Stripe
        console.log('Creating Stripe checkout session...');
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: req.user.email,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: course.title,
                            description: (course as any).subtitle || course.description,
                            images: course.thumbnail ? [course.thumbnail] : [],
                        },
                        unit_amount: Math.round(finalPrice * 100), // Stripe expects amounts in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&course_slug=${course.slug}`,
            cancel_url: `${CLIENT_URL}/courses/${course.slug}`,
            metadata: {
                courseId: courseId.toString(),
                userId: userId.toString(),
                instructorId: course.instructor.toString(),
                couponCode: appliedCoupon ? appliedCoupon.code : '',
            },
        });

        console.log('Stripe session created:', session.id);

        // Create pending order
        await Order.create({
            user: userId,
            course: courseId,
            instructor: course.instructor,
            organization: course.organization,
            amount: finalPrice,
            stripeSessionId: session.id,
            status: 'pending',
            formData
        });

        console.log('Order created, returning session URL');
        res.json({ id: session.id, url: session.url });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        console.error('Error details:', {
            message: error.message,
            type: error.type,
            code: error.code,
            statusCode: error.statusCode,
            raw: error.raw
        });

        let errorMessage = 'Failed to create checkout session';

        if (error.type === 'StripeInvalidRequestError') {
            errorMessage = 'Invalid payment request. Please try again.';
        } else if (error.type === 'StripeAuthenticationError') {
            errorMessage = 'Payment system authentication failed. Please contact support.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(500).json({ message: errorMessage });
    }
};

export const stripeWebhook = async (req: Request, res: Response) => {
    let event;

    try {
        const signature = req.headers['stripe-signature'] as string;
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const { courseId, userId, instructorId } = session.metadata || {};

        if (courseId && userId && instructorId) {
            const amount = session.amount_total ? session.amount_total / 100 : 0;
            const platformFee = amount * 0.20;
            const instructorEarnings = amount - platformFee;
            const { couponCode } = session.metadata || {};

            // Update order status
            await Order.findOneAndUpdate(
                { stripeSessionId: session.id },
                {
                    status: 'completed',
                    platformFee,
                    instructorEarnings
                }
            );

            // Increment coupon usage if used
            if (couponCode) {
                await Coupon.findOneAndUpdate(
                    { code: couponCode },
                    { $inc: { currentUses: 1 } }
                );
            }

            // Update instructor balance
            await User.findByIdAndUpdate(instructorId, {
                $inc: { balance: instructorEarnings }
            });

            // Get order to retrieve formData
            const order = await Order.findOne({ stripeSessionId: session.id });

            // Enroll user
            await Enrollment.findOneAndUpdate(
                { user: userId, course: courseId },
                {
                    user: userId,
                    course: courseId,
                    status: 'active',
                    progress: 0,
                    formData: order?.formData
                },
                { upsert: true, new: true }
            );

            // Award points for course purchase
            await awardPoints(userId as string, 100, 'Course Purchase');

            // Send async payment success notification
            const studentUser = await User.findById(userId);
            const course = await Course.findById(courseId);
            if (studentUser && studentUser.email && course) {
                sendPaymentSuccessEmail(studentUser.email, studentUser.name, course.title, amount).catch(console.error);
            }
        }
    }

    res.json({ received: true });
};
