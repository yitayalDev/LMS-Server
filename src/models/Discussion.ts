import mongoose, { Document, Schema } from 'mongoose';

export interface IReply {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IDiscussion extends Document {
    course: mongoose.Types.ObjectId;
    module?: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    title: string;
    content: string;
    replies: IReply[];
    tags?: string[];
    isResolved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ReplySchema: Schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

const DiscussionSchema: Schema = new Schema({
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    module: {
        type: Schema.Types.ObjectId,
        // Optional: discussions can be at course level or specific module level
        index: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    replies: [ReplySchema],
    tags: [{
        type: String,
        trim: true
    }],
    isResolved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model<IDiscussion>('Discussion', DiscussionSchema);
