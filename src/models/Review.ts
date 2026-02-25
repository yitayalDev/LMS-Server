import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
    course: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema: Schema = new Schema({
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    }
}, {
    timestamps: true
});

// Ensure a user can only leave one review per course
ReviewSchema.index({ course: 1, user: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
