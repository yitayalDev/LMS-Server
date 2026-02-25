import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    getDiscussions,
    createDiscussion,
    addReply,
    resolveDiscussion
} from '../controllers/discussionController';

const router = express.Router();

// Get discussions for a course
router.get('/:courseId', protect, getDiscussions);

// Create a new discussion thread
router.post('/:courseId', protect, createDiscussion);

// Reply to a discussion thread
router.post('/:discussionId/reply', protect, addReply);

// Mark a discussion as resolved
router.put('/:discussionId/resolve', protect, resolveDiscussion);

export default router;
