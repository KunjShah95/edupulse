import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../../config/database.js';
import { z } from 'zod';

// Validation schemas
const createCourseSchema = z.object({
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    subject: z.string().min(1).max(50),
    gradeLevel: z.string().min(1).max(20),
    credits: z.number().int().min(1).max(10).default(1),
    teacherId: z.string().min(1),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

const updateCourseSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    subject: z.string().min(1).max(50).optional(),
    gradeLevel: z.string().min(1).max(20).optional(),
    credits: z.number().int().min(1).max(10).optional(),
    teacherId: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

const enrollmentSchema = z.object({
    studentId: z.string().min(1),
});

const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    subject: z.string().optional(),
    gradeLevel: z.string().optional(),
    teacherId: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

async function courseRoutes(app: FastifyInstance): Promise<void> {
    // All routes require authentication
    app.addHook('preHandler', app.authenticate);

    // ========================================
    // LIST COURSES
    // ========================================

    app.get('/', {
        schema: {
            tags: ['Courses'],
            summary: 'List all courses',
            description: 'Returns paginated list of courses',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'number', default: 1 },
                    limit: { type: 'number', default: 10 },
                    search: { type: 'string' },
                    subject: { type: 'string' },
                    gradeLevel: { type: 'string' },
                    teacherId: { type: 'string' },
                    isActive: { type: 'boolean' },
                    sortBy: { type: 'string', default: 'createdAt' },
                    sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
                },
            },
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const query = paginationSchema.safeParse(request.query);
        if (!query.success) {
            return reply.status(400).send({
                success: false,
                error: 'Invalid query parameters',
                details: query.error.errors,
            });
        }

        const { page, limit, search, subject, gradeLevel, teacherId, isActive, sortBy, sortOrder } = query.data;
        const skip = (page - 1) * limit;

        // Build where clause
        interface WhereClause {
            OR?: Array<{
                name?: { contains: string; mode: 'insensitive' };
                code?: { contains: string; mode: 'insensitive' };
                description?: { contains: string; mode: 'insensitive' };
            }>;
            subject?: string;
            gradeLevel?: string;
            teacherId?: string;
            isActive?: boolean;
        }
        const where: WhereClause = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (subject) where.subject = subject;
        if (gradeLevel) where.gradeLevel = gradeLevel;
        if (teacherId) where.teacherId = teacherId;
        if (isActive !== undefined) where.isActive = isActive;

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                include: {
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            lessons: true,
                            quizzes: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.course.count({ where }),
        ]);

        return reply.send({
            success: true,
            data: courses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    });

    // ========================================
    // GET COURSE BY ID
    // ========================================

    app.get<{ Params: { id: string } }>('/:id', {
        schema: {
            tags: ['Courses'],
            summary: 'Get course by ID',
            description: 'Returns course details by ID',
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

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                },
                enrollments: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        avatar: true,
                                    },
                                },
                            },
                        },
                    },
                },
                lessons: {
                    orderBy: { order: 'asc' },
                },
                schedules: {
                    where: { isActive: true },
                },
                _count: {
                    select: {
                        enrollments: true,
                        lessons: true,
                        quizzes: true,
                    },
                },
            },
        });

        if (!course) {
            return reply.status(404).send({
                success: false,
                error: 'Course not found',
            });
        }

        return reply.send({
            success: true,
            data: course,
        });
    });

    // ========================================
    // CREATE COURSE
    // ========================================

    app.post<{ Body: z.infer<typeof createCourseSchema> }>('/', {
        schema: {
            tags: ['Courses'],
            summary: 'Create new course',
            description: 'Creates a new course (admin and teachers)',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['code', 'name', 'subject', 'gradeLevel', 'teacherId'],
                properties: {
                    code: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    subject: { type: 'string' },
                    gradeLevel: { type: 'string' },
                    credits: { type: 'number' },
                    teacherId: { type: 'string' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: z.infer<typeof createCourseSchema> }>, reply: FastifyReply) => {
        // Only admins and teachers can create courses
        if (!['ADMIN', 'TEACHER'].includes(request.user.role)) {
            return reply.status(403).send({
                success: false,
                error: 'Access denied',
            });
        }

        const validation = createCourseSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const { code, name, description, subject, gradeLevel, credits, teacherId, startDate, endDate } = validation.data;

        // Check if course code already exists
        const existingCourse = await prisma.course.findUnique({
            where: { code },
        });

        if (existingCourse) {
            return reply.status(400).send({
                success: false,
                error: 'Course code already exists',
            });
        }

        // Verify teacher exists
        const teacher = await prisma.teacher.findUnique({
            where: { id: teacherId },
        });

        if (!teacher) {
            return reply.status(400).send({
                success: false,
                error: 'Teacher not found',
            });
        }

        // Check if user is authorized to create course for this teacher
        if (request.user.role === 'TEACHER') {
            const currentTeacher = await prisma.teacher.findUnique({
                where: { userId: request.user.id },
            });
            if (!currentTeacher || currentTeacher.id !== teacherId) {
                return reply.status(403).send({
                    success: false,
                    error: 'You can only create courses for yourself',
                });
            }
        }

        const course = await prisma.course.create({
            data: {
                code: code.toUpperCase(),
                name,
                description,
                subject,
                gradeLevel,
                credits,
                teacherId,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
            },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        return reply.status(201).send({
            success: true,
            message: 'Course created successfully',
            data: course,
        });
    });

    // ========================================
    // ENROLL STUDENT IN COURSE
    // ========================================

    app.post<{ Params: { id: string }; Body: z.infer<typeof enrollmentSchema> }>('/:id/enroll', {
        schema: {
            tags: ['Courses'],
            summary: 'Enroll student in course',
            description: 'Enrolls a student in a course',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
            body: {
                type: 'object',
                required: ['studentId'],
                properties: {
                    studentId: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof enrollmentSchema> }>, reply: FastifyReply) => {
        const { id: courseId } = request.params;
        const { studentId } = request.body;

        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return reply.status(404).send({
                success: false,
                error: 'Course not found',
            });
        }

        // Check if student exists
        const student = await prisma.student.findUnique({
            where: { id: studentId },
        });

        if (!student) {
            return reply.status(404).send({
                success: false,
                error: 'Student not found',
            });
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId,
                    courseId,
                },
            },
        });

        if (existingEnrollment) {
            return reply.status(400).send({
                success: false,
                error: 'Student is already enrolled in this course',
            });
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                studentId,
                courseId,
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                course: {
                    select: {
                        name: true,
                        code: true,
                        subject: true,
                    },
                },
            },
        });

        return reply.status(201).send({
            success: true,
            message: 'Student enrolled successfully',
            data: enrollment,
        });
    });
}

export default courseRoutes;
