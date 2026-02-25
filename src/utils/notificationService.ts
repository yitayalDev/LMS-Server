import Notification from '../models/Notification';
import { getIO, getUserSocket } from '../socket';
import mongoose from 'mongoose';

export const createAndEmitNotification = async (
    userId: mongoose.Types.ObjectId | string,
    type: 'system' | 'discussion_reply' | 'course_update' | 'gamification',
    title: string,
    message: string,
    relatedId?: mongoose.Types.ObjectId | string
) => {
    try {
        // 1. Create the database record
        const notification = await Notification.create({
            user: userId,
            type,
            title,
            message,
            relatedId
        });

        // 2. Try to emit via Socket.io if the user is currently online
        try {
            const socketId = getUserSocket(userId.toString());
            if (socketId) {
                const io = getIO();
                io.to(socketId).emit('new_notification', notification);
            }
        } catch (socketErr) {
            console.error('Socket emission failed, but notification was saved:', socketErr);
        }

        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        throw error;
    }
};
