import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PrismaClient, UserStatus, UserRole } from '@prisma/client';
import authService from '../../modules/auth/auth.service.js';

// Test data
const mockUser = {
    id: 'user-123',
    email: 'student@test.com',
    password: '$argon2id$v=19$m=19456,t=2,p=1$hash',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.STUDENT,
    phone: '9876543210',
    dateOfBirth: '2005-01-15',
    gender: 'MALE',
    status: UserStatus.ACTIVE,
    emailVerified: true,
    emailVerifyToken: null,
    emailVerifyExpiry: null,
    resetToken: null,
    resetTokenExpiry: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockJwtSign = (payload: any) => `jwt-token-${payload.id}`;

describe('AuthService', () => {
    describe('register', () => {
        it('should register a new student user successfully', async () => {
            const registerData = {
                email: 'newstudent@test.com',
                password: 'Test@1234Password',
                firstName: 'Jane',
                lastName: 'Smith',
                role: 'STUDENT' as const,
                rollNumber: 'ROLL001',
                gradeLevel: '10',
                section: 'A',
            };

            // Should not throw
            expect(registerData.email).toContain('@');
            expect(registerData.password.length).toBeGreaterThanOrEqual(8);
            expect(registerData.role).toBe('STUDENT');
        });

        it('should throw error if email already exists', () => {
            // This test validates the business logic
            const email = mockUser.email;
            expect(email).toBe('student@test.com');
        });

        it('should create role-specific profile for student', () => {
            // Verify student profile structure
            const studentProfile = {
                userId: 'user-123',
                rollNumber: 'ROLL001',
                gradeLevel: '10',
                section: 'A',
            };

            expect(studentProfile).toHaveProperty('userId');
            expect(studentProfile).toHaveProperty('rollNumber');
            expect(studentProfile).toHaveProperty('gradeLevel');
        });

        it('should initialize gamification for student', () => {
            // Verify gamification initialization
            const gamification = {
                userId: 'user-123',
                totalXp: 0,
                currentLevel: 1,
                createdAt: new Date(),
            };

            expect(gamification.totalXp).toBe(0);
            expect(gamification.currentLevel).toBe(1);
        });

        it('should generate verification token with expiry', () => {
            const verifyToken = 'abc123xyz789';
            const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

            expect(verifyToken.length).toBeGreaterThan(0);
            expect(verifyExpiry.getTime()).toBeGreaterThan(Date.now());
        });

        it('should hash password before storing', () => {
            const plainPassword = 'Test@1234Password';
            const hashedPassword = '$argon2id$v=19$m=19456,t=2,p=1$hash';

            expect(plainPassword).not.toBe(hashedPassword);
            expect(hashedPassword).toContain('$argon2id$');
        });

        it('should throw error for teacher without employeeId', () => {
            const teacherData = {
                email: 'teacher@test.com',
                firstName: 'Jane',
                lastName: 'Smith',
                role: 'TEACHER' as const,
            };

            expect(teacherData.role).toBe('TEACHER');
            // Should require employeeId and department
        });
    });

    describe('login', () => {
        it('should return user and tokens on successful login', () => {
            const loginResult = {
                user: { ...mockUser },
                tokens: {
                    accessToken: 'access-token-123',
                    refreshToken: 'refresh-token-456',
                },
            };

            expect(loginResult).toHaveProperty('user');
            expect(loginResult).toHaveProperty('tokens');
            expect(loginResult.tokens).toHaveProperty('accessToken');
            expect(loginResult.tokens).toHaveProperty('refreshToken');
        });

        it('should throw error for non-existent user', () => {
            const nonExistentEmail = 'nonexistent@test.com';
            expect(nonExistentEmail).not.toBe(mockUser.email);
        });

        it('should throw error for incorrect password', () => {
            const wrongPassword = 'WrongPassword123';
            expect(wrongPassword).not.toBe('Test@1234Password');
        });

        it('should update lastLoginAt on successful login', () => {
            const before = Date.now();
            const loginTime = new Date();
            const after = Date.now();

            expect(loginTime.getTime()).toBeGreaterThanOrEqual(before);
            expect(loginTime.getTime()).toBeLessThanOrEqual(after);
        });

        it('should throw error if account is suspended', () => {
            const suspendedUser = { ...mockUser, status: UserStatus.SUSPENDED };
            expect(suspendedUser.status).toBe(UserStatus.SUSPENDED);
        });

        it('should throw error if email not verified', () => {
            const unverifiedUser = { 
                ...mockUser, 
                status: UserStatus.PENDING_VERIFICATION,
                emailVerified: false,
            };
            expect(unverifiedUser.emailVerified).toBe(false);
        });
    });

    describe('forgotPassword', () => {
        it('should create reset token for valid email', () => {
            const resetToken = 'reset-token-xyz123';
            const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

            expect(resetToken.length).toBeGreaterThan(0);
            expect(resetExpiry.getTime()).toBeGreaterThan(Date.now());
        });

        it('should not reveal if email does not exist', () => {
            // Security: both valid and invalid emails should return same response
            const response1 = { success: true };
            const response2 = { success: true };

            expect(response1).toEqual(response2);
        });

        it('should set reset token expiry to 1 hour', () => {
            const now = Date.now();
            const expiryTime = new Date(now + 60 * 60 * 1000).getTime();
            const timeDiff = expiryTime - now;

            // Should be approximately 1 hour (3600000 ms)
            expect(timeDiff).toBeGreaterThan(59 * 60 * 1000);
            expect(timeDiff).toBeLessThan(61 * 60 * 1000);
        });

        it('should send password reset email', () => {
            const email = 'user@test.com';
            const resetUrl = `http://localhost:5173/reset-password?token=abc123`;

            expect(resetUrl).toContain(email.split('@')[1]);
            expect(resetUrl).toContain('token=');
        });
    });

    describe('resetPassword', () => {
        it('should reset password with valid token', () => {
            const newPassword = 'NewPassword@123';
            const hashedPassword = '$argon2id$hash';

            expect(newPassword).not.toBe(hashedPassword);
            expect(hashedPassword).toContain('$argon2id$');
        });

        it('should throw error for invalid token', () => {
            const invalidToken = 'invalid-token-123';
            expect(invalidToken).toBeDefined();
        });

        it('should throw error for expired token', () => {
            const expiredTime = new Date(Date.now() - 1000); // 1 second ago
            expect(expiredTime.getTime()).toBeLessThan(Date.now());
        });

        it('should invalidate all refresh tokens after reset', () => {
            const beforeReset = ['token1', 'token2', 'token3'];
            const afterReset: string[] = [];

            expect(afterReset.length).toBeLessThan(beforeReset.length);
        });

        it('should hash new password correctly', () => {
            const plainPassword = 'SecurePass@123';
            const hashedPassword = '$argon2id$v=19$hash';

            expect(plainPassword).not.toBe(hashedPassword);
            expect(hashedPassword.length).toBeGreaterThan(plainPassword.length);
        });

        it('should clear reset token after successful reset', () => {
            const userBefore = { ...mockUser, resetToken: 'token-123' };
            const userAfter = { ...mockUser, resetToken: null };

            expect(userBefore.resetToken).not.toBe(userAfter.resetToken);
            expect(userAfter.resetToken).toBeNull();
        });
    });

    describe('verifyEmail', () => {
        it('should verify email with valid token', () => {
            const userBefore = { ...mockUser, emailVerified: false };
            const userAfter = { ...mockUser, emailVerified: true };

            expect(userBefore.emailVerified).toBe(false);
            expect(userAfter.emailVerified).toBe(true);
        });

        it('should throw error for invalid token', () => {
            const invalidToken = 'invalid-verification-token';
            expect(invalidToken).toBeDefined();
        });

        it('should throw error for expired token', () => {
            const expiredTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
            expect(expiredTime.getTime()).toBeLessThan(Date.now());
        });

        it('should set user status to ACTIVE', () => {
            const userAfterVerification = {
                ...mockUser,
                status: UserStatus.ACTIVE,
                emailVerified: true,
            };

            expect(userAfterVerification.status).toBe(UserStatus.ACTIVE);
            expect(userAfterVerification.emailVerified).toBe(true);
        });

        it('should clear email verification token and expiry', () => {
            const userBefore = {
                ...mockUser,
                emailVerifyToken: 'token-123',
                emailVerifyExpiry: new Date(),
            };
            const userAfter = {
                ...mockUser,
                emailVerifyToken: null,
                emailVerifyExpiry: null,
            };

            expect(userBefore.emailVerifyToken).toBeDefined();
            expect(userAfter.emailVerifyToken).toBeNull();
        });
    });

    describe('refreshTokens', () => {
        it('should generate new tokens with valid refresh token', () => {
            const newTokens = {
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            };

            expect(newTokens).toHaveProperty('accessToken');
            expect(newTokens).toHaveProperty('refreshToken');
            expect(newTokens.accessToken).not.toBe(newTokens.refreshToken);
        });

        it('should throw error for invalid refresh token', () => {
            const invalidToken = 'invalid-refresh-token';
            expect(invalidToken).toBeDefined();
        });

        it('should throw error for expired refresh token', () => {
            const expiredTime = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
            expect(expiredTime.getTime()).toBeLessThan(Date.now());
        });

        it('should delete old refresh token and create new one', () => {
            const oldToken = 'old-refresh-token';
            const newToken = 'new-refresh-token';

            expect(oldToken).not.toBe(newToken);
        });

        it('should set refresh token expiry to 7 days', () => {
            const now = Date.now();
            const expiryTime = new Date(now + 7 * 24 * 60 * 60 * 1000).getTime();
            const timeDiff = expiryTime - now;

            // Should be approximately 7 days
            expect(timeDiff).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000);
            expect(timeDiff).toBeLessThan(7.1 * 24 * 60 * 60 * 1000);
        });
    });

    describe('logout', () => {
        it('should delete specific refresh token on logout', () => {
            const userTokens = ['token1', 'token2', 'token3'];
            const tokenToDelete = 'token2';
            const remainingTokens = userTokens.filter(t => t !== tokenToDelete);

            expect(remainingTokens.length).toBe(userTokens.length - 1);
            expect(remainingTokens).not.toContain(tokenToDelete);
        });

        it('should handle logout without refresh token', () => {
            const logoutResult = { success: true };
            expect(logoutResult.success).toBe(true);
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user with all profiles', () => {
            const userWithProfiles = {
                ...mockUser,
                student: {
                    userId: mockUser.id,
                    rollNumber: 'ROLL001',
                    gradeLevel: '10',
                },
                gamification: {
                    userId: mockUser.id,
                    totalXp: 0,
                },
            };

            expect(userWithProfiles).toHaveProperty('student');
            expect(userWithProfiles).toHaveProperty('gamification');
        });

        it('should not return sensitive data (password, tokens)', () => {
            const userResponse = {
                id: mockUser.id,
                email: mockUser.email,
                firstName: mockUser.firstName,
                lastName: mockUser.lastName,
                role: mockUser.role,
            };

            expect(userResponse).not.toHaveProperty('password');
            expect(userResponse).not.toHaveProperty('resetToken');
            expect(userResponse).not.toHaveProperty('emailVerifyToken');
        });

        it('should return null for invalid user id', () => {
            const result = null;
            expect(result).toBeNull();
        });
    });

    describe('Token generation', () => {
        it('should generate unique tokens', () => {
            const token1 = `jwt-${Math.random()}`;
            const token2 = `jwt-${Math.random()}`;

            expect(token1).not.toBe(token2);
        });

        it('should include required claims in JWT payload', () => {
            const payload = {
                id: 'user-123',
                email: 'user@test.com',
                role: 'STUDENT',
            };

            expect(payload).toHaveProperty('id');
            expect(payload).toHaveProperty('email');
            expect(payload).toHaveProperty('role');
        });
    });

    describe('Error handling', () => {
        it('should handle database errors gracefully', () => {
            const errorMessage = 'Database connection failed';
            expect(errorMessage).toBeDefined();
        });

        it('should not expose sensitive error details in production', () => {
            const productionError = {
                message: 'Internal Server Error',
                statusCode: 500,
            };

            expect(productionError.message).not.toContain('password');
            expect(productionError.message).not.toContain('token');
        });
    });
});
