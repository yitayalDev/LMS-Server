import { Request, Response } from 'express';
import Discussion from '../models/Discussion';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import { logAudit } from '../utils/auditService';
import { createAndEmitNotification } from '../utils/notificationService';

// Get discussions for a specific course (optionally filtered by module)
export const getDiscussions = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const { moduleId } = req.query;

        const query: any = { course: courseId };
        if (moduleId) {
            query.module = moduleId;
        }

        const discussions = await Discussion.find(query)
            .populate('user', 'name avatar role')
            .populate('replies.user', 'name avatar role')
            .sort({ createdAt: -1 });

        res.json(discussions);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new discussion thread
export const createDiscussion = async (req: any, res: Response) => {
    try {
        const { courseId } = req.params;
        const { title, content, moduleId, tags } = req.body;
        const userId = req.user.id;

        // Verify enrollment or instructor status
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const isInstructor = course.instructor.toString() === userId;
        const isAdmin = req.user.role === 'admin';

        let isEnrolled = false;
        if (!isInstructor && !isAdmin) {
            const enrollment = await Enrollment.findOne({ course: courseId, user: userId, status: 'active' });
            if (enrollment) isEnrolled = true;
        }

        if (!isEnrolled && !isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'You must be enrolled to post a discussion' });
        }

        const discussion = await Discussion.create({
            course: courseId,
            module: moduleId || undefined,
            user: userId,
            title,
            content,
            tags: tags || []
        });

        await discussion.populate('user', 'name avatar role');

        await logAudit({
            userId,
            action: 'DISCUSSION_CREATE',
            resourceType: 'Discussion',
            resourceId: discussion.id,
            description: `User created discussion in course ${courseId}`,
            req
        });

        res.status(201).json(discussion);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Add a reply to a discussion
export const addReply = async (req: any, res: Response) => {
    try {
        const { discussionId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const discussion = await Discussion.findById(discussionId);
        if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

        discussion.replies.push({
            user: userId,
            content
        } as any);

        await discussion.save();

        // Populate the newly added reply's user for the frontend
        await discussion.populate('replies.user', 'name avatar role');

        // Target discussion author for notification to let them know
        if (discussion.user.toString() !== userId) {
            await createAndEmitNotification(
                discussion.user.toString(),
                'discussion_reply',
                'New Reply to your Discussion',
                `${req.user.name || 'Someone'} replied to your discussion "${discussion.title}".`,
                discussion._id
            );
        }

        res.status(201).json(discussion);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Mark discussion as resolved (only creator or instructor/admin)
export const resolveDiscussion = async (req: any, res: Response) => {
    try {
        const { discussionId } = req.params;
        const userId = req.user.id;

        const discussion = await Discussion.findById(discussionId).populate('course');
        if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

        const course = discussion.course as any;
        const isInstructor = course.instructor.toString() === userId;
        const isCreator = discussion.user.toString() === userId;
        const isAdmin = req.user.role === 'admin';

        if (!isCreator && !isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to resolve this discussion' });
        }

        discussion.isResolved = true;
        await discussion.save();

        res.json(discussion);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
