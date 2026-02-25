import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';

export const getConversations = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({
            participants: userId
        })
            .populate('participants', 'name email avatar role')
            .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'name' }
            })
            .populate('course', 'title thumbnail')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'name avatar role')
            .sort({ createdAt: -1 }) // Sort by newest first for easier pagination
            .skip(skip)
            .limit(limit);

        // Reverse to show in chronological order in chat
        res.json(messages.reverse());
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const startConversation = async (req: any, res: Response) => {
    try {
        const { recipientId } = req.body;
        const userId = req.user.id;

        if (userId === recipientId) {
            return res.status(400).json({ message: 'You cannot start a conversation with yourself' });
        }

        // Check if conversation already exists (DM type)
        let conversation = await Conversation.findOne({
            type: 'dm',
            participants: { $all: [userId, recipientId], $size: 2 }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [userId, recipientId],
                type: 'dm'
            });
        }

        res.json(conversation);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getCourseConversation = async (req: any, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        // Check if user is enrolled or is the instructor/admin
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const isInstructor = course.instructor.toString() === userId;
        const isAdmin = req.user.role === 'admin';
        const enrollment = await Enrollment.findOne({ user: userId, course: courseId });

        if (!isInstructor && !isAdmin && !enrollment) {
            return res.status(403).json({ message: 'You must be enrolled to access course chat' });
        }

        let conversation = await Conversation.findOne({
            type: 'course',
            course: courseId
        });

        if (!conversation) {
            // Group chat for course - participants will be added as they join or we can keep it open
            conversation = await Conversation.create({
                type: 'course',
                course: courseId,
                title: `${course.title} Discussion`,
                participants: [course.instructor] // Initially just instructor
            });
        }

        // Add user to participants if not already there
        if (!conversation.participants.includes(userId)) {
            conversation.participants.push(userId);
            await conversation.save();
        }

        res.json(conversation);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const sendMessage = async (req: any, res: Response) => {
    try {
        const { conversationId, content, attachments, isAnnouncement } = req.body;
        const senderId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Check if user is participant
        if (!conversation.participants.includes(senderId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to send messages to this conversation' });
        }

        const message = await Message.create({
            conversation: conversationId,
            sender: senderId,
            content,
            attachments,
            isAnnouncement: isAnnouncement || false,
            readBy: [senderId]
        });

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            updatedAt: new Date()
        });

        res.json(message);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const markAsRead = async (req: any, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        await Message.updateMany(
            { conversation: conversationId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
