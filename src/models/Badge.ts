import mongoose, { Schema, Document } from 'mongoose';

export interface IBadge extends Document {
    name: string;
    description: string;
    icon: string; // Lucide icon name or URL
    criteriaType: 'exam_passed' | 'lessons_completed' | 'course_completed' | 'points_milestone';
    criteriaValue: number;
}

const BadgeSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    criteriaType: {
        type: String,
        enum: ['exam_passed', 'lessons_completed', 'course_completed', 'points_milestone'],
        required: true
    },
    criteriaValue: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model<IBadge>('Badge', BadgeSchema);
