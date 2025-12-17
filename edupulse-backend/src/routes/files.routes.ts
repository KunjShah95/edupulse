import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { storageService, StorageService, UploadOptions } from '../services/storage.service.js';
import { z } from 'zod';

/**
 * Upload file handler
 */
export async function handleFileUpload(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<any> {
    try {
        const data = await request.file();

        if (!data) {
            return reply.status(400).send({
                statusCode: 400,
                error: 'Bad Request',
                message: 'No file provided',
            });
        }

        // Read file buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of data.file) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Validate file
        const validation = StorageService.validateFile(
            buffer.length,
            data.mimetype,
            50, // 50MB max
            ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
        );

        if (!validation.valid) {
            return reply.status(400).send({
                statusCode: 400,
                error: 'Bad Request',
                message: validation.error,
            });
        }

        // Upload file
        const uploadOptions: UploadOptions = {
            fileName: data.filename,
            fileSize: buffer.length,
            mimeType: data.mimetype,
            buffer,
            userId: (request.user?.id as string) || undefined,
            folder: 'uploads',
        };

        const fileMetadata = await storageService.uploadFile(uploadOptions);

        return reply.status(201).send({
            statusCode: 201,
            data: fileMetadata,
            message: 'File uploaded successfully',
        });
    } catch (error: any) {
        console.error('File upload error:', error);
        return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: error.message || 'Failed to upload file',
        });
    }
}

/**
 * Delete file handler
 */
export async function handleFileDelete(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<any> {
    try {
        const { fileKey } = request.params as { fileKey: string };

        if (!fileKey) {
            return reply.status(400).send({
                statusCode: 400,
                error: 'Bad Request',
                message: 'File key is required',
            });
        }

        await storageService.deleteFile(fileKey);

        return reply.status(200).send({
            statusCode: 200,
            message: 'File deleted successfully',
        });
    } catch (error: any) {
        console.error('File delete error:', error);
        return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: error.message || 'Failed to delete file',
        });
    }
}

/**
 * Get presigned upload URL
 */
export async function getPresignedUploadUrl(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<any> {
    try {
        const schema = z.object({
            fileName: z.string().min(1),
            mimeType: z.string().min(1),
        });

        const body = schema.parse(request.body);

        const { url, key } = await storageService.getPresignedUploadUrl(
            body.fileName,
            body.mimeType,
            { expiresIn: 3600 }
        );

        return reply.status(200).send({
            statusCode: 200,
            data: {
                uploadUrl: url,
                fileKey: key,
            },
            message: 'Presigned upload URL generated',
        });
    } catch (error: any) {
        console.error('Presigned URL error:', error);
        if (error instanceof z.ZodError) {
            return reply.status(400).send({
                statusCode: 400,
                error: 'Bad Request',
                message: 'Invalid request parameters',
            });
        }
        return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: error.message || 'Failed to generate presigned URL',
        });
    }
}

/**
 * Get presigned download URL
 */
export async function getPresignedDownloadUrl(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<any> {
    try {
        const { fileKey } = request.params as { fileKey: string };

        if (!fileKey) {
            return reply.status(400).send({
                statusCode: 400,
                error: 'Bad Request',
                message: 'File key is required',
            });
        }

        const url = await storageService.getPresignedDownloadUrl(fileKey, {
            expiresIn: 3600,
        });

        return reply.status(200).send({
            statusCode: 200,
            data: {
                downloadUrl: url,
            },
            message: 'Presigned download URL generated',
        });
    } catch (error: any) {
        console.error('Presigned download URL error:', error);
        return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: error.message || 'Failed to generate download URL',
        });
    }
}

/**
 * Register file upload routes
 */
export async function registerFileRoutes(app: FastifyInstance): Promise<void> {
    const apiPrefix = `/api/v1`;

    // POST /api/v1/files/upload - Upload file
    app.post(`${apiPrefix}/files/upload`, {
        onRequest: [app.authenticate],
        schema: {
            tags: ['Files'],
            summary: 'Upload a file',
            description: 'Upload a file to cloud storage (S3/MinIO)',
            response: {
                201: {
                    description: 'File uploaded successfully',
                    type: 'object',
                    properties: {
                        statusCode: { type: 'number' },
                        data: {
                            type: 'object',
                            properties: {
                                key: { type: 'string' },
                                url: { type: 'string' },
                                fileName: { type: 'string' },
                                size: { type: 'number' },
                                mimeType: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
        handler: handleFileUpload,
    });

    // POST /api/v1/files/presigned-upload - Get presigned upload URL
    app.post(`${apiPrefix}/files/presigned-upload`, {
        onRequest: [app.authenticate],
        schema: {
            tags: ['Files'],
            summary: 'Get presigned upload URL',
            description: 'Get a presigned URL for direct file upload to storage',
        },
        handler: getPresignedUploadUrl,
    });

    // GET /api/v1/files/:fileKey/presigned-download - Get presigned download URL
    app.get(`${apiPrefix}/files/:fileKey/presigned-download`, {
        onRequest: [app.authenticate],
        schema: {
            tags: ['Files'],
            summary: 'Get presigned download URL',
            description: 'Get a presigned URL for file download',
        },
        handler: getPresignedDownloadUrl,
    });

    // DELETE /api/v1/files/:fileKey - Delete file
    app.delete(`${apiPrefix}/files/:fileKey`, {
        onRequest: [app.authenticate],
        schema: {
            tags: ['Files'],
            summary: 'Delete a file',
            description: 'Delete a file from storage',
        },
        handler: handleFileDelete,
    });
}
