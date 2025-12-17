// ========================================
// HASH UTILITIES
// ========================================

import argon2 from 'argon2';
import crypto from 'crypto';

// Hash configuration
const ARGON2_CONFIG = {
    type: argon2.argon2id,
    timeCost: 3,
    memoryCost: 65536, // 64 MB
    parallelism: 1,
};

/**
 * Hash a password using Argon2
 */
export const hashPassword = async (password: string): Promise<string> => {
    return argon2.hash(password, ARGON2_CONFIG);
};

/**
 * Verify a password against its hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return argon2.verify(hash, password);
};

/**
 * Generate a secure random string (for tokens, etc.)
 */
export const generateSecureRandomString = (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a random string for verification tokens
 */
export const generateVerificationToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (length: number = 12): string => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, charset.length);
        password += charset[randomIndex];
    }
    
    return password;
};

/**
 * Hash sensitive data (like verification tokens)
 */
export const hashData = async (data: string): Promise<string> => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a hash for comparison (like password reset tokens)
 */
export const generateHashFromData = (data: string): string => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Generate a random 6-digit code for OTP
 */
export const generateOTPCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number format (basic validation)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export default {
    hashPassword,
    verifyPassword,
    generateSecureRandomString,
    generateVerificationToken,
    generateSecurePassword,
    hashData,
    generateHashFromData,
    validatePasswordStrength,
    generateOTPCode,
    isValidEmail,
    isValidPhoneNumber,
};
