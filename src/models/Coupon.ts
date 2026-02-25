import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    expiryDate: Date;
    maxUses?: number;
    currentUses: number;
    isActive: boolean;
    course?: mongoose.Types.ObjectId; // Optional: Coupon for specific course
}

const CouponSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    maxUses: { type: Number },
    currentUses: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course' }
}, { timestamps: true });

export default mongoose.model<ICoupon>('Coupon', CouponSchema);
