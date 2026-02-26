import { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const scormDir = path.join(process.cwd(), 'uploads', 'scorm');
if (!fs.existsSync(scormDir)) {
    fs.mkdirSync(scormDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => cb(null, scormDir),
    filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

export const scormUpload = multer({
    storage,
    fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Only .zip SCORM packages are accepted'));
        }
    },
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

export const uploadScormPackage = async (req: any, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const relativePath = `/uploads/scorm/${req.file.filename}`;

        res.json({
            message: 'SCORM package uploaded successfully',
            filename: req.file.filename,
            url: relativePath,
            size: req.file.size,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
