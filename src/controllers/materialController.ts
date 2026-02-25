import { Request, Response } from 'express';
import CourseMaterial from '../models/CourseMaterial';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import { getFileType } from '../middleware/uploadMiddleware';
import { deleteFile, getStorageUsage, formatBytes } from '../utils/fileProcessor';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
    user?: any;
}

/**
 * Upload material to a course
 * Access: Instructor (own courses), Admin
 */
export const uploadMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, title, description, module, lesson, isPublic } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!courseId || !title) {
            return res.status(400).json({ message: 'Course ID and title are required' });
        }

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check permissions: Admin can upload to any course, Instructor only to their own
        if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only upload materials to your own courses' });
        }

        // Create material record
        const material = await CourseMaterial.create({
            title,
            description,
            fileUrl: file.path,
            fileName: file.originalname,
            fileType: getFileType(file.mimetype),
            fileSize: file.size,
            mimeType: file.mimetype,
            course: courseId,
            uploadedBy: req.user.id,
            module,
            lesson,
            isPublic: isPublic === 'true' || isPublic === true,
            status: 'approved' // Route is guarded by authorize('instructor', 'admin')
        });

        await material.populate('uploadedBy', 'name email');
        await material.populate('course', 'title');

        res.status(201).json({
            message: 'Material uploaded successfully',
            material
        });
    } catch (error: any) {
        console.error('Upload material error:', error);
        res.status(500).json({ message: 'Error uploading material', error: error.message });
    }
};

/**
 * Upload multiple materials
 * Access: Instructor (own courses), Admin
 */
export const uploadMultipleMaterials = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, materials } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check permissions
        if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only upload materials to your own courses' });
        }

        // Parse materials metadata (if provided as JSON string)
        let materialsData: any[] = [];
        if (materials) {
            try {
                materialsData = typeof materials === 'string' ? JSON.parse(materials) : materials;
            } catch (e) {
                materialsData = [];
            }
        }

        // Create material records for each file
        const createdMaterials = await Promise.all(
            files.map(async (file, index) => {
                const metadata = materialsData[index] || {};

                return await CourseMaterial.create({
                    title: metadata.title || file.originalname,
                    description: metadata.description,
                    fileUrl: file.path,
                    fileName: file.originalname,
                    fileType: getFileType(file.mimetype),
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    course: courseId,
                    uploadedBy: req.user.id,
                    module: metadata.module,
                    lesson: metadata.lesson,
                    isPublic: metadata.isPublic || false,
                    status: 'approved'
                });
            })
        );

        res.status(201).json({
            message: `${createdMaterials.length} materials uploaded successfully`,
            materials: createdMaterials
        });
    } catch (error: any) {
        console.error('Upload multiple materials error:', error);
        res.status(500).json({ message: 'Error uploading materials', error: error.message });
    }
};

/**
 * Get materials for a specific course
 * Access: Students (enrolled only), Instructors (own courses), Admin
 */
export const getCourseMaterials = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Build query based on role
        let query: any = { course: courseId };

        if (req.user.role === 'student') {
            // Students can only see approved materials for enrolled courses
            const enrollment = await Enrollment.findOne({
                user: req.user.id,
                course: courseId
            });

            if (!enrollment) {
                return res.status(403).json({ message: 'You must be enrolled in this course to view materials' });
            }

            query.status = 'approved';
        } else if (req.user.role === 'instructor') {
            // Instructors can see all materials for their own courses
            if (course.instructor.toString() !== req.user.id) {
                return res.status(403).json({ message: 'You can only view materials for your own courses' });
            }
        }
        // Admin can see all materials

        const materials = await CourseMaterial.find(query)
            .populate('uploadedBy', 'name email role')
            .sort({ createdAt: -1 });

        res.json({
            count: materials.length,
            materials
        });
    } catch (error: any) {
        console.error('Get course materials error:', error);
        res.status(500).json({ message: 'Error fetching materials', error: error.message });
    }
};

/**
 * Get instructor's own materials
 * Access: Instructor, Admin
 */
