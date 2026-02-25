import { Request, Response } from 'express';
import User from '../models/User';
import Badge from '../models/Badge';

/**
 * Utility to award points and check for badge milestones
 */
export const awardPoints = async (userId: string, points: number, reason: string) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        user.points += points;

        // Check for "points_milestone" badges
        const badges = await Badge.find({ criteriaType: 'points_milestone' });
        for (const badge of badges) {
            const alreadyHas = user.badges.some(b => b.badge.toString() === badge._id.toString());
            if (!alreadyHas && user.points >= badge.criteriaValue) {
                user.badges.push({ badge: badge._id as any, awardedAt: new Date() });
            }
        }

        await user.save();
        console.log(`Awarded ${points} points to ${user.name} for: ${reason}`);
    } catch (error) {
        console.error('Error awarding points:', error);
    }
};

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const topUsers = await User.aggregate([
            { $match: { role: 'student' } },
            { $sort: { points: -1, loginStreak: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'badges',
                    localField: 'badges.badge',
                    foreignField: '_id',
                    as: 'populatedBadges'
                }
            },
            {
                $project: {
                    name: 1,
                    avatar: 1,
                    points: 1,
                    loginStreak: { $ifNull: ['$loginStreak', 0] },
                    badges: '$populatedBadges'
                }
            }
        ]);

        res.json(topUsers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyRewards = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user.id)
            .select('points badges')
            .populate('badges.badge');

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
