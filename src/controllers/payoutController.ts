import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Payout from '../models/Payout';
import User from '../models/User';
import Order from '../models/Order';

export const requestPayout = async (req: any, res: Response) => {
    try {
        const { amount, payoutMethod, payoutDetails } = req.body;
        const instructorId = req.user.id;

        const user = await User.findById(instructorId);
        if (!user || user.role !== 'instructor') {
            return res.status(403).json({ message: 'Only instructors can request payouts' });
        }

        if (amount > user.balance) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        if (amount < 5) {
            return res.status(400).json({ message: 'Minimum payout amount is $5' });
        }

        const payout = await Payout.create({
            instructor: instructorId,
            amount,
            payoutMethod,
            payoutDetails,
            status: 'pending'
        });

        // Deduct from balance immediately to prevent double spending
        user.balance -= amount;
        await user.save();

        res.status(201).json(payout);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getInstructorPayouts = async (req: any, res: Response) => {
    try {
        const payouts = await Payout.find({ instructor: req.user.id }).sort('-createdAt');
        res.json(payouts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllPayouts = async (req: any, res: Response) => {
    try {
        const payouts = await Payout.find().populate('instructor', 'name email').sort('-createdAt');
        res.json(payouts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePayoutStatus = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const payout = await Payout.findById(id);
        if (!payout) return res.status(404).json({ message: 'Payout not found' });

        if (status === 'rejected' && payout.status === 'pending') {
            // Refund balance if rejected
            await User.findByIdAndUpdate(payout.instructor, {
                $inc: { balance: payout.amount }
            });
        }

        payout.status = status;
        if (adminNotes) payout.adminNotes = adminNotes;
        if (status === 'paid' || status === 'approved') payout.processedAt = new Date();

        await payout.save();
        res.json(payout);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getPlatformStats = async (req: any, res: Response) => {
    try {
        const stats = await Order.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$amount' },
                    totalRevenue: { $sum: '$platformFee' },
                    totalInstructorEarnings: { $sum: '$instructorEarnings' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const pendingPayouts = await Payout.aggregate([
            { $match: { status: 'pending' } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            overview: stats[0] || { totalSales: 0, totalRevenue: 0, totalInstructorEarnings: 0, count: 0 },
            pendingPayouts: pendingPayouts[0] || { total: 0, count: 0 }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getInstructorStats = async (req: any, res: Response) => {
    try {
        const stats = await Order.aggregate([
            { $match: { instructor: new mongoose.Types.ObjectId(req.user.id), status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$instructorEarnings' },
                    totalSales: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const user = await User.findById(req.user.id).select('balance');

        res.json({
            stats: stats[0] || { totalEarnings: 0, totalSales: 0, count: 0 },
            balance: user?.balance || 0
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
