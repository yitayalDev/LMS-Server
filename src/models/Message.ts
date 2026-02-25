import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    conversation: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    content: string;
    attachments?: {
        url: string;
        name: string;
        fileType: string;
    }[];
    isAnnouncement?: boolean;
    readBy: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const MessageSchema: Schema = new Schema({
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachments: [{
        url: String,
        name: String,
        fileType: String
    }],
    isAnnouncement: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model<IMessage>('Message', MessageSchema);
