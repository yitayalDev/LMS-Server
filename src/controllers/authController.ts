import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { logAudit } from '../utils/auditService';
import { sendLoginNotificationEmail } from '../utils/emailService';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

export const register = async (req: Request, res: Response) => {
    const { name, email, password, role, avatar, bio, instructorDetails, referralCode } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('Registration failed: User already exists -', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Admin creation restricted (seed script only)
        if (role === 'admin') {
            console.log('Registration failed: Admin registration not allowed');
            return res.status(400).json({ message: 'Admin registration not allowed' });
        }

        let referredBy;
        if (referralCode) {
            referredBy = await User.findOne({ referralCode: referralCode.toUpperCase() });
            if (referredBy) {
                // Award points to referrer
                referredBy.points += 50;
                await referredBy.save();
            }
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student',
            isVerified: false,
            avatar: avatar || undefined,
            bio: bio || undefined,
            instructorDetails: role === 'instructor' ? instructorDetails : undefined,
            referredBy: referredBy ? referredBy._id : undefined,
            points: referredBy ? 25 : 0 // New user gets 25 points if referred
        });

        if (user) {
            await logAudit({
                userId: user.id,
                action: 'USER_REGISTER',
                resourceType: 'User',
                resourceId: user.id,
                description: `New user registered: ${user.email} as ${user.role}`,
                req
            });

            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                bio: user.bio,
                token: generateToken(user.id),
            });
        }
    } catch (error: any) {
        console.error('Registration Error:', error);
        res.status(400).json({ message: error.message || 'Registration failed due to validation' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user && (await user.comparePassword(password))) {
            await logAudit({
                userId: user.id,
                action: 'USER_LOGIN',
                resourceType: 'User',
                resourceId: user.id,
                description: `User logged in: ${user.email}`,
                req
            });

            // Send async login notification without blocking response
            sendLoginNotificationEmail(user.email, user.name).catch(console.error);

            // Handle Daily Login Streak
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!user.lastLoginDate) {
                user.loginStreak = 1;
            } else {
                const lastLogin = new Date(user.lastLoginDate);
                lastLogin.setHours(0, 0, 0, 0);

                const diffTime = today.getTime() - lastLogin.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    user.loginStreak = (user.loginStreak || 0) + 1;
                } else if (diffDays > 1) {
                    user.loginStreak = 1; // Streak broken
                }
            }
            user.lastLoginDate = new Date();
            await user.save();

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                loginStreak: user.loginStreak,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMe = async (req: any, res: Response) => {
    const user = await User.findById(req.user.id);
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const adminCreateUser = async (req: Request, res: Response) => {
    const { name, email, password, role, instructorDetails } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student',
            instructorDetails: role === 'instructor' ? instructorDetails : undefined,
            isVerified: true
        });

        await logAudit({
            userId: (req as any).user.id,
            action: 'ADMIN_CREATE_USER',
            resourceType: 'User',
            resourceId: user.id,
            description: `Admin created user: ${user.email} with role ${user.role}`,
            req
        });

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const adminUpdateUserStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isVerified, instructorStatus } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (isVerified !== undefined) user.isVerified = isVerified;

        if (user.role === 'instructor' && instructorStatus) {
            if (!user.instructorDetails) {
                user.instructorDetails = { status: instructorStatus };
            } else {
                user.instructorDetails.status = instructorStatus;
            }
        }

        await user.save();

        await logAudit({
            userId: (req as any).user.id,
            action: 'ADMIN_UPDATE_USER_STATUS',
            resourceType: 'User',
            resourceId: user.id,
            description: `Admin updated user status/verification for: ${user.email}`,
            changes: { after: { isVerified, instructorStatus } },
            req
        });

        res.json({ message: 'User status updated successfully', user });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const adminUpdateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role, bio, isVerified } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (bio !== undefined) user.bio = bio;
        if (isVerified !== undefined) user.isVerified = isVerified;

        await user.save();

        await logAudit({
            userId: (req as any).user.id,
            action: 'ADMIN_UPDATE_USER',
            resourceType: 'User',
            resourceId: user.id,
            description: `Admin updated user details for: ${user.email}`,
            changes: { after: { name, email, role, bio, isVerified } },
            req
        });

        res.json({ message: 'User updated successfully', user });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const searchUsers = async (req: any, res: Response) => {
    const query = req.query.query as string || '';
    try {
        const users = await User.find({
            name: { $regex: query, $options: 'i' },
            _id: { $ne: req.user?.id || req.user?._id }
        }).select('name avatar role email').limit(10);
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
