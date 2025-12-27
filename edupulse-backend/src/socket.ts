import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { ExtendedError } from 'socket.io/dist/namespace';
import { chatService } from './modules/chat/chat.service.js';

type SocketNextFunction = (err?: ExtendedError) => void;

interface SocketWithAuth extends Socket {
    userId?: string;
}

export function initializeSocket(io: Server, app: FastifyInstance) {
    // Middleware for authentication
    io.use((socket: SocketWithAuth, next: SocketNextFunction) => {
        // TODO: Implement proper JWT-based authentication
        const token = socket.handshake.auth.token;
        const userId = socket.handshake.auth.userId; // Assuming user ID is passed in auth
        if (userId) {
            socket.userId = userId;
            app.log.info(`Socket authenticated for user: ${userId}`);
            next();
        } else {
            // next(new Error('Authentication error'));
            // For now, allow connection without user ID for development
            app.log.warn(`Socket connection without userId: ${socket.id}`);
            next();
        }
    });

    io.on('connection', (socket: SocketWithAuth) => {
        app.log.info(`🔌 Socket connected: ${socket.id}`);

        socket.on('getConversation', async (otherUserId: string, callback) => {
            if (!socket.userId) return;
            const conversation = await chatService.getOrCreateConversation(socket.userId, otherUserId);
            callback(conversation);
        });

        socket.on('joinRoom', (conversationId: string) => {
            socket.join(conversationId);
            app.log.info(`Socket ${socket.id} joined room ${conversationId}`);
        });

        socket.on('sendMessage', async (data: { conversationId: string; message: string }) => {
            if (!socket.userId) return;

            const message = await chatService.createMessage(
                socket.userId,
                data.conversationId,
                data.message
            );

            io.to(data.conversationId).emit('newMessage', message);
        });

        socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
            if (!socket.userId) return;
            socket.to(data.conversationId).emit('typing', {
                user: socket.userId,
                isTyping: data.isTyping,
            });
        });

        socket.on('readReceipt', (data: { conversationId: string; messageId: string }) => {
            if (!socket.userId) return;
            // Here you would update the message status in the database
            io.to(data.conversationId).emit('messageRead', {
                user: socket.userId,
                messageId: data.messageId,
            });
        });

        socket.on('disconnect', () => {
            app.log.info(`🔌 Socket disconnected: ${socket.id}`);
        });
    });
}
