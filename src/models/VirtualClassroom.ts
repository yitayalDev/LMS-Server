import mongoose, { Schema, Document } from 'mongoose';

export interface IVirtualClassroom extends Document {
    course: mongoose.Types.ObjectId;
    instructor: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    startTime: Date;
    duration: number; // in minutes
    joinUrl: string;
    platform: 'zoom' | 'teams' | 'custom';
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    meetingId?: string;
    passcode?: string;
}

const VirtualClassroomSchema: Schema = new Schema({
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    startTime: { type: Date, required: true },
    duration: { type: Number, required: true, default: 60 },
    joinUrl: { type: String, required: true },
    platform: {
        type: String,
        enum: ['zoom', 'teams', 'custom'],
        default: 'custom'
    },
    status: {
        type: String,
        enum: ['scheduled', 'live', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    meetingId: { type: String },
    passcode: { type: String }
}, { timestamps: true });

export default mongoose.model<IVirtualClassroom>('VirtualClassroom', VirtualClassroomSchema);
