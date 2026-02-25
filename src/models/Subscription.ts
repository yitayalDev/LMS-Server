import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
    owner: mongoose.Types.ObjectId;
    ownerType: 'User' | 'Organization';
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    planId: string; // 'starter' | 'pro' | 'enterprise'
    status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete' | 'unpaid';
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
}

const SubscriptionSchema: Schema = new Schema({
    owner: { type: Schema.Types.ObjectId, required: true, refPath: 'ownerType' },
    ownerType: { type: String, required: true, enum: ['User', 'Organization'] },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    stripeCustomerId: { type: String, required: true },
    planId: { type: String, required: true },
    status: {
        type: String,
        enum: ['active', 'trialing', 'canceled', 'past_due', 'incomplete', 'unpaid'],
        default: 'incomplete'
    },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
