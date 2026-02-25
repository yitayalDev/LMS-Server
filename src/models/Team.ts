import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
    name: string;
    description?: string;
    organization: mongoose.Types.ObjectId;
    manager: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const TeamSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Ensure team names are unique within an organization
TeamSchema.index({ name: 1, organization: 1 }, { unique: true });

export default mongoose.model<ITeam>('Team', TeamSchema);
