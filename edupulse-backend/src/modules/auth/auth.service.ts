import { PrismaClient, UserRole, UserStatus, Gender } from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

import {
    type RegisterDto,
    type LoginDto,
    type ForgotPasswordDto,
    type ResetPasswordDto,
    type VerifyEmailDto,
    type RefreshTokenDto,
} from './auth.dto.js';
import { emailService } from '../../services/email.service.js';
import config from '../../config/index.js';

interface TokenPayload {
    id: string;
    email: string;
    role: string;
}

interface Tokens {
    accessToken: string;
    refreshToken: string;
}

interface AuthResult {
    user: any;
    tokens: Tokens;
}

class AuthService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // ========================================
    // REGISTRATION
    // ========================================

    async register(data: RegisterDto, jwtSign: (payload: TokenPayload) => string): Promise<AuthResult> {
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await argon2.hash(data.password);

        // Generate email verification token
        const emailVerifyToken = nanoid(32);
        const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user with profile based on role
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role as UserRole,
                phone: data.phone,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender as Gender,
                emailVerifyToken,
                emailVerifyExpiry,
            },
        });

        // Create role-specific profile
        await this.createRoleProfile(user, data);

        // Initialize gamification for students
        if (data.role === 'STUDENT') {
            await this.prisma.gamification.create({
                data: {
                    userId: user.id,
                },
            });
        }

        // Generate tokens
        const tokens = await this.generateTokens(user, jwtSign);

        // Store refresh token
        await this.storeRefreshToken(user.id, tokens.refreshToken);

        // Send verification email
        try {
            const verificationUrl = `${config.frontendUrl}/verify-email?token=${emailVerifyToken}`;
            await emailService.sendVerificationEmail({
                email: user.email,
                verificationToken: emailVerifyToken,
                verificationUrl,
            });
        } catch (error: any) {
            console.warn('Failed to send verification email:', error.message);
            // Continue registration even if email fails
        }

        // Return user without sensitive data
        const { password, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            tokens,
        };
    }

    private async createRoleProfile(user: any, data: RegisterDto): Promise<void> {
        switch (user.role) {
            case 'STUDENT':
                if (!data.rollNumber || !data.gradeLevel || !data.section) {
                    throw new Error('Student registration requires rollNumber, gradeLevel, and section');
                }

                await this.prisma.student.create({
                    data: {
                        userId: user.id,
                        rollNumber: data.rollNumber,
                        gradeLevel: data.gradeLevel,
                        section: data.section,
                        stream: data.stream,
                    },
                });
                break;

            case 'TEACHER':
                if (!data.employeeId || !data.department) {
                    throw new Error('Teacher registration requires employeeId and department');
                }

                await this.prisma.teacher.create({
                    data: {
                        userId: user.id,
                        employeeId: data.employeeId,
                        department: data.department,
                        subjects: data.subjects || [],
                        qualification: data.qualification,
                    },
                });
                break;

            case 'ADMIN':
                if (!data.adminCode) {
                    throw new Error('Admin registration requires adminCode');
                }

                await this.prisma.admin.create({
                    data: {
                        userId: user.id,
                        adminCode: data.adminCode,
                        department: data.department || 'Administration',
                        accessLevel: 1,
                    },
                });
                break;

            case 'PARENT':
                await this.prisma.parent.create({
                    data: {
                        userId: user.id,
                        occupation: data.occupation,
                        relationship: data.relationship,
                    },
                });
                break;
        }
    }

    // ========================================
    // LOGIN
    // ========================================

    async login(data: LoginDto, jwtSign: (payload: TokenPayload) => string): Promise<AuthResult> {
        // Find user with password
        const user = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await argon2.verify(user.password, data.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Check if account is active
        if (user.status === UserStatus.SUSPENDED) {
            throw new Error('Account is suspended');
        }

        if (user.status === UserStatus.PENDING_VERIFICATION) {
            throw new Error('Please verify your email before logging in');
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user, jwtSign);

        // Store refresh token
        await this.storeRefreshToken(user.id, tokens.refreshToken);

        // Return user without sensitive data
        const { password, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            tokens,
        };
    }

    // ========================================
    // TOKEN MANAGEMENT
    // ========================================

    private async generateTokens(user: any, jwtSign: (payload: TokenPayload) => string): Promise<Tokens> {
        const payload: TokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = jwtSign(payload);
        const refreshToken = crypto.randomBytes(64).toString('hex');

        return {
            accessToken,
            refreshToken,
        };
    }

    private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt,
            },
        });
    }

    async refreshTokens(refreshToken: string, jwtSign: (payload: TokenPayload) => string): Promise<Tokens> {
        // Find refresh token
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!storedToken) {
            throw new Error('Invalid refresh token');
        }

        if (storedToken.expiresAt < new Date()) {
            // Clean up expired token
            await this.prisma.refreshToken.delete({
                where: { token: refreshToken },
            });
            throw new Error('Refresh token expired');
        }

        // Generate new tokens
        const tokens = await this.generateTokens(storedToken.user, jwtSign);

        // Delete old refresh token and store new one
        await this.prisma.refreshToken.delete({
            where: { token: refreshToken },
        });

        await this.storeRefreshToken(storedToken.userId, tokens.refreshToken);

        return tokens;
    }

    // ========================================
    // LOGOUT
    // ========================================

    async logout(userId: string, refreshToken?: string): Promise<void> {
        // Delete refresh token if provided
        if (refreshToken) {
            await this.prisma.refreshToken.deleteMany({
                where: {
                    token: refreshToken,
                    userId,
                },
            });
        }

        // Delete all refresh tokens for user (optional - for "logout all devices")
        // await this.prisma.refreshToken.deleteMany({
        //     where: { userId },
        // });
    }

    // ========================================
    // PASSWORD RESET
    // ========================================

    async forgotPassword(email: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal if email exists
            return;
        }

        const resetToken = nanoid(32);
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // Send password reset email
        try {
            const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
            await emailService.sendPasswordResetEmail({
                email: user.email,
                resetToken,
                resetUrl,
            });
        } catch (error: any) {
            console.error('Failed to send password reset email:', error.message);
            throw new Error('Failed to send password reset email. Please try again later.');
        }
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            throw new Error('Invalid or expired reset token');
        }

        const hashedPassword = await argon2.hash(newPassword);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        // Invalidate all refresh tokens
        await this.prisma.refreshToken.deleteMany({
            where: { userId: user.id },
        });
    }

    // ========================================
    // EMAIL VERIFICATION
    // ========================================

    async verifyEmail(token: string): Promise<void> {
        const user = await this.prisma.user.findFirst({
            where: {
                emailVerifyToken: token,
                emailVerifyExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            throw new Error('Invalid or expired verification token');
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerifyToken: null,
                emailVerifyExpiry: null,
                status: UserStatus.ACTIVE,
            },
        });
    }

    // ========================================
    // CURRENT USER
    // ========================================

    async getCurrentUser(userId: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                student: true,
                teacher: true,
                admin: true,
                parent: true,
                gamification: true,
            },
        });

        if (!user) {
            return null;
        }

        // Return user without sensitive data
        const { password, resetToken, resetTokenExpiry, emailVerifyToken, emailVerifyExpiry, ...userWithoutSensitiveData } = user;

        return userWithoutSensitiveData;
    }
}

export default new AuthService();
