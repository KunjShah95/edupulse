import { z } from 'zod';

// ========================================
// Registration DTOs
// ========================================

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    role: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'PARENT']),
    phone: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),

    // Role-specific fields
    // Student
    gradeLevel: z.string().optional(),
    section: z.string().optional(),
    rollNumber: z.string().optional(),
    stream: z.string().optional(),

    // Teacher
    department: z.string().optional(),
    subjects: z.array(z.string()).optional(),
    employeeId: z.string().optional(),
    qualification: z.string().optional(),

    // Admin
    adminCode: z.string().optional(),

    // Parent
    childStudentId: z.string().optional(),
    occupation: z.string().optional(),
    relationship: z.string().optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

// ========================================
// Login DTOs
// ========================================

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof loginSchema>;

// ========================================
// Password Reset DTOs
// ========================================

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

// ========================================
// Email Verification DTOs
// ========================================

export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

// ========================================
// Refresh Token DTOs
// ========================================

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
