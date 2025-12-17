import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../../config/database.js';
import { z } from 'zod';

// Validation schemas
const createStudentSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    phone: z.string().optional(),
    rollNumber: z.string().min(1),
    gradeLevel: z.string().min(1),
    section: z.string().min(1),
    stream: z.string().optional(),
});

const updateStudentSchema = z.object({
    gradeLevel: z.string().optional(),
    section: z.string().optional(),
    stream: z.string().optional(),
});

const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    gradeLevel: z.string().optional(),
    section: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

async function studentRoutes(app: FastifyInstance): Promise<void> {
    // All routes require authentication
    app.addHook('preHandler', app.authenticate);

    // ========================================
    // LIST STUDENTS
    // ========================================

    app.get('/', {
        schema: {
            tags: ['Students'],
            summary: 'List all students',
            description: 'Returns paginated list of students',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'number', default: 1 },
                    limit: { type: 'number', default: 10 },
                    search: { type: 'string' },
                    gradeLevel: { type: 'string' },
                    section: { type: 'string' },
                    sortBy: { type: 'string', default: 'createdAt' },
                    sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
                },
            },
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Only teachers and admins can list all students
        if (!['ADMIN', 'TEACHER'].includes(request.user.role)) {
            return reply.status(403).send({
                success: false,
                error: 'Access denied',
            });
        }

        const query = paginationSchema.safeParse(request.query);
        if (!query.success) {
            return reply.status(400).send({
                success: false,
                error: 'Invalid query parameters',
            });
        }

        const { page, limit, search, gradeLevel, section, sortBy, sortOrder } = query.data;
        const skip = (page - 1) * limit;

        // Build where clause
        interface WhereClause {
            user?: {
                OR: Array<{
                    firstName?: { contains: string; mode: 'insensitive' };
                    lastName?: { contains: string; mode: 'insensitive' };
                    email?: { contains: string; mode: 'insensitive' };
                }>;
            };
            gradeLevel?: string;
            section?: string;
        }
        const where: WhereClause = {};

        if (search) {
            where.user = {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        if (gradeLevel) where.gradeLevel = gradeLevel;
        if (section) where.section = section;

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            phone: true,
                            status: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: sortBy === 'createdAt' ? { createdAt: sortOrder } : { [sortBy]: sortOrder },
            }),
            prisma.student.count({ where }),
        ]);

        // Format response
        const formattedStudents = students.map(student => {
            const { id: _, ...userData } = student.user;
            return {
                id: student.id,
                userId: student.userId,
                rollNumber: student.rollNumber,
                gradeLevel: student.gradeLevel,
                section: student.section,
                stream: student.stream,
                ...userData,
                createdAt: student.createdAt,
            };
        });

        return reply.send({
            success: true,
            data: formattedStudents,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    });

    // ========================================
    // GET STUDENT BY ID
    // ========================================

    app.get<{ Params: { id: string } }>('/:id', {
        schema: {
            tags: ['Students'],
            summary: 'Get student by ID',
            description: 'Returns student details by ID',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        phone: true,
                        dateOfBirth: true,
                        gender: true,
                        address: true,
                        status: true,
                        createdAt: true,
                    },
                },
                enrollments: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                name: true,
                                subject: true,
                                code: true,
                            },
                        },
                    },
                },
            },
        });

        if (!student) {
            return reply.status(404).send({
                success: false,
                error: 'Student not found',
            });
        }

        return reply.send({
            success: true,
            data: student,
        });
    });

    // ========================================
    // CREATE STUDENT
    // ========================================

    app.post<{ Body: z.infer<typeof createStudentSchema> }>('/', {
        schema: {
            tags: ['Students'],
            summary: 'Create new student',
            description: 'Creates a new student account (admin only)',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName', 'rollNumber', 'gradeLevel', 'section'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' },
                    rollNumber: { type: 'string' },
                    gradeLevel: { type: 'string' },
                    section: { type: 'string' },
                    stream: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: z.infer<typeof createStudentSchema> }>, reply: FastifyReply) => {
        if (request.user.role !== 'ADMIN') {
            return reply.status(403).send({
                success: false,
                error: 'Access denied. Admin only.',
            });
        }

        const validation = createStudentSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const { email, password, firstName, lastName, phone, rollNumber, gradeLevel, section, stream } = validation.data;

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return reply.status(400).send({
                success: false,
                error: 'Email already in use',
            });
        }

        // Check if roll number already exists
        const existingRoll = await prisma.student.findUnique({
            where: { rollNumber },
        });

        if (existingRoll) {
            return reply.status(400).send({
                success: false,
                error: 'Roll number already exists',
            });
        }

        // Import argon2 for password hashing
        const argon2 = await import('argon2');
        const hashedPassword = await argon2.hash(password);

        // Create user and student in transaction
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    firstName,
                    lastName,
                    phone,
                    role: 'STUDENT',
                    status: 'ACTIVE',
                    emailVerified: true, // Admin-created accounts are pre-verified
                },
            });

            const student = await tx.student.create({
                data: {
                    userId: user.id,
                    rollNumber,
                    gradeLevel,
                    section,
                    stream,
                },
            });

            // Create gamification profile
            await tx.gamification.create({
                data: {
                    userId: user.id,
                    points: 100,
                    xp: 0,
                    level: 1,
                    xpToNextLevel: 100,
                },
            });

            return { user, student };
        });

        return reply.status(201).send({
            success: true,
            message: 'Student created successfully',
            data: {
                id: result.student.id,
                userId: result.user.id,
                email: result.user.email,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
                rollNumber: result.student.rollNumber,
                gradeLevel: result.student.gradeLevel,
                section: result.student.section,
            },
        });
    });

    // ========================================
    // UPDATE STUDENT
    // ========================================

    app.put<{ Params: { id: string }; Body: z.infer<typeof updateStudentSchema> }>('/:id', {
        schema: {
            tags: ['Students'],
            summary: 'Update student',
            description: 'Updates student information',
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
                    gradeLevel: { type: 'string' },
                    section: { type: 'string' },
                    stream: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updateStudentSchema> }>, reply: FastifyReply) => {
        if (!['ADMIN', 'TEACHER'].includes(request.user.role)) {
            return reply.status(403).send({
                success: false,
                error: 'Access denied',
            });
        }

        const { id } = request.params;
        const validation = updateStudentSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
            });
        }

        const student = await prisma.student.update({
            where: { id },
            data: validation.data,
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return reply.send({
            success: true,
            message: 'Student updated successfully',
            data: student,
        });
    });

    // ========================================
    // DELETE STUDENT
    // ========================================

    app.delete<{ Params: { id: string } }>('/:id', {
        schema: {
            tags: ['Students'],
            summary: 'Delete student',
            description: 'Deletes a student account (admin only)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
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

        const student = await prisma.student.findUnique({
            where: { id },
        });

        if (!student) {
            return reply.status(404).send({
                success: false,
                error: 'Student not found',
            });
        }

        // Delete the user (cascades to student)
        await prisma.user.delete({
            where: { id: student.userId },
        });

        return reply.send({
            success: true,
            message: 'Student deleted successfully',
        });
    });

    // ========================================
    // GET STUDENT GRADES
    // ========================================

    app.get<{ Params: { id: string } }>('/:id/grades', {
        schema: {
            tags: ['Students'],
            summary: 'Get student grades',
            description: 'Returns all grades for a student',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const grades = await prisma.grade.findMany({
            where: { studentId: id },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                        code: true,
                    },
                },
            },
            orderBy: { gradedAt: 'desc' },
        });

        // Calculate overall statistics
        const stats = {
            totalGrades: grades.length,
            averageScore: grades.length > 0
                ? grades.reduce((acc, g) => acc + g.percentage, 0) / grades.length
                : 0,
            highestScore: grades.length > 0
                ? Math.max(...grades.map(g => g.percentage))
                : 0,
            lowestScore: grades.length > 0
                ? Math.min(...grades.map(g => g.percentage))
                : 0,
        };

        return reply.send({
            success: true,
            data: {
                grades,
                stats,
            },
        });
    });

    // ========================================
    // GET STUDENT ATTENDANCE
    // ========================================

    app.get<{ Params: { id: string } }>('/:id/attendance', {
        schema: {
            tags: ['Students'],
            summary: 'Get student attendance',
            description: 'Returns attendance records for a student',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const attendance = await prisma.attendance.findMany({
            where: { studentId: id },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
        });

        // Calculate statistics
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'PRESENT').length;
        const absent = attendance.filter(a => a.status === 'ABSENT').length;
        const late = attendance.filter(a => a.status === 'LATE').length;
        const excused = attendance.filter(a => a.status === 'EXCUSED').length;

        const stats = {
            total,
            present,
            absent,
            late,
            excused,
            attendanceRate: total > 0 ? ((present + late) / total) * 100 : 0,
        };

        return reply.send({
            success: true,
            data: {
                attendance,
                stats,
            },
        });
    });

    // ========================================
    // GET STUDENT GAMIFICATION
    // ========================================

    app.get<{ Params: { id: string } }>('/:id/gamification', {
        schema: {
            tags: ['Students'],
            summary: 'Get student gamification data',
            description: 'Returns XP, level, badges, and achievements for a student',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const student = await prisma.student.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!student) {
            return reply.status(404).send({
                success: false,
                error: 'Student not found',
            });
        }

        const gamification = await prisma.gamification.findUnique({
            where: { userId: student.userId },
            include: {
                badges: {
                    orderBy: { earnedAt: 'desc' },
                },
                achievements: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        return reply.send({
            success: true,
            data: gamification,
        });
    });
}

export default studentRoutes;
