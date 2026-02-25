import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    user: mongoose.Types.ObjectId;
    action: string;
    resourceType: string;
    resourceId?: string;
    description: string;
    changes?: {
        before?: any;
        after?: any;
    };
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    description: { type: String, required: true },
    changes: {
        before: { type: Schema.Types.Mixed },
        after: { type: Schema.Types.Mixed }
    },
    ipAddress: { type: String },
    userAgent: { type: String }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Indexing for faster queries in the admin dashboard
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
