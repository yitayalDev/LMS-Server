import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    platformName: { type: String, default: 'LMS UOG' },
    supportEmail: { type: String, default: 'support@lmsuog.com' },
    defaultLanguage: { type: String, default: 'English (US)' },
    allowPublicRegistration: { type: Boolean, default: true },
    requireInstructorApproval: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    authSystem: { type: String, default: 'JWT' },
    enableNotifications: { type: Boolean, default: true },
    platformLogo: { type: String },
}, { timestamps: true });

export default mongoose.model('SystemSettings', systemSettingsSchema);
