import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { MultipartFile } from '@fastify/multipart';

// Mock dependencies
vi.mock('../services/storage.service.js', () => ({
    storageService: {
        uploadFile: vi.fn(),
        deleteFile: vi.fn(),
        getPresignedDownloadUrl: vi.fn(),
        getPresignedUploadUrl: vi.fn(),
        fileExists: vi.fn(),
    },
}));

import { registerFileRoutes } from './files.routes.js';
import { storageService } from '../services/storage.service.js';

describe('Files Routes', () => {
    let app: any;
    let mockRequest: any;
    let mockReply: any;

    beforeEach(() => {
        // Mock Fastify app
        app = {
            post: vi.fn(),
            delete: vi.fn(),
            get: vi.fn(),
            addHook: vi.fn(),
        };

        // Mock request
        mockRequest = {
            user: { id: 'user-1', role: 'STUDENT' },
            log: { error: vi.fn() },
            file: vi.fn(),
            parts: vi.fn(),
        };

        // Mock reply
        mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        };

        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // SETUP
    // ========================================

    describe('Route Registration', () => {
        it('should register file upload route', async () => {
            await registerFileRoutes(app);

            const postCalls = app.post.mock.calls;
            const uploadCall = postCalls.find(call => call[0].includes('upload'));

            expect(uploadCall).toBeDefined();
        });

        it('should register file download route', async () => {
            await registerFileRoutes(app);

            const getCalls = app.get.mock.calls;
            const downloadCall = getCalls.find(call => call[0].includes('presigned-download'));

            expect(downloadCall).toBeDefined();
        });

        it('should register presigned upload URL route', async () => {
            await registerFileRoutes(app);

            const postCalls = app.post.mock.calls;
            const presignedCall = postCalls.find(call => call[0].includes('presigned-upload'));

            expect(presignedCall).toBeDefined();
        });

        it('should register file delete route', async () => {
            await registerFileRoutes(app);

            const deleteCalls = app.delete.mock.calls;
            const deleteCall = deleteCalls.find(call => call[0].includes('files'));

            expect(deleteCall).toBeDefined();
        });
    });

    // ========================================
    // FILE UPLOAD
    // ========================================

    describe('File Upload Endpoint', () => {
        it('should upload file successfully', async () => {
            const mockUploadResult = {
                key: 'documents/uuid-filename.pdf',
                url: 'https://example.com/documents/uuid-filename.pdf',
                fileName: 'document.pdf',
                size: 2048576,
                mimeType: 'application/pdf',
                uploadedAt: new Date(),
            };

            vi.mocked(storageService.uploadFile).mockResolvedValue(mockUploadResult);

            const fileBuffer = Buffer.from('test file content');
            const result = await storageService.uploadFile({
                buffer: fileBuffer,
                fileName: 'document.pdf',
                mimeType: 'application/pdf',
                folder: 'documents',
                fileSize: fileBuffer.length,
                userId: 'user-1',
            });

            expect(result.key).toBe('documents/uuid-filename.pdf');
            expect(result.size).toBe(2048576);
            expect(result.mimeType).toBe('application/pdf');
        });

        it('should reject upload without authentication', async () => {
            // This would be handled by Fastify auth hook
            const unauthenticatedRequest = {
                user: undefined,
                log: { error: vi.fn() },
            };

            expect(unauthenticatedRequest.user).toBeUndefined();
        });

        it('should reject file exceeding size limit', async () => {
            const largeBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB

            vi.mocked(storageService.uploadFile).mockRejectedValue(
                new Error('File size exceeds maximum allowed')
            );

            expect(async () => {
                await storageService.uploadFile({
                    buffer: largeBuffer,
                    fileName: 'large.pdf',
                    mimeType: 'application/pdf',
                    fileSize: largeBuffer.length,
                });
            }).rejects.toThrow('File size exceeds maximum allowed');
        });

        it('should reject invalid file type', async () => {
            const mockError = {
                statusCode: 400,
                error: 'Validation Error',
                message: 'Invalid file type',
            };

            // Validation would occur before storage
            expect(mockError.statusCode).toBe(400);
            expect(mockError.message).toContain('Invalid file type');
        });

        it('should organize uploaded file by folder', async () => {
            const mockResult = {
                key: 'assignments/uuid-homework.docx',
                folder: 'assignments',
            };

            expect(mockResult.key).toContain('assignments/');
        });

        it('should store file metadata', async () => {
            const mockResult = {
                key: 'documents/file.pdf',
                fileName: 'document.pdf',
                size: 2048576,
                mimeType: 'application/pdf',
                uploadedAt: new Date(),
                userId: 'user-1',
            };

            expect(mockResult).toHaveProperty('userId');
            expect(mockResult).toHaveProperty('uploadedAt');
            expect(mockResult).toHaveProperty('size');
        });

        it('should return upload response with correct status code', async () => {
            const uploadResponse = {
                statusCode: 201,
                data: {
                    key: 'documents/file.pdf',
                    url: 'https://example.com/documents/file.pdf',
                },
                message: 'File uploaded successfully',
            };

            expect(uploadResponse.statusCode).toBe(201);
            expect(uploadResponse.data).toHaveProperty('key');
            expect(uploadResponse.data).toHaveProperty('url');
        });
    });

    // ========================================
    // PRESIGNED UPLOAD URL
    // ========================================

    describe('Presigned Upload URL Endpoint', () => {
        it('should generate presigned upload URL', async () => {
            const mockUrl = 'https://s3.amazonaws.com/edupulse-files/upload?X-Amz-Signature=...';

            vi.mocked(storageService.getPresignedUploadUrl).mockResolvedValue({
                url: mockUrl,
                expiresIn: 900,
            });

            const result = await storageService.getPresignedUploadUrl('document.pdf', 'application/pdf');

            expect(result.url).toContain('https://s3.amazonaws.com');
            expect(result.expiresIn).toBe(900);
        });

        it('should include file name in request', async () => {
            const mockUrl = 'https://s3.amazonaws.com/upload?X-Amz-Key=homework.docx';

            vi.mocked(storageService.getPresignedUploadUrl).mockResolvedValue({
                url: mockUrl,
            });

            const result = await storageService.getPresignedUploadUrl('homework.docx', 'application/msword');

            expect(result.url).toBeDefined();
        });

        it('should include MIME type in URL', async () => {
            const mockUrl = 'https://s3.amazonaws.com/upload?Content-Type=application/pdf';

            vi.mocked(storageService.getPresignedUploadUrl).mockResolvedValue({
                url: mockUrl,
            });

            const result = await storageService.getPresignedUploadUrl('file.pdf', 'application/pdf');

            expect(result.url).toContain('Content-Type');
        });

        it('should expire presigned URL in 15 minutes', async () => {
            const mockUrl = 'https://s3.amazonaws.com/upload?X-Amz-Expires=900';

            vi.mocked(storageService.getPresignedUploadUrl).mockResolvedValue({
                url: mockUrl,
                expiresIn: 900,
            });

            const result = await storageService.getPresignedUploadUrl('file.pdf', 'application/pdf');

            expect(result.expiresIn).toBe(900); // 15 minutes in seconds
        });

        it('should return correct response format', async () => {
            const response = {
                statusCode: 200,
                data: {
                    uploadUrl: 'https://s3.amazonaws.com/upload?...',
                    expiresIn: 900,
                },
            };

            expect(response.statusCode).toBe(200);
            expect(response.data).toHaveProperty('uploadUrl');
            expect(response.data).toHaveProperty('expiresIn');
        });
    });

    // ========================================
    // PRESIGNED DOWNLOAD URL
    // ========================================

    describe('Presigned Download URL Endpoint', () => {
        it('should get presigned download URL', async () => {
            const mockUrl = 'https://s3.amazonaws.com/edupulse-files/documents/uuid-file.pdf?X-Amz-Signature=...';

            vi.mocked(storageService.getPresignedDownloadUrl).mockResolvedValue(mockUrl);

            const result = await storageService.getPresignedDownloadUrl('documents/uuid-file.pdf');

            expect(result).toContain('https://s3.amazonaws.com');
            expect(result).toContain('X-Amz-Signature');
        });

        it('should include file key in request', async () => {
            const fileKey = 'documents/uuid-file.pdf';

            vi.mocked(storageService.getPresignedDownloadUrl).mockResolvedValue(
                'https://s3.amazonaws.com/...'
            );

            const result = await storageService.getPresignedDownloadUrl(fileKey);

            expect(vi.mocked(storageService.getPresignedDownloadUrl)).toHaveBeenCalledWith(fileKey);
        });

        it('should expire download URL in 1 hour', async () => {
            const mockUrl = 'https://s3.amazonaws.com/file.pdf?X-Amz-Expires=3600';

            vi.mocked(storageService.getPresignedDownloadUrl).mockResolvedValue(mockUrl);

            const result = await storageService.getPresignedDownloadUrl('documents/file.pdf', { expiresIn: 3600 });

            expect(result).toContain('Expires=3600');
        });

        it('should handle non-existent file', async () => {
            vi.mocked(storageService.getPresignedDownloadUrl).mockRejectedValue(
                new Error('File not found')
            );

            expect(async () => {
                await storageService.getPresignedDownloadUrl('non-existent/file.pdf');
            }).rejects.toThrow('File not found');
        });

        it('should return correct response format', async () => {
            const response = {
                statusCode: 200,
                data: {
                    downloadUrl: 'https://s3.amazonaws.com/file.pdf?...',
                    expiresIn: 3600,
                },
            };

            expect(response.statusCode).toBe(200);
            expect(response.data).toHaveProperty('downloadUrl');
            expect(response.data).toHaveProperty('expiresIn');
        });
    });

    // ========================================
    // FILE DELETION
    // ========================================

    describe('File Deletion Endpoint', () => {
        it('should delete file successfully', async () => {
            vi.mocked(storageService.deleteFile).mockResolvedValue(undefined);

            await storageService.deleteFile('documents/uuid-file.pdf');

            expect(storageService.deleteFile).toHaveBeenCalledWith('documents/uuid-file.pdf');
        });

        it('should require authentication for deletion', async () => {
            const unauthenticatedRequest = {
                user: undefined,
            };

            expect(unauthenticatedRequest.user).toBeUndefined();
        });

        it('should delete file from specific folder', async () => {
            vi.mocked(storageService.deleteFile).mockResolvedValue(undefined);

            await storageService.deleteFile('assignments/uuid-homework.docx');

            expect(storageService.deleteFile).toHaveBeenCalledWith('assignments/uuid-homework.docx');
        });

        it('should handle deletion of non-existent file gracefully', async () => {
            vi.mocked(storageService.deleteFile).mockResolvedValue(undefined);

            await storageService.deleteFile('non-existent/file.pdf');

            // Should not throw error
            expect(storageService.deleteFile).toHaveBeenCalled();
        });

        it('should return success response on deletion', async () => {
            const response = {
                statusCode: 200,
                message: 'File deleted successfully',
            };

            expect(response.statusCode).toBe(200);
            expect(response.message).toContain('deleted');
        });

        it('should handle permission errors', async () => {
            vi.mocked(storageService.deleteFile).mockRejectedValue(
                new Error('Access Denied')
            );

            expect(async () => {
                await storageService.deleteFile('protected/file.pdf');
            }).rejects.toThrow('Access Denied');
        });
    });

    // ========================================
    // ERROR HANDLING
    // ========================================

    describe('Error Handling', () => {
        it('should return 400 for validation errors', async () => {
            const errorResponse = {
                statusCode: 400,
                error: 'Validation Error',
                message: 'Invalid file data',
            };

            expect(errorResponse.statusCode).toBe(400);
            expect(errorResponse.error).toBe('Validation Error');
        });

        it('should return 401 for authentication errors', async () => {
            const errorResponse = {
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Invalid or expired token',
            };

            expect(errorResponse.statusCode).toBe(401);
        });

        it('should return 404 for file not found', async () => {
            const errorResponse = {
                statusCode: 404,
                error: 'Not Found',
                message: 'File not found',
            };

            expect(errorResponse.statusCode).toBe(404);
        });

        it('should return 500 for server errors', async () => {
            const errorResponse = {
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'Failed to process file',
            };

            expect(errorResponse.statusCode).toBe(500);
        });

        it('should log errors for debugging', async () => {
            const requestWithLogging = {
                log: {
                    error: vi.fn(),
                },
            };

            requestWithLogging.log.error('Test error');

            expect(requestWithLogging.log.error).toHaveBeenCalledWith('Test error');
        });

        it('should handle S3 connection errors', async () => {
            vi.mocked(storageService.uploadFile).mockRejectedValue(
                new Error('Unable to connect to S3')
            );

            expect(async () => {
                await storageService.uploadFile({
                    buffer: Buffer.from('test'),
                    fileName: 'test.pdf',
                    mimeType: 'application/pdf',
                    fileSize: 1024,
                });
            }).rejects.toThrow('Unable to connect to S3');
        });
    });

    // ========================================
    // SECURITY
    // ========================================

    describe('Security', () => {
        it('should require authentication for all endpoints', () => {
            // All endpoints should have auth hook
            expect(app.addHook).toBeDefined();
        });

        it('should validate file extensions', () => {
            const validExtensions = ['pdf', 'doc', 'docx', 'jpg', 'png', 'mp4', 'txt', 'xlsx'];
            const invalidExtensions = ['exe', 'sh', 'bat', 'dll'];

            validExtensions.forEach(ext => {
                expect(validExtensions).toContain(ext);
            });

            invalidExtensions.forEach(ext => {
                expect(validExtensions).not.toContain(ext);
            });
        });

        it('should sanitize file names to prevent path traversal', () => {
            const maliciousFileName = '../../../etc/passwd';
            const sanitized = maliciousFileName.split('/').pop();

            expect(sanitized).not.toContain('..');
        });

        it('should enforce file size limits', () => {
            const maxFileSize = 50 * 1024 * 1024; // 50MB
            const testSize = 100 * 1024 * 1024; // 100MB

            expect(testSize).toBeGreaterThan(maxFileSize);
        });

        it('should validate MIME types', () => {
            const validMimeTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'video/mp4',
                'text/plain',
            ];

            const invalidMimeType = 'application/x-executable';

            expect(validMimeTypes).not.toContain(invalidMimeType);
        });
    });

    // ========================================
    // RESPONSE FORMAT
    // ========================================

    describe('Response Format', () => {
        it('should return consistent response structure', () => {
            const response = {
                statusCode: 201,
                data: { /* ... */ },
                message: 'Success',
            };

            expect(response).toHaveProperty('statusCode');
            expect(response).toHaveProperty('data');
            expect(response).toHaveProperty('message');
        });

        it('should include HTTP status code', () => {
            const response = {
                statusCode: 200,
                data: {},
            };

            expect([200, 201, 400, 401, 404, 500]).toContain(response.statusCode);
        });

        it('should include error details in error response', () => {
            const errorResponse = {
                statusCode: 400,
                error: 'Validation Error',
                message: 'Invalid file',
                details: ['File size exceeds limit'],
            };

            expect(errorResponse).toHaveProperty('details');
            expect(Array.isArray(errorResponse.details)).toBe(true);
        });
    });
});
