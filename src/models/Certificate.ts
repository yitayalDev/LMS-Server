import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
    user: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    exam: mongoose.Types.ObjectId;
    issueDate: Date;
    certificateId: string; // Unique human-readable ID
    pdfUrl?: string; // Optional: URL if stored on cloud
}

const CertificateSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    issueDate: { type: Date, default: Date.now },
    certificateId: { type: String, required: true, unique: true },
    pdfUrl: { type: String }
}, { timestamps: true });

export default mongoose.model<ICertificate>('Certificate', CertificateSchema);
