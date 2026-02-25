import mongoose, { Schema, Document } from 'mongoose';

export interface IPayout extends Document {
    instructor: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    payoutMethod: 'paypal' | 'bank_transfer';
    payoutDetails: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    processedAt?: Date;
    adminNotes?: string;
    createdAt: Date;
}

const PayoutSchema: Schema = new Schema({
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    payoutMethod: {
        type: String,
        enum: ['paypal', 'bank_transfer'],
        required: true
    },
    payoutDetails: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'paid'],
        default: 'pending'
    },
    processedAt: Date,
    adminNotes: String
}, { timestamps: true });

export default mongoose.model<IPayout>('Payout', PayoutSchema);
