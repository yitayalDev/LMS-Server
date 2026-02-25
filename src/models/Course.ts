import mongoose, { Schema, Document } from 'mongoose';

interface IModule {
    _id?: any;
    title: string;
    description?: string;
    contentType: 'video' | 'document' | 'quiz' | 'assignment' | 'live-session';
    contentData: any; // URL, Quiz JSON, Assignment details, etc.
    duration?: number;
    order: number;
    isFreePreview: boolean;
}

export interface ICourse extends Document {
    title: string;
    slug: string;
    description: string;
    thumbnail?: string;
    instructor: mongoose.Types.ObjectId;
    organization?: mongoose.Types.ObjectId;
    category: string;
    price: number;
    discountPrice?: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    language: string;
    requirements: string[];
    outcomes: string[];
    modules: IModule[];
    status: 'draft' | 'published' | 'archived';
    isApproved: boolean;
    isMandatory: boolean;
    recertificationDays: number;
    ratings: {
        average: number;
        count: number;
    };
}

const ModuleSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    contentType: {
        type: String,
        enum: ['video', 'document', 'quiz', 'assignment', 'live-session'],
        required: true
    },
    contentData: { type: Schema.Types.Mixed, required: true },
    duration: Number,
    order: { type: Number, default: 0 },
    isFreePreview: { type: Boolean, default: false }
});

const CourseSchema: Schema = new Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    thumbnail: String,
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    category: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    discountPrice: Number,
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    language: { type: String, default: 'English' },
    requirements: [String],
    outcomes: [String],
    modules: [ModuleSchema],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    isApproved: { type: Boolean, default: false },
    isMandatory: { type: Boolean, default: false },
    recertificationDays: { type: Number, default: 0 }, // 0 means no recertification required
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    }
}, { timestamps: true });

export default mongoose.model<ICourse>('Course', CourseSchema);
