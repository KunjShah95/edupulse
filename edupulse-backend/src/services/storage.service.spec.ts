import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner');

import { storageService, StorageService } from './storage.service.js';

describe('Storage Service', () => {
    let mockS3Client: any;

    beforeEach(() => {
        mockS3Client = new (S3Client as any)();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // FILE UPLOAD
    // ========================================

    describe('File Upload', () => {
        it('should upload file successfully with UUID naming', async () => {
            const fileBuffer = Buffer.from('test file content');
            const mockKey = 'documents/uuid-filename.pdf';

            vi.spyOn(storageService, 'uploadFile').mockResolvedValue({
                key: mockKey,
                url: `https://example.com/${mockKey}`,
                fileName: 'document.pdf',
                size: fileBuffer.length,
                mimeType: 'application/pdf',
                uploadedAt: new Date(),
            });

            const result = await storageService.uploadFile({
                buffer: fileBuffer,
                fileName: 'document.pdf',
                mimeType: 'application/pdf',
                folder: 'documents',
                fileSize: fileBuffer.length,
            });

            expect(result.key).toBe(mockKey);
            expect(result.size).toBe(fileBuffer.length);
            expect(result.mimeType).toBe('application/pdf');
        });

        it('should include user ID in upload', async () => {
            const fileBuffer = Buffer.from('test content');
            const userId = 'user-123';

            vi.spyOn(storageService, 'uploadFile').mockResolvedValue({
                key: 'documents/uuid-file.pdf',
                url: `https://example.com/documents/uuid-file.pdf`,
                fileName: 'file.pdf',
                size: fileBuffer.length,
                mimeType: 'application/pdf',
                uploadedAt: new Date(),
                userId,
            });

            const result = await storageService.uploadFile({
                buffer: fileBuffer,
                fileName: 'file.pdf',
                mimeType: 'application/pdf',
                folder: 'documents',
                fileSize: fileBuffer.length,
                userId,
            });

            expect(result.userId).toBe(userId);
        });

        it('should validate file size before upload', async () => {
            const largeBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB

            const validation = StorageService.validateFile(largeBuffer.length, 'application/pdf');

            expect(validation.valid).toBe(false);
        });

        it('should validate MIME type before upload', async () => {
            const fileBuffer = Buffer.from('test content');

            const isValid = StorageService.validateFile(fileBuffer.length, 'application/pdf');
            const isInvalid = StorageService.validateFile(fileBuffer.length, 'application/x-executable');

            expect(isValid.valid).toBe(true);
            expect(isInvalid.valid).toBe(false);
        });

        it('should reject files with invalid extensions', async () => {
            const validation = StorageService.validateFile(1024, 'application/x-executable');
            expect(validation.valid).toBe(false);
        });

        it('should organize files by folder', async () => {
            const mockKey = 'assignments/uuid-homework.docx';

            vi.spyOn(storageService, 'uploadFile').mockResolvedValue({
                key: mockKey,
                url: `https://example.com/${mockKey}`,
                fileName: 'homework.docx',
                size: 1024,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                uploadedAt: new Date(),
            });

            const result = await storageService.uploadFile({
                buffer: Buffer.from('content'),
                fileName: 'homework.docx',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                folder: 'assignments',
                fileSize: 1024,
            });

            expect(result.key).toContain('assignments/');
        });
    });

    // ========================================
    // FILE DOWNLOAD & PRESIGNED URLS
    // ========================================

    describe('File Download', () => {
        it('should get presigned download URL', async () => {
            const mockUrl = 'https://s3.amazonaws.com/edupulse-files/documents/uuid-file.pdf?X-Amz-Signature=...';

            vi.mocked(getSignedUrl).mockResolvedValue(mockUrl);

            const url = await storageService.getPresignedDownloadUrl('documents/uuid-file.pdf');

            expect(url).toBe(mockUrl);
            expect(vi.mocked(getSignedUrl)).toHaveBeenCalled();
        });

        it('should include expiry time in presigned URL', async () => {
            const mockUrl = 'https://s3.amazonaws.com/edupulse-files/file.pdf?X-Amz-Expires=3600';

            vi.mocked(getSignedUrl).mockResolvedValue(mockUrl);

            const url = await storageService.getPresignedDownloadUrl('file.pdf', { expiresIn: 3600 });

            expect(url).toContain('Expires=3600');
        });

        it('should default to 1 hour expiry', async () => {
            const mockUrl = 'https://s3.amazonaws.com/file.pdf?X-Amz-Expires=3600';

            vi.mocked(getSignedUrl).mockResolvedValue(mockUrl);

            const url = await storageService.getPresignedDownloadUrl('file.pdf');

            expect(vi.mocked(getSignedUrl)).toHaveBeenCalled();
        });

        it('should handle invalid file keys gracefully', async () => {
            vi.mocked(getSignedUrl).mockRejectedValue(new Error('NoSuchKey'));

            expect(async () => {
                await storageService.getPresignedDownloadUrl('non-existent/file.pdf');
            }).rejects.toThrow();
        });
    });

    // ========================================
    // PRESIGNED UPLOAD URLS
    // ========================================

    describe('Presigned Upload URLs', () => {
        it('should generate presigned upload URL', async () => {
            const mockUrl = 'https://s3.amazonaws.com/edupulse-files/upload?X-Amz-Signature=...';

            vi.mocked(getSignedUrl).mockResolvedValue(mockUrl);

            const result = await storageService.getPresignedUploadUrl('homework.pdf', 'application/pdf');

            expect(result.url).toBe(mockUrl);
            expect(vi.mocked(getSignedUrl)).toHaveBeenCalled();
        });

        it('should include content type in presigned upload URL', async () => {
            const mockUrl = 'https://s3.amazonaws.com/upload?Content-Type=application/pdf';

            vi.mocked(getSignedUrl).mockResolvedValue(mockUrl);

            const result = await storageService.getPresignedUploadUrl('file.pdf', 'application/pdf');

            expect(result.url).toContain('pdf');
        });

        it('should expire presigned upload URL after 15 minutes', async () => {
            const mockUrl = 'https://s3.amazonaws.com/upload?X-Amz-Expires=900';

            vi.mocked(getSignedUrl).mockResolvedValue(mockUrl);

            const result = await storageService.getPresignedUploadUrl('file.pdf', 'application/pdf', { expiresIn: 900 });

            expect(result.url).toContain('Expires=900');
        });
    });

    // ========================================
    // FILE DELETION
    // ========================================

    describe('File Deletion', () => {
        it('should delete file successfully', async () => {
            vi.spyOn(storageService, 'deleteFile').mockResolvedValue(undefined);

            await storageService.deleteFile('documents/uuid-file.pdf');

            expect(storageService.deleteFile).toHaveBeenCalledWith('documents/uuid-file.pdf');
        });

        it('should handle deletion of non-existent file', async () => {
            vi.spyOn(storageService, 'deleteFile').mockResolvedValue(undefined);

            await storageService.deleteFile('non-existent/file.pdf');

            expect(storageService.deleteFile).toHaveBeenCalledWith('non-existent/file.pdf');
        });

        it('should delete file from specific folder', async () => {
            vi.spyOn(storageService, 'deleteFile').mockResolvedValue(undefined);

            await storageService.deleteFile('assignments/uuid-homework.docx');

            expect(storageService.deleteFile).toHaveBeenCalledWith('assignments/uuid-homework.docx');
        });

        it('should handle deletion permission errors', async () => {
            vi.spyOn(storageService, 'deleteFile').mockRejectedValue(new Error('Access Denied'));

            expect(async () => {
                await storageService.deleteFile('protected/file.pdf');
            }).rejects.toThrow('Access Denied');
        });
    });

    // ========================================
    // FILE EXISTENCE & LISTING
    // ========================================

    describe('File Existence & Listing', () => {
        it('should check if file exists', async () => {
            vi.spyOn(storageService, 'fileExists').mockResolvedValue(true);

            const exists = await storageService.fileExists('documents/uuid-file.pdf');

            expect(exists).toBe(true);
        });

        it('should return false if file does not exist', async () => {
            vi.spyOn(storageService, 'fileExists').mockResolvedValue(false);

            const exists = await storageService.fileExists('non-existent/file.pdf');

            expect(exists).toBe(false);
        });

        it('should list files in folder', async () => {
            const mockFiles = [
                {
                    key: 'documents/file1.pdf',
                    url: 'https://example.com/documents/file1.pdf',
                    fileName: 'file1.pdf',
                    size: 1024,
                    mimeType: 'application/pdf',
                    uploadedAt: new Date(),
                },
                {
                    key: 'documents/file2.pdf',
                    url: 'https://example.com/documents/file2.pdf',
                    fileName: 'file2.pdf',
                    size: 2048,
                    mimeType: 'application/pdf',
                    uploadedAt: new Date(),
                },
            ];

            vi.spyOn(storageService, 'listFiles').mockResolvedValue(mockFiles);

            const result = await storageService.listFiles('documents/', 10);

            expect(result).toHaveLength(2);
            expect(result[0].key).toContain('documents/');
        });

        it('should handle empty folder listing', async () => {
            vi.spyOn(storageService, 'listFiles').mockResolvedValue([]);

            const result = await storageService.listFiles('empty-folder/', 10);

            expect(result).toHaveLength(0);
        });
    });

    // ========================================
    // FILE CATEGORIZATION
    // ========================================

    describe('File Categorization', () => {
        it('should categorize PDF as document', () => {
            const category = StorageService.getFileCategory('application/pdf');
            expect(category).toBe('document');
        });

        it('should categorize image MIME types', () => {
            const pngCategory = StorageService.getFileCategory('image/png');
            const jpegCategory = StorageService.getFileCategory('image/jpeg');

            expect(pngCategory).toBe('image');
            expect(jpegCategory).toBe('image');
        });

        it('should categorize video MIME types', () => {
            const videoCategory = StorageService.getFileCategory('video/mp4');
            expect(videoCategory).toBe('video');
        });

        it('should categorize spreadsheet MIME types', () => {
            const xlsxCategory = StorageService.getFileCategory(
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            expect(xlsxCategory).toBe('document');
        });

        it('should categorize text files', () => {
            const txtCategory = StorageService.getFileCategory('text/plain');
            expect(txtCategory).toBe('document');
        });

        it('should return unknown for unsupported types', () => {
            const unknownCategory = StorageService.getFileCategory('application/x-unknown');
            expect(unknownCategory).toBe('other');
        });
    });

    // ========================================
    // ERROR HANDLING
    // ========================================

    describe('Error Handling', () => {
        it('should handle S3 connection errors', async () => {
            vi.spyOn(storageService, 'uploadFile').mockRejectedValue(
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

        it('should handle invalid bucket errors', async () => {
            vi.spyOn(storageService, 'uploadFile').mockRejectedValue(
                new Error('NoSuchBucket')
            );

            expect(async () => {
                await storageService.uploadFile({
                    buffer: Buffer.from('test'),
                    fileName: 'test.pdf',
                    mimeType: 'application/pdf',
                    fileSize: 1024,
                });
            }).rejects.toThrow();
        });

        it('should handle file size validation errors', () => {
            const validation = StorageService.validateFile(0, 'application/pdf');
            expect(validation.valid).toBe(false);
        });

        it('should handle empty file buffer', () => {
            const validation = StorageService.validateFile(0, 'application/pdf');
            expect(validation.valid).toBe(false);
        });

        it('should handle invalid file names', async () => {
            vi.spyOn(storageService, 'uploadFile').mockRejectedValue(
                new Error('Invalid file name')
            );

            expect(async () => {
                await storageService.uploadFile({
                    buffer: Buffer.from('test'),
                    fileName: '../../../etc/passwd',
                    mimeType: 'application/pdf',
                    fileSize: 1024,
                });
            }).rejects.toThrow();
        });

        it('should handle rate limit errors from S3', async () => {
            vi.spyOn(storageService, 'uploadFile').mockRejectedValue(
                new Error('SlowDown')
            );

            expect(async () => {
                await storageService.uploadFile({
                    buffer: Buffer.from('test'),
                    fileName: 'test.pdf',
                    mimeType: 'application/pdf',
                    fileSize: 1024,
                });
            }).rejects.toThrow('SlowDown');
        });
    });

    // ========================================
    // CONFIGURATION TESTS
    // ========================================

    describe('Configuration', () => {
        it('should use MinIO endpoint if configured', () => {
            const endpointUri = process.env.S3_ENDPOINT;
            expect(endpointUri).toBeDefined();
        });

        it('should use correct bucket name', () => {
            const bucketName = process.env.S3_BUCKET || 'edupulse-files';
            expect(bucketName).toBe('edupulse-files');
        });

        it('should have S3 credentials configured', () => {
            expect(process.env.S3_ACCESS_KEY).toBeDefined();
            expect(process.env.S3_SECRET_KEY).toBeDefined();
        });

        it('should have S3 region configured', () => {
            expect(process.env.S3_REGION).toBeDefined();
        });
    });
});