export const getMyMaterials = async (req: AuthRequest, res: Response) => {
    try {
        const { status, courseId } = req.query;

        let query: any = { uploadedBy: req.user.id };

        if (status) {
            query.status = status;
        }

        if (courseId) {
            query.course = courseId;
        }

        const materials = await CourseMaterial.find(query)
            .populate('course', 'title')
            .sort({ createdAt: -1 });

        res.json({
            count: materials.length,
            materials
        });
    } catch (error: any) {
        console.error('Get my materials error:', error);
        res.status(500).json({ message: 'Error fetching materials', error: error.message });
    }
};

/**
 * Get all materials (admin only)
 * Access: Admin
 */
export const getAllMaterials = async (req: AuthRequest, res: Response) => {
    try {
        const { status, fileType, courseId } = req.query;

        let query: any = {};

        if (status) {
            query.status = status;
        }

        if (fileType) {
            query.fileType = fileType;
        }

        if (courseId) {
            query.course = courseId;
        }

        const materials = await CourseMaterial.find(query)
            .populate('uploadedBy', 'name email role')
            .populate('course', 'title instructor')
            .sort({ createdAt: -1 });

        res.json({
            count: materials.length,
            materials
        });
    } catch (error: any) {
        console.error('Get all materials error:', error);
        res.status(500).json({ message: 'Error fetching materials', error: error.message });
    }
};

/**
 * Approve material (admin only)
 * Access: Admin
 */
export const approveMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const material = await CourseMaterial.findById(id);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        material.status = 'approved';
        await material.save();

        res.json({
            message: 'Material approved successfully',
            material
        });
    } catch (error: any) {
        console.error('Approve material error:', error);
        res.status(500).json({ message: 'Error approving material', error: error.message });
    }
};

/**
 * Reject material (admin only)
 * Access: Admin
 */
export const rejectMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const material = await CourseMaterial.findById(id);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        material.status = 'rejected';
        material.rejectionReason = reason;
        await material.save();

        res.json({
            message: 'Material rejected',
            material
        });
    } catch (error: any) {
        console.error('Reject material error:', error);
        res.status(500).json({ message: 'Error rejecting material', error: error.message });
    }
};

/**
 * Update material metadata
 * Access: Instructor (own materials), Admin
 */
export const updateMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, module, lesson, isPublic } = req.body;

        const material = await CourseMaterial.findById(id);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Check permissions
        if (req.user.role === 'instructor' && material.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only update your own materials' });
        }

        // Update fields
        if (title) material.title = title;
        if (description !== undefined) material.description = description;
        if (module !== undefined) material.module = module;
        if (lesson !== undefined) material.lesson = lesson;
        if (isPublic !== undefined) material.isPublic = isPublic;

        await material.save();

        res.json({
            message: 'Material updated successfully',
            material
        });
    } catch (error: any) {
        console.error('Update material error:', error);
        res.status(500).json({ message: 'Error updating material', error: error.message });
    }
};

/**
 * Delete material
 * Access: Instructor (own materials), Admin
 */
export const deleteMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const material = await CourseMaterial.findById(id);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Check permissions
        if (req.user.role === 'instructor' && material.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own materials' });
        }

        // Delete file from filesystem
        await deleteFile(material.fileUrl);

        // Delete thumbnail if exists
        if (material.thumbnailUrl) {
            await deleteFile(material.thumbnailUrl);
        }

        // Delete from database
        await CourseMaterial.findByIdAndDelete(id);

        res.json({
            message: 'Material deleted successfully'
        });
    } catch (error: any) {
        console.error('Delete material error:', error);
        res.status(500).json({ message: 'Error deleting material', error: error.message });
    }
};

/**
 * Download material
 * Access: Students (enrolled), Instructors (own courses), Admin
 */
export const downloadMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const material = await CourseMaterial.findById(id).populate('course');
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Check permissions
        if (req.user.role === 'student') {
            // Check enrollment and approval status
            if (material.status !== 'approved') {
                return res.status(403).json({ message: 'This material is not available' });
            }

            const enrollment = await Enrollment.findOne({
                user: req.user.id,
                course: material.course
            });

            if (!enrollment) {
                return res.status(403).json({ message: 'You must be enrolled in this course to download materials' });
            }
        } else if (req.user.role === 'instructor') {
            const course = material.course as any;
            if (course.instructor.toString() !== req.user.id) {
                return res.status(403).json({ message: 'You can only download materials from your own courses' });
            }
        }

        // Increment download count
        material.downloads += 1;
        await material.save();

        // Send file
        res.download(material.fileUrl, material.fileName);
    } catch (error: any) {
        console.error('Download material error:', error);
        res.status(500).json({ message: 'Error downloading material', error: error.message });
    }
};

