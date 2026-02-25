import { Response } from 'express';
import User from '../models/User';

export const getReferralStats = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('referralCode points');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const referrals = await User.find({ referredBy: userId }).select('name createdAt');

        res.json({
            referralCode: user.referralCode,
            totalPoints: user.points,
            referralCount: referrals.length,
            referrals: referrals.map(r => ({
                name: r.name,
                date: r.createdAt
            }))
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
