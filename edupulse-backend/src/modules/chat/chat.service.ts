import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChatService {
    /**
     * Create a new message
     */
    async createMessage(senderId: string, conversationId: string, content: string) {
        const message = await prisma.message.create({
            data: {
                senderId,
                conversationId,
                content,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });
        return message;
    }

    /**
     * Get all messages for a conversation
     */
    async getMessages(conversationId: string) {
        const messages = await prisma.message.findMany({
            where: {
                conversationId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        return messages;
    }

    /**
     * Get or create a conversation between two users
     */
    async getOrCreateConversation(userId1: string, userId2: string) {
        let conversation = await prisma.conversation.findFirst({
            where: {
                isGroup: false,
                participants: {
                    hasEvery: [userId1, userId2],
                },
            },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participants: [userId1, userId2],
                },
            });
        }

        return conversation;
    }
}

export const chatService = new ChatService();