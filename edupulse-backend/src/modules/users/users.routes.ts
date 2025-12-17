import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../../config/database.js';
import { z } from 'zod';

// Validation schemas
const updateUserSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    address: z.string().optional(),
});

const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    role: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'PARENT']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

async function userRoutes(app: FastifyInstance): Promise<void> {
    // All user routes require authentication
    app.addHook('preHandler', app.authenticate);

    // ========================================
    // LIST USERS (Admin only)
    // ========================================

    app.get('/', {
        schema: {
            tags: ['Users'],
            summary: 'List all users',
            description: 'Returns paginated list of users (admin only)',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'number', default: 1 },
                    limit: { type: 'number', default: 10 },
                    search: { type: 'string' },
                    role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'ADMIN', 'PARENT'] },
                    status: { type: 'string' },
                    sortBy: { type: 'string', default: 'createdAt' },
                    sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'array' },
                        pagination: { type: 'object' },
                    },
                },
            },
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Check if user is admin
        if (request.user.role !== 'ADMIN') {
            return reply.status(403).send({
                success: false,
                error: 'Access denied. Admin only.',
            });
        }

        const query = paginationSchema.safeParse(request.query);
        if (!query.success) {
            return reply.status(400).send({
                success: false,
                error: 'Invalid query parameters',
                details: query.error.errors,
            });
        }

        const { page, limit, search, role, status, sortBy, sortOrder } = query.data;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: {
            OR?: Array<{ firstName?: { contains: string; mode: 'insensitive' }; lastName?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' } }>;
            role?: typeof role;
            status?: typeof status;
        } = {};

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) where.role = role;
        if (status) where.status = status;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    avatar: true,
                    phone: true,
                    emailVerified: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.user.count({ where }),
        ]);

        return reply.send({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    });

    // ========================================
    // GET USER BY ID
    // ========================================

    app.get<{ Params: { id: string } }>('/:id', {
        schema: {
            tags: ['Users'],
            summary: 'Get user by ID',
            description: 'Returns user details by ID',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
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
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        // Users can only view their own profile unless admin
        if (request.user.id !== id && request.user.role !== 'ADMIN') {
            return reply.status(403).send({
                success: false,
                error: 'Access denied',
            });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                avatar: true,
                phone: true,
                dateOfBirth: true,
                gender: true,
                address: true,
                emailVerified: true,
                createdAt: true,
                lastLoginAt: true,
                gamification: {
                    select: {
                        points: true,
                        xp: true,
                        level: true,
                        streak: true,
                        longestStreak: true,
                    },
                },
                student: true,
                teacher: true,
                admin: true,
                parent: true,
            },
        });

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

    // ========================================
    // UPDATE USER
    // ========================================

    app.put<{ Params: { id: string }; Body: z.infer<typeof updateUserSchema> }>('/:id', {
        schema: {
            tags: ['Users'],
            summary: 'Update user',
            description: 'Updates user profile',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
            body: {
                type: 'object',
                properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' },
                    dateOfBirth: { type: 'string', format: 'date-time' },
                    gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] },
                    address: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' },
                    },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updateUserSchema> }>, reply: FastifyReply) => {
        const { id } = request.params;

        // Users can only update their own profile unless admin
        if (request.user.id !== id && request.user.role !== 'ADMIN') {
            return reply.status(403).send({
                success: false,
                error: 'Access denied',
            });
        }

        const validation = updateUserSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...validation.data,
                dateOfBirth: validation.data.dateOfBirth
                    ? new Date(validation.data.dateOfBirth)
                    : undefined,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                dateOfBirth: true,
                gender: true,
                address: true,
                avatar: true,
            },
        });

        return reply.send({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    });

    // ========================================
    // DELETE USER (Admin only)
    // ========================================

    app.delete<{ Params: { id: string } }>('/:id', {
        schema: {
            tags: ['Users'],
            summary: 'Delete user',
            description: 'Deletes a user account (admin only)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
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
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        if (request.user.role !== 'ADMIN') {
            return reply.status(403).send({
                success: false,
                error: 'Access denied. Admin only.',
            });
        }

        const { id } = request.params;

        // Prevent admin from deleting themselves
        if (request.user.id === id) {
            return reply.status(400).send({
                success: false,
                error: 'Cannot delete your own account',
            });
        }

        await prisma.user.delete({
            where: { id },
        });

        return reply.send({
            success: true,
            message: 'User deleted successfully',
        });
    });

    // ========================================
    // GET USER PROFILE (with role-specific data)
    // ========================================

    app.get<{ Params: { id: string } }>('/:id/profile', {
        schema: {
            tags: ['Users'],
            summary: 'Get user profile',
            description: 'Returns detailed user profile with role-specific data',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
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
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                gamification: {
                    include: {
                        badges: true,
                        achievements: true,
                    },
                },
                student: {
                    include: {
                        enrollments: {
                            include: {
                                course: {
                                    select: {
                                        id: true,
                                        name: true,
                                        subject: true,
                                    },
                                },
                            },
                        },
                    },
                },
                teacher: {
                    include: {
                        courses: {
                            select: {
                                id: true,
                                name: true,
                                subject: true,
                                gradeLevel: true,
                            },
                        },
                    },
                },
                admin: true,
                parent: {
                    include: {
                        children: {
                            include: {
                                student: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                lastName: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return reply.status(404).send({
                success: false,
                error: 'User not found',
            });
        }

        // Remove sensitive data
        const { password: _, resetToken: __, resetTokenExpiry: ___, emailVerifyToken: ____, emailVerifyExpiry: _____, ...safeUser } = user;

        return reply.send({
            success: true,
            data: safeUser,
        });
    });
}

export default userRoutes;
