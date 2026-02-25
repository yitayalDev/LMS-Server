import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseMaterial extends Document {
    title: string;
    description?: string;
    fileUrl: string;
    fileName: string;
    fileType: 'video' | 'pdf' | 'audio' | 'document' | 'image' | 'other';
    fileSize: number;
    mimeType: string;
    course: mongoose.Types.ObjectId;
    uploadedBy: mongoose.Types.ObjectId;
    module?: string;
    lesson?: string;
    isPublic: boolean;
    status: 'pending' | 'approved' | 'rejected';
    processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    thumbnailUrl?: string;
    duration?: number; // for video/audio in seconds
    downloads: number;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CourseMaterialSchema: Schema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ['video', 'pdf', 'audio', 'document', 'image', 'other'],
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    module: {
        type: String,
        trim: true
    },
    lesson: {
        type: String,
        trim: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    processingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'completed'
    },
    thumbnailUrl: {
        type: String
    },
    duration: {
        type: Number // in seconds
    },
    downloads: {
        type: Number,
        default: 0
    },
    rejectionReason: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
CourseMaterialSchema.index({ course: 1, status: 1 });
CourseMaterialSchema.index({ uploadedBy: 1, createdAt: -1 });
CourseMaterialSchema.index({ fileType: 1 });

export default mongoose.model<ICourseMaterial>('CourseMaterial', CourseMaterialSchema);
