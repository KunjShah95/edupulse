import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import authService from './auth.service.js';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    verifyEmailSchema,
    refreshTokenSchema,
    type RegisterDto,
    type LoginDto,
    type ForgotPasswordDto,
    type ResetPasswordDto,
    type VerifyEmailDto,
    type RefreshTokenDto,
} from './auth.dto.js';

async function authRoutes(app: FastifyInstance): Promise<void> {
    // ========================================
    // REGISTER
    // ========================================

    app.post<{ Body: RegisterDto }>('/register', {
        schema: {
            tags: ['Auth'],
            summary: 'Register a new user',
            description: 'Creates a new user account with role-specific profile',
            body: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName', 'role'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    firstName: { type: 'string', minLength: 1 },
                    lastName: { type: 'string', minLength: 1 },
                    role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'ADMIN', 'PARENT'] },
                    phone: { type: 'string' },
                    gradeLevel: { type: 'string' },
                    section: { type: 'string' },
                    rollNumber: { type: 'string' },
                    department: { type: 'string' },
                    subjects: { type: 'array', items: { type: 'string' } },
                    employeeId: { type: 'string' },
                    adminCode: { type: 'string' },
                },
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                user: { type: 'object' },
                                accessToken: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: RegisterDto }>, reply: FastifyReply) => {
        // Validate input
        const validation = registerSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        try {
            const result = await authService.register(
                validation.data,
                app.jwt.sign.bind(app.jwt) as any
            );

            // Set refresh token as httpOnly cookie
            reply.setCookie('refreshToken', result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/api/v1/auth',
                maxAge: 7 * 24 * 60 * 60, // 7 days
            });

            return reply.status(201).send({
                success: true,
                message: 'Registration successful! Please check your email to verify your account.',
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Registration failed';
            return reply.status(400).send({
                success: false,
                error: message,
            });
        }
    });

    // ========================================
    // LOGIN
    // ========================================

    app.post<{ Body: LoginDto }>('/login', {
        schema: {
            tags: ['Auth'],
            summary: 'Login user',
            description: 'Authenticates user and returns access token',
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                user: { type: 'object' },
                                accessToken: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: LoginDto }>, reply: FastifyReply) => {
        const validation = loginSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        try {
            const result = await authService.login(
                validation.data,
                app.jwt.sign.bind(app.jwt) as any
            );

            // Set refresh token as httpOnly cookie
            reply.setCookie('refreshToken', result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/api/v1/auth',
                maxAge: 7 * 24 * 60 * 60, // 7 days
            });

            return reply.send({
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Login failed';
            return reply.status(401).send({
                success: false,
                error: message,
            });
        }
    });

    // ========================================
    // LOGOUT
    // ========================================

    app.post('/logout', {
        schema: {
            tags: ['Auth'],
            summary: 'Logout user',
            description: 'Invalidates refresh token and clears cookie',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        preHandler: [app.authenticate],
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const refreshToken = request.cookies.refreshToken;

        await authService.logout(request.user.id, refreshToken);

        // Clear the refresh token cookie
        reply.clearCookie('refreshToken', {
            path: '/api/v1/auth',
        });

        return reply.send({
            success: true,
            message: 'Logged out successfully',
        });
    });

    // ========================================
    // REFRESH TOKEN
    // ========================================

    app.post<{ Body: RefreshTokenDto }>('/refresh', {
        schema: {
            tags: ['Auth'],
            summary: 'Refresh access token',
            description: 'Uses refresh token to get new access token',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                accessToken: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: RefreshTokenDto }>, reply: FastifyReply) => {
        // Try to get refresh token from cookie first, then from body
        const refreshToken = request.cookies.refreshToken || request.body?.refreshToken;

        if (!refreshToken) {
            return reply.status(401).send({
                success: false,
                error: 'Refresh token required',
            });
        }

        try {
            const tokens = await authService.refreshTokens(
                refreshToken,
                app.jwt.sign.bind(app.jwt) as any
            );

            // Set new refresh token as httpOnly cookie
            reply.setCookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/api/v1/auth',
                maxAge: 7 * 24 * 60 * 60,
            });

            return reply.send({
                success: true,
                data: {
                    accessToken: tokens.accessToken,
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Token refresh failed';
            return reply.status(401).send({
                success: false,
                error: message,
            });
        }
    });

    // ========================================
    // FORGOT PASSWORD
    // ========================================

    app.post<{ Body: ForgotPasswordDto }>('/forgot-password', {
        schema: {
            tags: ['Auth'],
            summary: 'Request password reset',
            description: 'Sends password reset email to user',
            body: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: { type: 'string', format: 'email' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: ForgotPasswordDto }>, reply: FastifyReply) => {
        const validation = forgotPasswordSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        await authService.forgotPassword(validation.data.email);

        // Always return success to prevent email enumeration
        return reply.send({
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link.',
        });
    });

    // ========================================
    // RESET PASSWORD
    // ========================================

    app.post<{ Body: ResetPasswordDto }>('/reset-password', {
        schema: {
            tags: ['Auth'],
            summary: 'Reset password',
            description: 'Resets password using reset token',
            body: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                    token: { type: 'string' },
                    password: { type: 'string', minLength: 8 },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: ResetPasswordDto }>, reply: FastifyReply) => {
        const validation = resetPasswordSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        try {
            await authService.resetPassword(validation.data.token, validation.data.password);

            return reply.send({
                success: true,
                message: 'Password reset successful. You can now login with your new password.',
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Password reset failed';
            return reply.status(400).send({
                success: false,
                error: message,
            });
        }
    });

    // ========================================
    // VERIFY EMAIL
    // ========================================

    app.post<{ Body: VerifyEmailDto }>('/verify-email', {
        schema: {
            tags: ['Auth'],
            summary: 'Verify email',
            description: 'Verifies email using verification token',
            body: {
                type: 'object',
                required: ['token'],
                properties: {
                    token: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: VerifyEmailDto }>, reply: FastifyReply) => {
        const validation = verifyEmailSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        try {
            await authService.verifyEmail(validation.data.token);

            return reply.send({
                success: true,
                message: 'Email verified successfully. Your account is now active.',
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Email verification failed';
            return reply.status(400).send({
                success: false,
                error: message,
            });
        }
    });

    // ========================================
    // GET CURRENT USER
    // ========================================

    app.get('/me', {
        schema: {
            tags: ['Auth'],
            summary: 'Get current user',
            description: 'Returns the authenticated user\'s profile',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                    },
                },
            },
        },
        preHandler: [app.authenticate],
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const user = await authService.getCurrentUser(request.user.id);

        if (!user) {
            return reply.status(404).send({
                success: false,
                error: 'User not found',
            });
        }

        return reply.send({
            success: true,
            data: user,
        });
    });
}

export default authRoutes;
