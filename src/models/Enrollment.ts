import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
    user: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    progress: number; // percentage
    completedModules: mongoose.Types.ObjectId[];
    status: 'active' | 'completed' | 'cancelled';
    complianceStatus: 'compliant' | 'expiring_soon' | 'expired' | 'not_started';
    enrolledAt: Date;
    completedAt?: Date;
    expiresAt?: Date;
    formData?: any;
}

const EnrollmentSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    progress: { type: Number, default: 0 },
    completedModules: [{ type: Schema.Types.ObjectId }],
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    complianceStatus: {
        type: String,
        enum: ['compliant', 'expiring_soon', 'expired', 'not_started'],
        default: 'not_started'
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: Date,
    expiresAt: Date,
    formData: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Ensure a user can only enroll once in a course
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
