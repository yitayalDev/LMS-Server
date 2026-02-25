import fs from 'fs';
import path from 'path';

/**
 * File processing utilities for content management
 * Note: Video/audio processing requires ffmpeg installation
 */

export interface FileMetadata {
    duration?: number;
    width?: number;
    height?: number;
    thumbnailPath?: string;
}

/**
 * Get file size in bytes
 */
export const getFileSize = (filePath: string): number => {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch (error) {
        console.error('Error getting file size:', error);
        return 0;
    }
};

/**
 * Delete file from filesystem
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

/**
 * Get storage usage for a user or course
 */
export const getStorageUsage = async (directory: string): Promise<number> => {
    let totalSize = 0;

    const calculateSize = (dir: string) => {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                calculateSize(filePath);
            } else {
                totalSize += stats.size;
            }
        });
    };

    calculateSize(directory);
    return totalSize;
};

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Validate file exists
 */
export const fileExists = (filePath: string): boolean => {
    return fs.existsSync(filePath);
};

/**
 * Create directory if it doesn't exist
 */
export const ensureDirectory = (dirPath: string): void => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
    return path.extname(filename).toLowerCase();
};

/**
 * Placeholder for video thumbnail generation
 * Requires ffmpeg to be installed
 * 
 * Installation:
 * - Windows: Download from https://ffmpeg.org/download.html
 * - Linux: sudo apt-get install ffmpeg
 * - Mac: brew install ffmpeg
 */
export const generateVideoThumbnail = async (
    videoPath: string,
    outputPath: string
): Promise<string | null> => {
    // TODO: Implement using fluent-ffmpeg or similar
    // For now, return null (no thumbnail)
    console.log('Video thumbnail generation not yet implemented');
    console.log('Install ffmpeg and fluent-ffmpeg package to enable this feature');
    return null;
};

/**
 * Placeholder for video duration extraction
 * Requires ffmpeg to be installed
 */
export const getVideoDuration = async (videoPath: string): Promise<number | null> => {
    // TODO: Implement using fluent-ffmpeg or similar
    // For now, return null
    console.log('Video duration extraction not yet implemented');
    console.log('Install ffmpeg and fluent-ffmpeg package to enable this feature');
    return null;
};

/**
 * Placeholder for audio duration extraction
 */
export const getAudioDuration = async (audioPath: string): Promise<number | null> => {
    // TODO: Implement using fluent-ffmpeg or similar
    console.log('Audio duration extraction not yet implemented');
    return null;
};

/**
 * Clean up old temporary files
 */
export const cleanupTempFiles = async (directory: string, maxAgeHours: number = 24): Promise<number> => {
    let deletedCount = 0;
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();

    const cleanup = (dir: string) => {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                cleanup(filePath);
            } else {
                const age = now - stats.mtimeMs;
                if (age > maxAge) {
                    try {
                        fs.unlinkSync(filePath);
                        deletedCount++;
                    } catch (error) {
                        console.error(`Error deleting file ${filePath}:`, error);
                    }
                }
            }
        });
    };

    cleanup(directory);
    return deletedCount;
};
