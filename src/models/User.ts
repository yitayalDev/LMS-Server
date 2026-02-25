import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'instructor' | 'student' | 'organization' | 'moderator' | 'manager';
    isVerified: boolean;
    avatar?: string;
    bio?: string;
    instructorDetails?: {
        cvUrl?: string;
        topic?: string;
        status: 'pending' | 'approved' | 'rejected';
    };
    organizationDetails?: {
        name: string;
        description?: string;
    };
    points: number;
    badges: {
        badge: mongoose.Types.ObjectId;
        awardedAt: Date;
    }[];
    organization?: mongoose.Types.ObjectId;
    ssoProvider?: 'none' | 'google' | 'azure';
    ssoId?: string;
    mfaEnabled: boolean;
    mfaSecret?: string;
    balance: number;
    payoutSettings?: {
        method: 'paypal' | 'bank_transfer';
        details: string;
    };
    notificationPreferences?: {
        courseUpdates: boolean;
        assignmentDeadlines: boolean;
        newMessages: boolean;
        weeklyDigest: boolean;
    };
    loginStreak: number;
    lastLoginDate?: Date;
    referralCode: string;
    referredBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function (this: any) { return this.ssoProvider === 'none'; } },
    role: {
        type: String,
        enum: ['admin', 'instructor', 'student', 'organization', 'moderator', 'manager'],
        default: 'student'
    },
    isVerified: { type: Boolean, default: false },
    avatar: { type: String },
    bio: { type: String },
    points: { type: Number, default: 0 },
    badges: [{
        badge: { type: Schema.Types.ObjectId, ref: 'Badge' },
        awardedAt: { type: Date, default: Date.now }
    }],
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    ssoProvider: { type: String, enum: ['none', 'google', 'azure'], default: 'none' }, // Added ssoProvider
    ssoId: { type: String }, // Added ssoId
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
    instructorDetails: {
        cvUrl: String,
        topic: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    },
    organizationDetails: {
        name: String,
        description: String
    },
    balance: { type: Number, default: 0 },
    payoutSettings: {
        method: { type: String, enum: ['paypal', 'bank_transfer'] },
        details: String
    },
    notificationPreferences: {
        courseUpdates: { type: Boolean, default: true },
        assignmentDeadlines: { type: Boolean, default: true },
        newMessages: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: false }
    },
    loginStreak: { type: Number, default: 0 },
    lastLoginDate: { type: Date },
    referralCode: { type: String, unique: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

UserSchema.pre<IUser>('save', async function () {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    if (!this.referralCode) {
        this.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
