import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
    questionText: string;
    options: string[];
    correctAnswer: number; // Index of the correct option
    type: 'multiple-choice' | 'true-false';
    points: number;
}

export interface IExam extends Document {
    title: string;
    description: string;
    course: mongoose.Types.ObjectId;
    questions: IQuestion[];
    timeLimit: number; // In minutes
    passingScore: number;
    createdBy: mongoose.Types.ObjectId;
}

const QuestionSchema: Schema = new Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    type: { type: String, enum: ['multiple-choice', 'true-false'], default: 'multiple-choice' },
    points: { type: Number, default: 1 }
});

const ExamSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    questions: [QuestionSchema],
    timeLimit: { type: Number, default: 60 },
    passingScore: { type: Number, default: 70 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IExam>('Exam', ExamSchema);
