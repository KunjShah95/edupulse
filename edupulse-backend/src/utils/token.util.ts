// ========================================
// TOKEN UTILITIES
// ========================================

import jwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';
import { generateSecureRandomString } from './hash.util.js';

export interface TokenPayload {
    id: string;
    email: string;
    role: string;
    type: 'access' | 'refresh' | 'email-verification' | 'password-reset';
    iat?: number;
    exp?: number;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (
    payload: Omit<TokenPayload, 'type'>,
    jwtSign: any,
    expiresIn: string = '15m'
): string => {
    return jwtSign.sign(
        { ...payload, type: 'access' },
        { expiresIn }
    );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (
    payload: Omit<TokenPayload, 'type'>,
    jwtSign: any,
    expiresIn: string = '7d'
): string => {
    return jwtSign.sign(
        { ...payload, type: 'refresh' },
        { expiresIn }
    );
};

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (
    payload: Omit<TokenPayload, 'type'>,
    jwtSign: any,
    expiresIn: string = '24h'
): string => {
    return jwtSign.sign(
        { ...payload, type: 'email-verification' },
        { expiresIn }
    );
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (
    payload: Omit<TokenPayload, 'type'>,
    jwtSign: any,
    expiresIn: string = '1h'
): string => {
    return jwtSign.sign(
        { ...payload, type: 'password-reset' },
        { expiresIn }
    );
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (
    payload: Omit<TokenPayload, 'type'>,
    jwtSign: any
): TokenPair => {
    return {
        accessToken: generateAccessToken(payload, jwtSign),
        refreshToken: generateRefreshToken(payload, jwtSign),
    };
};

/**
 * Verify token and return payload
 */
export const verifyToken = async (
    token: string,
    jwtVerify: any
): Promise<TokenPayload> => {
    try {
        const decoded = await jwtVerify.verify(token);
        return decoded as TokenPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    
    return parts[1];
};

/**
 * Generate a random token for external use
 */
export const generateRandomToken = (): string => {
    return generateSecureRandomString(64);
};

/**
 * Check if token type is valid for the operation
 */
export const isValidTokenType = (token: TokenPayload, expectedType: TokenPayload['type']): boolean => {
    return token.type === expectedType;
};

/**
 * Create JWT configuration for different token types
 */
export const getTokenConfig = (type: TokenPayload['type']) => {
    switch (type) {
        case 'access':
            return { expiresIn: '15m' };
        case 'refresh':
            return { expiresIn: '7d' };
        case 'email-verification':
            return { expiresIn: '24h' };
        case 'password-reset':
            return { expiresIn: '1h' };
        default:
            return { expiresIn: '15m' };
    }
};

export default {
    generateAccessToken,
    generateRefreshToken,
    generateEmailVerificationToken,
    generatePasswordResetToken,
    generateTokenPair,
    verifyToken,
    extractTokenFromHeader,
    generateRandomToken,
    isValidTokenType,
    getTokenConfig,
};