/**
 * Stream material (Video seeking support + inline preview)
 * Access: Students (enrolled), Instructors (own courses), Admin
 */
export const streamMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const material = await CourseMaterial.findById(id).populate('course');
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        const logFile = 'C:\\Users\\meraw\\OneDrive\\Documents\\Desktop\\LMSUOG\\server\\debug.log';
        const log = (msg: string) => {
            try {
                fs.appendFileSync(logFile, `${new Date().toISOString()} - [STREAM] ${msg}\n`);
            } catch (e) { }
        };

        log(`Request for material: ${material.title} (${id})`);

        // Check permissions
        if (req.user.role === 'student') {
            log(`Checking enrollment for student ${req.user.id}`);
            if (material.status !== 'approved') {
                log(`Material not approved: ${material.status}`);
                return res.status(403).json({ message: 'This material is not available' });
            }

            const enrollment = await Enrollment.findOne({
                user: req.user.id,
                course: material.course
            });

            if (!enrollment) {
                log(`Student ${req.user.id} not enrolled in course ${material.course}`);
                return res.status(403).json({ message: 'You must be enrolled in this course to view materials' });
            }
        }

        const filePath = path.resolve(material.fileUrl);
        log(`Resolved file path: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            log(`FILE NOT FOUND: ${filePath}`);
            return res.status(404).json({ message: 'File not found on server' });
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;
        log(`File size: ${fileSize}, Range: ${range || 'none'}`);

        // streaming video with range support
        if (range && (material.fileType === 'video' || material.mimeType.startsWith('video/'))) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize) {
                log(`Range not satisfiable: ${start} >= ${fileSize}`);
                res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
                return;
            }

            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': material.mimeType,
            };

            log(`Streaming chunk: ${start}-${end} (${chunksize} bytes)`);
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            log(`Serving full file inline: ${material.mimeType}`);
            const head = {
                'Content-Length': fileSize,
                'Content-Type': material.mimeType,
                'Content-Disposition': 'inline'
            };
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }

    } catch (error: any) {
        console.error('Stream material error:', error);
        const logFile = 'C:\\Users\\meraw\\OneDrive\\Documents\\Desktop\\LMSUOG\\server\\debug.log';
        try {
            fs.appendFileSync(logFile, `${new Date().toISOString()} - [STREAM ERROR] ${error.message}\n${error.stack}\n`);
        } catch (e) { }
        res.status(500).json({ message: 'Error streaming material', error: error.message });
    }
};

/**
 * Get storage statistics
 * Access: Admin, Instructor (own stats)
 */
export const getStorageStats = async (req: AuthRequest, res: Response) => {
    try {
        let query: any = {};

        // Instructors can only see their own stats
        if (req.user.role === 'instructor') {
            query.uploadedBy = req.user.id;
        }

        const materials = await CourseMaterial.find(query);

        const stats = {
            totalFiles: materials.length,
            totalSize: materials.reduce((sum, m) => sum + m.fileSize, 0),
            totalSizeFormatted: formatBytes(materials.reduce((sum, m) => sum + m.fileSize, 0)),
            byType: {} as any,
            byStatus: {} as any
        };

        // Group by file type
        materials.forEach(m => {
            if (!stats.byType[m.fileType]) {
                stats.byType[m.fileType] = { count: 0, size: 0 };
            }
            stats.byType[m.fileType].count += 1;
            stats.byType[m.fileType].size += m.fileSize;
        });

        // Format sizes
        Object.keys(stats.byType).forEach(type => {
            stats.byType[type].sizeFormatted = formatBytes(stats.byType[type].size);
        });

        // Group by status
        materials.forEach(m => {
            if (!stats.byStatus[m.status]) {
                stats.byStatus[m.status] = 0;
            }
            stats.byStatus[m.status] += 1;
        });

        res.json(stats);
    } catch (error: any) {
        console.error('Get storage stats error:', error);
        res.status(500).json({ message: 'Error fetching storage stats', error: error.message });
    }
};
