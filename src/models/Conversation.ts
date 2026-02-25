import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[];
    type: 'dm' | 'course' | 'announcement';
    course?: mongoose.Types.ObjectId;
    title?: string;
    lastMessage?: mongoose.Types.ObjectId;
    updatedAt: Date;
}

const ConversationSchema: Schema = new Schema({
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    type: {
        type: String,
        enum: ['dm', 'course', 'announcement'],
        default: 'dm'
    },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    title: { type: String },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

// Ensure unique conversation for the same set of participants
ConversationSchema.index({ participants: 1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
