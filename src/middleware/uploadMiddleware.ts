import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const ensureUploadDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// File type configurations
export const FILE_TYPES = {
    VIDEO: {
        mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
        maxSize: 500 * 1024 * 1024, // 500MB
        extensions: ['.mp4', '.webm', '.ogg', '.mov']
    },
    DOCUMENT: {
        mimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ],
        maxSize: 50 * 1024 * 1024, // 50MB
        extensions: ['.pdf', '.doc', '.docx', '.ppt', '.pptx']
    },
    IMAGE: {
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxSize: 10 * 1024 * 1024, // 10MB
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    AUDIO: {
        mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
        maxSize: 50 * 1024 * 1024, // 50MB
        extensions: ['.mp3', '.wav', '.ogg', '.m4a']
    }
};

// Sanitize filename
const sanitizeFilename = (filename: string): string => {
    // Remove special characters and spaces
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
};

// Storage configuration with organized paths
const storage = multer.diskStorage({
    destination: (req: any, file, cb) => {
        // Organize by user and course
        const userId = req.user?.id || 'anonymous';
        const courseId = req.body.courseId || 'general';
        const uploadPath = path.join('uploads', 'materials', userId, courseId);

        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const sanitized = sanitizeFilename(file.originalname);
        const ext = path.extname(sanitized);
        const name = path.basename(sanitized, ext);
        cb(null, `${timestamp}-${name}${ext}`);
    }
});

// Enhanced file filter with detailed validation
const createFileFilter = (allowedTypes?: string[]) => {
    return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        // If specific types are provided, use those
        if (allowedTypes && allowedTypes.length > 0) {
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
            }
            return;
        }

        // Otherwise, check against all supported types
        const allAllowedTypes = [
            ...FILE_TYPES.VIDEO.mimeTypes,
            ...FILE_TYPES.DOCUMENT.mimeTypes,
            ...FILE_TYPES.IMAGE.mimeTypes,
            ...FILE_TYPES.AUDIO.mimeTypes
        ];

        if (allAllowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    };
};

// Get max file size based on mime type
const getMaxFileSize = (mimeType: string): number => {
    if (FILE_TYPES.VIDEO.mimeTypes.includes(mimeType)) {
        return FILE_TYPES.VIDEO.maxSize;
    } else if (FILE_TYPES.DOCUMENT.mimeTypes.includes(mimeType)) {
        return FILE_TYPES.DOCUMENT.maxSize;
    } else if (FILE_TYPES.IMAGE.mimeTypes.includes(mimeType)) {
        return FILE_TYPES.IMAGE.maxSize;
    } else if (FILE_TYPES.AUDIO.mimeTypes.includes(mimeType)) {
        return FILE_TYPES.AUDIO.maxSize;
    }
    return 100 * 1024 * 1024; // Default 100MB
};

// General upload middleware
export const upload = multer({
    storage,
    fileFilter: createFileFilter(),
    limits: {
        fileSize: 500 * 1024 * 1024, // Max 500MB (will be validated per type in controller)
        files: 10 // Max 10 files at once
    }
});

// Specific upload configurations
export const uploadVideo = multer({
    storage,
    fileFilter: createFileFilter(FILE_TYPES.VIDEO.mimeTypes),
    limits: {
        fileSize: FILE_TYPES.VIDEO.maxSize,
        files: 1
    }
});

export const uploadDocument = multer({
    storage,
    fileFilter: createFileFilter(FILE_TYPES.DOCUMENT.mimeTypes),
    limits: {
        fileSize: FILE_TYPES.DOCUMENT.maxSize,
        files: 5
    }
});

export const uploadImage = multer({
    storage,
    fileFilter: createFileFilter(FILE_TYPES.IMAGE.mimeTypes),
    limits: {
        fileSize: FILE_TYPES.IMAGE.maxSize,
        files: 5
    }
});

export const uploadAudio = multer({
    storage,
    fileFilter: createFileFilter(FILE_TYPES.AUDIO.mimeTypes),
    limits: {
        fileSize: FILE_TYPES.AUDIO.maxSize,
        files: 5
    }
});

// Avatar upload configuration
const avatarStorage = multer.diskStorage({
    destination: (req: any, file, cb) => {
        const userId = req.user?.id || 'temp';
        const uploadPath = path.join('uploads', 'avatars', userId);
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${timestamp}${ext}`);
    }
});

export const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: createFileFilter(FILE_TYPES.IMAGE.mimeTypes),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB for avatars
        files: 1
    }
});

// Branding upload configuration
const brandingStorage = multer.diskStorage({
    destination: (req: any, file, cb) => {
        const uploadPath = path.join('uploads', 'branding');
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `logo-${timestamp}${ext}`);
    }
});

export const uploadBranding = multer({
    storage: brandingStorage,
    fileFilter: createFileFilter(FILE_TYPES.IMAGE.mimeTypes),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB for logo
        files: 1
    }
});

// Helper to determine file type from mime type
export const getFileType = (mimeType: string): 'video' | 'pdf' | 'audio' | 'document' | 'image' | 'other' => {
    if (FILE_TYPES.VIDEO.mimeTypes.includes(mimeType)) return 'video';
    if (mimeType === 'application/pdf') return 'pdf';
    if (FILE_TYPES.AUDIO.mimeTypes.includes(mimeType)) return 'audio';
    if (FILE_TYPES.DOCUMENT.mimeTypes.includes(mimeType)) return 'document';
    if (FILE_TYPES.IMAGE.mimeTypes.includes(mimeType)) return 'image';
    return 'other';
};
