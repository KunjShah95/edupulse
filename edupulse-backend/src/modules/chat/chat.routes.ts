import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { storageService, UploadOptions, StorageService } from '../../services/storage.service.js';
import { chatService } from './chat.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function chatRoutes(fastify: FastifyInstance) {
    fastify.addHook('onRequest', fastify.authenticate);

    // Get messages for a conversation
    fastify.get('/:conversationId/messages', async (request: FastifyRequest, reply: FastifyReply) => {
        const { conversationId } = request.params as { conversationId: string };
        const messages = await chatService.getMessages(conversationId);
        return reply.send(messages);
    });

    // Upload file to a conversation
    fastify.post('/upload/:conversationId', async (request: FastifyRequest, reply: FastifyReply) => {
        const { conversationId } = request.params as { conversationId: string };
        const data = await request.file();

        if (!data) {
            return reply.status(400).send({ message: 'No file uploaded' });
        }

        const chunks: Uint8Array[] = [];
        for await (const chunk of data.file) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const validation = StorageService.validateFile(
            buffer.length,
            data.mimetype
        );

        if (!validation.valid) {
            return reply.status(400).send({ message: validation.error });
        }

        const uploadOptions: UploadOptions = {
            fileName: data.filename,
            fileSize: buffer.length,
            mimeType: data.mimetype,
            buffer,
            userId: (request.user?.id as string) || undefined,
            folder: `chat/${conversationId}`,
        };

        const fileMetadata = await storageService.uploadFile(uploadOptions);

        // Create a message with the attachment
        const message = await chatService.createMessage(
            request.user.id,
            conversationId,
            '' // Empty content for file-only messages
        );

        // This is a bit of a hack. Prisma doesn't support updating an array by pushing to it.
        // So we get the message, update the attachments array, and then update the message.
        // A better solution would be to model attachments as a separate table.
        const updatedMessage = await prisma.message.update({
            where: { id: message.id },
            data: {
                attachments: {
                    push: fileMetadata.url,
                },
            },
        });


        // Notify clients via socket
        fastify.socketServer.to(conversationId).emit('newMessage', updatedMessage);

        return reply.status(201).send(updatedMessage);
    });
}

export default chatRoutes;
