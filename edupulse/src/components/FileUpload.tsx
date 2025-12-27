import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, Image, FileText, Film, Music, Archive, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient, ApiError } from '../lib/api-client';
import { useAnnouncement } from '../hooks/useAccessibility';

// Type definitions
const DEFAULT_ACCEPTED_TYPES: readonly [string, ...string[]] = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'];

export interface UploadedFile {
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
    createdAt: string;
}

export interface FileUploadProps {
    onUploadComplete?: (file: UploadedFile) => void;
    onUploadError?: (error: string) => void;
    maxFiles?: number;
    maxFileSize?: number; // in MB
    acceptedTypes?: readonly string[];
    multiple?: boolean;
    className?: string;
}

interface FileWithPreview extends File {
    preview?: string;
    progress?: number;
    error?: string;
    uploaded?: boolean;
    id?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onUploadComplete,
    onUploadError,
    maxFiles = 5,
    maxFileSize = 10,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    multiple = true,
    className = ''
}) => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { announce } = useAnnouncement();

    // Get file icon based on type
    const getFileIcon = (file: File) => {
        const type = file.type;
        if (type.startsWith('image/')) return Image;
        if (type.startsWith('video/')) return Film;
        if (type.startsWith('audio/')) return Music;
        if (type.includes('pdf') || type.includes('document')) return FileText;
        if (type.includes('zip') || type.includes('rar')) return Archive;
        return File;
    };

    // Validate file
    const validateFile = useCallback((file: File): string | null => {
        if (file.size > maxFileSize * 1024 * 1024) {
            return `File size must be less than ${maxFileSize}MB`;
        }
        if (acceptedTypes.length > 0 && !acceptedTypes.some(type => {
            if (type.includes('*')) {
                const baseType = type.split('/')[0];
                return file.type.startsWith(baseType);
            }
            return file.type === type || file.name.toLowerCase().endsWith(type.replace('*', ''));
        })) {
            return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
        }
        return null;
    }, [acceptedTypes, maxFileSize]);

    // Create preview for images
    const createPreview = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Failed to read file'));
                
                try {
                    reader.readAsDataURL(file);
                } catch (error) {
                    reject(error);
                }
            } else {
                resolve('');
            }
        });
    };

    // Handle file selection
    const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const fileArray = Array.from(selectedFiles);
        const newFiles: FileWithPreview[] = [];

        for (const file of fileArray) {
            const error = validateFile(file);
            if (error) {
                onUploadError?.(error);
                continue;
            }

            // Create a proper FileWithPreview object
            const fileWithPreview: FileWithPreview = {
                ...file,
                preview: '',
                progress: undefined,
                error: undefined,
                uploaded: false,
                id: undefined
            };
            
            try {
                fileWithPreview.preview = await createPreview(file);
            } catch (err) {
                console.warn('Failed to create preview for file:', file.name, err);
                fileWithPreview.preview = '';
            }
            
            newFiles.push(fileWithPreview);
        }

        setFiles(prev => {
            const totalFiles = prev.length + newFiles.length;
            if (totalFiles > maxFiles) {
                onUploadError?.(`Maximum ${maxFiles} files allowed`);
                return prev;
            }
            return [...prev, ...newFiles];
        });

        announce(`${newFiles.length} file(s) selected`, 'polite');
    }, [announce, validateFile, onUploadError, maxFiles]);

    // Handle drag and drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    // Remove file
    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        announce(`File removed`, 'polite');
    };

    // Upload files
    const uploadFiles = async () => {
        if (files.length === 0) return;

        setUploading(true);
        const uploadPromises = files.map(async (file, index) => {
            try {
                // Update progress
                setFiles(prev => prev.map((f, i) => 
                    i === index ? { ...f, progress: 0 } : f
                ));

                const result = await apiClient.uploadFile(file, `Uploaded from EduPulse`);

                // Validate and transform response
                const responseData = result as { id: string; name: string; url: string };
                if (!responseData || !responseData.id || !responseData.name || !responseData.url) {
                    const errorMessage = 'Invalid upload response from server';
                    setFiles(prev => prev.map((f, i) => 
                        i === index ? { ...f, error: errorMessage } : f
                    ));
                    onUploadError?.(errorMessage);
                    return null;
                }

                // Transform to match UploadedFile interface
                const uploadedFile: UploadedFile = {
                    id: responseData.id,
                    name: responseData.name,
                    url: responseData.url,
                    size: file.size,
                    mimeType: file.type,
                    createdAt: new Date().toISOString()
                };

                // Mark as uploaded
                setFiles(prev => prev.map((f, i) => 
                    i === index ? { ...f, uploaded: true, progress: 100 } : f
                ));

                onUploadComplete?.(uploadedFile);
                return uploadedFile;
            } catch (error) {
                const errorMessage = error instanceof ApiError ? error.message : 'Upload failed';
                setFiles(prev => prev.map((f, i) => 
                    i === index ? { ...f, error: errorMessage } : f
                ));
                onUploadError?.(errorMessage);
                return null;
            }
        });

        try {
            await Promise.all(uploadPromises);
            announce('All files uploaded successfully', 'polite');
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Map progress percentage to CSS classes (avoids inline styles)
    const getProgressClass = (progress?: number) => {
        if (progress === undefined) return 'progress-w-0';
        const pct = Math.max(0, Math.min(100, Math.round(progress / 5) * 5));
        return `progress-w-${pct}`;
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDragOver
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-300 dark:border-zinc-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={multiple}
                    accept={acceptedTypes.join(',')}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="File upload input"
                    aria-label="Upload files"
                />
                
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragOver ? 'text-emerald-500' : 'text-slate-400'}`} />
                
                <div className="space-y-2">
                    <p className="text-lg font-medium text-slate-900 dark:text-white">
                        {isDragOver ? 'Drop files here' : 'Upload files'}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                        Drag and drop files here, or{' '}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                        >
                            browse
                        </button>
                    </p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">
                        Maximum {maxFiles} files, up to {maxFileSize}MB each
                    </p>
                </div>
            </div>

            {/* File List */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        {files.map((file, index) => {
                            const Icon = getFileIcon(file);
                            return (
                                <motion.div
                                    key={`${file.name}-${index}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                                >
                                    {/* File Preview/Icon */}
                                    <div className="shrink-0">
                                        {file.preview ? (
                                            <img
                                                src={file.preview}
                                                alt={file.name}
                                                className="w-10 h-10 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-700 rounded flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-slate-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                                            {formatFileSize(file.size)}
                                        </p>
                                        
                                        {/* Progress Bar */}
                                        {file.progress !== undefined && (
                                            <div className="mt-1">
                                                <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-1">
                                                    <div
                                                        className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
                                                        style={{ width: `${file.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Error Message */}
                                        {file.error && (
                                            <div className="mt-1 flex items-center gap-1 text-red-500">
                                                <AlertCircle className="w-3 h-3" />
                                                <span className="text-xs">{file.error}</span>
                                            </div>
                                        )}

                                        {/* Success Message */}
                                        {file.uploaded && (
                                            <div className="mt-1 flex items-center gap-1 text-emerald-500">
                                                <CheckCircle className="w-3 h-3" />
                                                <span className="text-xs">Uploaded successfully</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeFile(index)}
                                        disabled={uploading}
                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Remove file"
                                        aria-label={`Remove ${files[index].name}`}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upload Button */}
            {files.length > 0 && !uploading && (
                <button
                    onClick={uploadFiles}
                    className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <Upload className="w-4 h-4" />
                    Upload {files.length} file{files.length > 1 ? 's' : ''}
                </button>
            )}

            {/* Uploading State */}
            {uploading && (
                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Uploading files...</span>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
