import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    user: mongoose.Types.ObjectId;
    type: 'system' | 'discussion_reply' | 'course_update' | 'gamification';
    title: string;
    message: string;
    isRead: boolean;
    relatedId?: mongoose.Types.ObjectId; // E.g., discussion ID, course ID
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['system', 'discussion_reply', 'course_update', 'gamification'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    relatedId: {
        type: Schema.Types.ObjectId
    }
}, {
    timestamps: true
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
