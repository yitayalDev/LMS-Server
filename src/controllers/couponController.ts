import { Request, Response } from 'express';
import Coupon from '../models/Coupon';


export const getCourseCoupons = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const now = new Date();
        // Return coupons specific to this course OR global coupons (no course restriction)
        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gte: now },
            $or: [
                { course: courseId },
                { course: null }
            ]
        }).select('code discountType discountValue expiryDate maxUses currentUses');

        // Filter out coupons that have hit their max uses
        const available = coupons.filter(c => !c.maxUses || c.currentUses < c.maxUses);
        res.json(available);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllCoupons = async (req: Request, res: Response) => {
    try {
        const coupons = await Coupon.find().populate('course', 'title').sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createCoupon = async (req: Request, res: Response) => {
    try {
        const { code, discountType, discountValue, expiryDate, maxUses, course } = req.body;
        if (!code || !discountValue || !expiryDate) {
            return res.status(400).json({ message: 'Code, discountValue, and expiryDate are required' });
        }
        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType: discountType || 'percentage',
            discountValue,
            expiryDate,
            maxUses: maxUses || null,
            course: course || null,
            isActive: true,
        });
        res.status(201).json(coupon);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

export const deleteCoupon = async (req: Request, res: Response) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const validateCoupon = async (req: Request, res: Response) => {
    try {
        const { code, courseId } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Coupon code is required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found or inactive' });
        }

        // Check expiry
        if (new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        // Check max uses
        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        // Check if course specific
        if (coupon.course && coupon.course.toString() !== courseId) {
            return res.status(400).json({ message: 'This coupon is not valid for this course' });
        }

        res.json({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            valid: true
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
