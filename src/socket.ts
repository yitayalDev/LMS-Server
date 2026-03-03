import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let ioInstance: Server;
export const userSockets = new Map<string, string>(); // userId -> socketId

export const initSocket = (server: HttpServer) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const allowedOrigins = [clientUrl, 'http://127.0.0.1:3000', 'http://localhost:5173'];

    ioInstance = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                const isAllowed = allowedOrigins.includes(origin) ||
                    origin.startsWith('http://10.') ||
                    origin.endsWith('.vercel.app');

                if (isAllowed) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    ioInstance.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('register', (userId: string) => {
            socket.data.userId = userId;
            userSockets.set(userId, socket.id);
            console.log(`User ${userId} registered with socket ${socket.id}`);
        });

        socket.on('join_conversation', (conversationId: string) => {
            socket.join(conversationId);
            console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
        });

        socket.on('typing', (data: { conversationId: string; userId: string; userName: string }) => {
            socket.to(data.conversationId).emit('user_typing', data);
        });

        socket.on('stop_typing', (data: { conversationId: string; userId: string }) => {
            socket.to(data.conversationId).emit('user_stopped_typing', data);
        });

        socket.on('send_message', (data: { conversationId: string; sender: any; content: string; recipientId?: string }) => {
            // Broadcast to the conversation room
            ioInstance.to(data.conversationId).emit('receive_message', {
                conversation: data.conversationId,
                sender: data.sender,
                content: data.content,
                createdAt: new Date()
            });

            // Optionally notify the specific recipient if it's a DM
            if (data.recipientId) {
                const recipientSocketId = userSockets.get(data.recipientId);
                if (recipientSocketId) {
                    ioInstance.to(recipientSocketId).emit('new_message_notification', {
                        senderId: data.sender._id || data.sender,
                        conversationId: data.conversationId,
                        content: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '')
                    });
                }
            }
        });

        socket.on('mark_read', (data: { conversationId: string; userId: string }) => {
            // Tell others in the conversation that this user read the messages
            socket.to(data.conversationId).emit('message_read_update', data);
        });

        socket.on('disconnect', () => {
            // Remove from userSockets map
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    break;
                }
            }
            console.log('User disconnected:', socket.id);
        });
    });

    return ioInstance;
};

export const getIO = () => {
    if (!ioInstance) {
        throw new Error('Socket.io not initialized!');
    }
    return ioInstance;
};

export const getUserSocket = (userId: string) => {
    return userSockets.get(userId);
};
