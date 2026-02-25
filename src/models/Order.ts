import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    user: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    instructor: mongoose.Types.ObjectId;
    organization?: mongoose.Types.ObjectId;
    amount: number;
    platformFee: number;
    instructorEarnings: number;
    currency: string;
    stripeSessionId: string;
    status: 'pending' | 'completed' | 'failed';
    formData?: any;
}

const OrderSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    amount: { type: Number, required: true },
    platformFee: { type: Number, required: true, default: 0 },
    instructorEarnings: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'usd' },
    stripeSessionId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    formData: { type: Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);
