import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface UploadOptions {
    fileName: string;
    fileSize: number;
    mimeType: string;
    buffer: Buffer;
    userId?: string;
    folder?: string;
}

export interface FileMetadata {
    key: string;
    url: string;
    fileName: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
    userId?: string;
}

export interface PresignedUrlOptions {
    expiresIn?: number;
}

export class StorageService {
    private s3Client: S3Client;
    private bucket: string;

    constructor() {
        // Initialize S3 client with custom endpoint for MinIO/self-hosted S3
        this.s3Client = new S3Client({
            region: config.storage.region,
            credentials: {
                accessKeyId: config.storage.accessKey,
                secretAccessKey: config.storage.secretKey,
            },
            ...(config.storage.endpoint && {
                endpoint: config.storage.endpoint,
                forcePathStyle: true, // Required for MinIO
            }),
        });

        this.bucket = config.storage.bucket;
    }

    /**
     * Upload file to S3
     */
    async uploadFile(options: UploadOptions): Promise<FileMetadata> {
        if (!config.storage.accessKey || !config.storage.secretKey) {
            throw new Error('S3 credentials not configured');
        }

        try {
            // Generate unique file key
            const fileExt = this.getFileExtension(options.fileName);
            const uniqueName = `${uuidv4()}${fileExt}`;
            const folder = options.folder || 'uploads';
            const key = `${folder}/${uniqueName}`;

            // Prepare metadata
            const metadata: Record<string, string> = {
                originalName: options.fileName,
                uploadedAt: new Date().toISOString(),
            };

            if (options.userId) {
                metadata.userId = options.userId;
            }

            // Upload to S3
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: options.buffer,
                ContentType: options.mimeType,
                ContentLength: options.fileSize,
                Metadata: metadata,
            });

            await this.s3Client.send(command);

            // Generate public URL
            const url = this.getFileUrl(key);

            return {
                key,
                url,
                fileName: options.fileName,
                size: options.fileSize,
                mimeType: options.mimeType,
                uploadedAt: new Date(),
                userId: options.userId,
            };
        } catch (error: any) {
            console.error('S3 upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    /**
     * Delete file from S3
     */
    async deleteFile(key: string): Promise<void> {
        if (!config.storage.accessKey || !config.storage.secretKey) {
            throw new Error('S3 credentials not configured');
        }

        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            await this.s3Client.send(command);
        } catch (error: any) {
            console.error('S3 delete error:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Get presigned URL for file download
     */
    async getPresignedDownloadUrl(
        key: string,
        options?: PresignedUrlOptions
    ): Promise<string> {
        if (!config.storage.accessKey || !config.storage.secretKey) {
            throw new Error('S3 credentials not configured');
        }

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            const url = await getSignedUrl(this.s3Client, command, {
                expiresIn: options?.expiresIn || 3600, // 1 hour default
            });

            return url;
        } catch (error: any) {
            console.error('Presigned URL generation error:', error);
            throw new Error(`Failed to generate presigned URL: ${error.message}`);
        }
    }

    /**
     * Get presigned URL for file upload
     */
    async getPresignedUploadUrl(
        fileName: string,
        mimeType: string,
        options?: PresignedUrlOptions
    ): Promise<{ url: string; key: string }> {
        if (!config.storage.accessKey || !config.storage.secretKey) {
            throw new Error('S3 credentials not configured');
        }

        try {
            const fileExt = this.getFileExtension(fileName);
            const uniqueName = `${uuidv4()}${fileExt}`;
            const key = `uploads/${uniqueName}`;

            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                ContentType: mimeType,
            });

            const url = await getSignedUrl(this.s3Client, command, {
                expiresIn: options?.expiresIn || 3600, // 1 hour default
            });

            return { url, key };
        } catch (error: any) {
            console.error('Presigned upload URL generation error:', error);
            throw new Error(`Failed to generate presigned upload URL: ${error.message}`);
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(key: string): Promise<boolean> {
        if (!config.storage.accessKey || !config.storage.secretKey) {
            return false;
        }

        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            await this.s3Client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === 'NotFound') {
                return false;
            }
            console.error('S3 head object error:', error);
            return false;
        }
    }

    /**
     * List files in folder
     */
    async listFiles(
        folder: string = 'uploads',
        maxKeys: number = 100
    ): Promise<FileMetadata[]> {
        if (!config.storage.accessKey || !config.storage.secretKey) {
            throw new Error('S3 credentials not configured');
        }

        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: folder,
                MaxKeys: maxKeys,
            });

            const response = await this.s3Client.send(command);
            const files: FileMetadata[] = [];

            if (response.Contents) {
                for (const obj of response.Contents) {
                    if (obj.Key) {
                        files.push({
                            key: obj.Key,
                            url: this.getFileUrl(obj.Key),
                            fileName: this.getFileName(obj.Key),
                            size: obj.Size || 0,
                            mimeType: 'application/octet-stream',
                            uploadedAt: obj.LastModified || new Date(),
                        });
                    }
                }
            }

            return files;
        } catch (error: any) {
            console.error('S3 list objects error:', error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    /**
     * Generate public URL for file
     */
    private getFileUrl(key: string): string {
        if (config.storage.endpoint) {
            // Self-hosted S3 or MinIO
            return `${config.storage.endpoint}/${config.storage.bucket}/${key}`;
        }
        // AWS S3
        return `https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/${key}`;
    }

    /**
     * Extract file name from key
     */
    private getFileName(key: string): string {
        return key.split('/').pop() || key;
    }

    /**
     * Get file extension
     */
    private getFileExtension(fileName: string): string {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot) : '';
    }

    /**
     * Validate file size and type
     */
    static validateFile(
        fileSize: number,
        mimeType: string,
        maxSizeMB: number = 50,
        allowedTypes: string[] = []
    ): { valid: boolean; error?: string } {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        if (fileSize > maxSizeBytes) {
            return {
                valid: false,
                error: `File size exceeds maximum of ${maxSizeMB}MB`,
            };
        }

        if (allowedTypes.length > 0 && !allowedTypes.includes(mimeType)) {
            return {
                valid: false,
                error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
            };
        }

        return { valid: true };
    }

    /**
     * Get file type category
     */
    static getFileCategory(mimeType: string): 'image' | 'document' | 'video' | 'audio' | 'other' {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (
            mimeType.includes('pdf') ||
            mimeType.includes('document') ||
            mimeType.includes('word') ||
            mimeType.includes('sheet')
        ) {
            return 'document';
        }
        return 'other';
    }
}

// Export singleton instance
export const storageService = new StorageService();
