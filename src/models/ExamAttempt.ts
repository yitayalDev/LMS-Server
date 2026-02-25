import mongoose, { Schema, Document } from 'mongoose';

export interface IExamAttempt extends Document {
    user: mongoose.Types.ObjectId;
    exam: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    answers: number[]; // User's chosen option indices
    score: number;
    percentage: number;
    status: 'passed' | 'failed' | 'pending';
    completedAt: Date;
}

const ExamAttemptSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    answers: [{ type: Number }],
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    status: { type: String, enum: ['passed', 'failed', 'pending'], default: 'pending' },
    completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IExamAttempt>('ExamAttempt', ExamAttemptSchema);
