import { Response, Request } from 'express';
import User from '../models/User';
import Course from '../models/Course';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { logAudit } from '../utils/auditService';

interface AuthRequest extends Request {
    user?: any;
    file?: Express.Multer.File;
}

/**
 * Update user profile (name, bio, instructor details)
 */
export const updateProfile = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { name, bio, topic, email } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Handle email change
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use' });
            }
            user.email = email;
        }

        // Update basic fields
        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;

        // Update instructor-specific fields
        if (user.role === 'instructor' && topic) {
            if (!user.instructorDetails) {
                user.instructorDetails = { status: 'pending' };
            }
            user.instructorDetails.topic = topic;
        }

        await user.save();

        await logAudit({
            userId: userId,
            action: 'USER_UPDATE_PROFILE',
            resourceType: 'User',
            resourceId: userId,
            description: `User updated their profile`,
            changes: { after: { name, bio, topic } },
            req
        });

        res.json({
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
                role: user.role,
                instructorDetails: user.instructorDetails
            }
        });
    } catch (error: any) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old avatar if exists
        if (user.avatar) {
            const oldAvatarPath = path.join(process.cwd(), user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // Save new avatar path
        const avatarUrl = `/uploads/avatars/${userId}/${req.file.filename}`;
        user.avatar = avatarUrl;
        await user.save();

        res.json({
            message: 'Avatar uploaded successfully',
            avatar: avatarUrl
        });
    } catch (error: any) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ message: 'Error uploading avatar', error: error.message });
    }
};

/**
 * Update user password
 */
export const updatePassword = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        await logAudit({
            userId: userId,
            action: 'USER_UPDATE_PASSWORD',
            resourceType: 'User',
            resourceId: userId,
            description: `User updated their password`,
            req
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Update password error:', error);
        res.status(500).json({ message: 'Error updating password', error: error.message });
    }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { courseUpdates, assignmentDeadlines, newMessages, weeklyDigest } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize if not exists
        if (!user.notificationPreferences) {
            user.notificationPreferences = {
                courseUpdates: true,
                assignmentDeadlines: true,
                newMessages: true,
                weeklyDigest: false
            };
        }

        // Update preferences
        if (courseUpdates !== undefined) user.notificationPreferences.courseUpdates = courseUpdates;
        if (assignmentDeadlines !== undefined) user.notificationPreferences.assignmentDeadlines = assignmentDeadlines;
        if (newMessages !== undefined) user.notificationPreferences.newMessages = newMessages;
        if (weeklyDigest !== undefined) user.notificationPreferences.weeklyDigest = weeklyDigest;

        await user.save();

        res.json({
            message: 'Notification preferences updated successfully',
            preferences: user.notificationPreferences
        });
    } catch (error: any) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({ message: 'Error updating preferences', error: error.message });
    }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return default preferences if not set
        const preferences = user.notificationPreferences || {
            courseUpdates: true,
            assignmentDeadlines: true,
            newMessages: true,
            weeklyDigest: false
        };

        res.json({ preferences });
    } catch (error: any) {
        console.error('Get notification preferences error:', error);
        res.status(500).json({ message: 'Error fetching preferences', error: error.message });
    }
};

/**
 * Get Public Profile (Instructor)
 */
export const getPublicProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('name avatar bio role instructorDetails');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const courses = await Course.find({ instructor: id, status: 'published' })
            .select('title subtitle price thumbnail ratings slug');

        res.json({
            user,
            courses
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
