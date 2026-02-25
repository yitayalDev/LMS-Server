import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
    name: string;
    description?: string;
    logo?: string;
    primaryColor?: string;
    domain?: string; // For restricted signups
    admin: mongoose.Types.ObjectId;
    subscription?: mongoose.Types.ObjectId;
    maxSeats: number;
    allowedIPs?: string[];
    webhookUrl?: string;
    createdAt: Date;
}

const OrganizationSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    logo: { type: String },
    primaryColor: { type: String, default: '#3b82f6' },
    domain: { type: String },
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    maxSeats: { type: Number, default: 5 },
    allowedIPs: [{ type: String }],
    webhookUrl: { type: String }
}, { timestamps: true });

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
