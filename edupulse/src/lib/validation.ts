import { z } from 'zod';

// User registration validation schema
export const signupSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z
        .string()
        .min(1, 'First name is required')
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must be less than 50 characters')
        .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces')
        .trim(),
    lastName: z
        .string()
        .min(1, 'Last name is required')
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must be less than 50 characters')
        .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces')
        .trim(),
    role: z.enum(['student', 'teacher', 'admin', 'parent'], {
        message: 'Please select a role',
    }),
    grade: z.string().optional(),
    section: z.string().optional(),
    phone: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^[+]?[1-9][\d]{0,15}$/.test(val),
            'Please enter a valid phone number'
        ),
    subject: z.string().optional(),
    department: z.string().optional(),
    adminCode: z.string().optional(),
    childName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
}).refine((data) => {
    if (data.role === 'student') {
        return data.grade && data.grade.trim() !== '';
    }
    return true;
}, {
    message: 'Grade is required for students',
    path: ['grade'],
}).refine((data) => {
    if (data.role === 'teacher') {
        return data.subject && data.subject.trim() !== '';
    }
    return true;
}, {
    message: 'Subject is required for teachers',
    path: ['subject'],
}).refine((data) => {
    if (data.role === 'admin') {
        return data.adminCode && data.adminCode.trim() !== '';
    }
    return true;
}, {
    message: 'Admin code is required for administrators',
    path: ['adminCode'],
}).refine((data) => {
    if (data.role === 'parent') {
        return data.childName && data.childName.trim() !== '';
    }
    return true;
}, {
    message: 'Child name is required for parents',
    path: ['childName'],
});

// User login validation schema
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters'),
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
    firstName: z
        .string()
        .min(1, 'First name is required')
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must be less than 50 characters')
        .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces')
        .trim(),
    lastName: z
        .string()
        .min(1, 'Last name is required')
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must be less than 50 characters')
        .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces')
        .trim(),
    phone: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^[+]?[1-9][\d]{0,15}$/.test(val),
            'Please enter a valid phone number'
        ),
    grade: z.string().optional(),
    section: z.string().optional(),
    subject: z.string().optional(),
    department: z.string().optional(),
    childName: z.string().optional(),
});

// Password change validation schema
export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'New password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
});

// Password reset request validation schema
export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .toLowerCase()
        .trim(),
});

// Password reset validation schema
export const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

// Quiz creation validation schema
export const quizCreationSchema = z.object({
    title: z
        .string()
        .min(1, 'Quiz title is required')
        .min(3, 'Quiz title must be at least 3 characters')
        .max(100, 'Quiz title must be less than 100 characters')
        .trim(),
    description: z
        .string()
        .max(500, 'Description must be less than 500 characters')
        .optional(),
    subject: z
        .string()
        .min(1, 'Subject is required')
        .trim(),
    grade: z
        .string()
        .min(1, 'Grade is required')
        .trim(),
    timeLimit: z
        .number()
        .min(1, 'Time limit must be at least 1 minute')
        .max(180, 'Time limit cannot exceed 180 minutes'),
    passingScore: z
        .number()
        .min(0, 'Passing score must be at least 0%')
        .max(100, 'Passing score cannot exceed 100%'),
    questions: z
        .array(z.object({
            question: z.string().min(1, 'Question text is required'),
            type: z.enum(['multiple-choice', 'true-false', 'short-answer']),
            options: z.array(z.string()).optional(),
            correctAnswer: z.string().min(1, 'Correct answer is required'),
            explanation: z.string().optional(),
            points: z.number().min(0, 'Points must be non-negative'),
        }))
        .min(1, 'Quiz must have at least one question'),
});

// Message validation schema
export const messageSchema = z.object({
    content: z
        .string()
        .min(1, 'Message cannot be empty')
        .max(1000, 'Message cannot exceed 1000 characters')
        .trim(),
    recipientId: z.string().min(1, 'Recipient is required'),
});

// File upload validation schema
export const fileUploadSchema = z.object({
    file: z
        .instanceof(File)
        .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
        .refine(
            (file) => [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
                'text/plain',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ].includes(file.type),
            'Invalid file type. Allowed: images, PDF, text, and Word documents'
        ),
    description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
});

// Search validation schema
export const searchSchema = z.object({
    query: z
        .string()
        .min(1, 'Search query is required')
        .max(100, 'Search query cannot exceed 100 characters')
        .trim(),
    filters: z.object({
        type: z.enum(['all', 'students', 'teachers', 'quizzes', 'messages']).optional(),
        subject: z.string().optional(),
        grade: z.string().optional(),
    }).optional(),
});

// Notification validation schema
export const notificationSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title cannot exceed 100 characters')
        .trim(),
    message: z
        .string()
        .min(1, 'Message is required')
        .max(500, 'Message cannot exceed 500 characters')
        .trim(),
    type: z.enum(['info', 'success', 'warning', 'error']),
    actionUrl: z.string().url('Please enter a valid URL').optional(),
});

// Type exports for TypeScript
export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type QuizCreationFormData = z.infer<typeof quizCreationSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type NotificationFormData = z.infer<typeof notificationSchema>;
