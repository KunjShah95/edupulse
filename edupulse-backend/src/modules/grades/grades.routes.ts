import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../../config/database.js';
import { z } from 'zod';
import { GradeType } from '@prisma/client';

// Validation schemas
const createGradeSchema = z.object({
    studentId: z.string().min(1),
    courseId: z.string().min(1),
    type: z.nativeEnum(GradeType),
    title: z.string().min(1).max(100),
    score: z.number().min(0),
    maxScore: z.number().min(1),
    weight: z.number().min(0).max(10).default(1),
    feedback: z.string().optional(),
});

const updateGradeSchema = z.object({
    score: z.number().min(0).optional(),
    maxScore: z.number().min(1).optional(),
    weight: z.number().min(0).max(10).optional(),
    feedback: z.string().optional(),
});

const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    studentId: z.string().optional(),
    courseId: z.string().optional(),
    type: z.nativeEnum(GradeType).optional(),
    sortBy: z.string().default('gradedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Helper function to check grade access
async function checkGradeAccess(userId: string, userRole: string, grade: any): Promise<boolean> {
    // Admins have access to everything
    if (userRole === 'ADMIN') return true;
    
    // Students can only see their own grades
    if (userRole === 'STUDENT') {
        const student = await prisma.student.findUnique({
            where: { userId },
        });
        return student ? student.id === grade.studentId : false;
    }
    
    // Teachers can only see grades for their courses
    if (userRole === 'TEACHER') {
        const teacher = await prisma.teacher.findUnique({
            where: { userId },
        });
        return teacher ? teacher.id === grade.course.teacherId : false;
    }
    
    return false;
}

async function gradeRoutes(app: FastifyInstance): Promise<void> {
    // All routes require authentication
    app.addHook('preHandler', app.authenticate);

    // ========================================
    // LIST GRADES
    // ========================================

    app.get('/', {
        schema: {
            tags: ['Grades'],
            summary: 'List grades',
            description: 'Returns paginated list of grades',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'number', default: 1 },
                    limit: { type: 'number', default: 10 },
                    studentId: { type: 'string' },
                    courseId: { type: 'string' },
                    type: { type: 'string', enum: Object.values(GradeType) },
                    sortBy: { type: 'string', default: 'gradedAt' },
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

        const { page, limit, studentId, courseId, type, sortBy, sortOrder } = query.data;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (studentId) where.studentId = studentId;
        if (courseId) where.courseId = courseId;
        if (type) where.type = type;

        // Students can only see their own grades
        if (request.user.role === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { userId: request.user.id },
            });
            if (student) {
                where.studentId = student.id;
            }
        }

        // Teachers can only see grades for their courses
        if (request.user.role === 'TEACHER') {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: request.user.id },
            });
            if (teacher) {
                const teacherCourses = await prisma.course.findMany({
                    where: { teacherId: teacher.id },
                    select: { id: true },
                });
                const courseIds = teacherCourses.map(c => c.id);
                
                if (courseIds.length > 0) {
                    where.courseId = courseIds.length === 1 ? courseIds[0] : undefined;
                }
            }
        }

        const [grades, total] = await Promise.all([
            prisma.grade.findMany({
                where,
                include: {
                    student: {
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
                    course: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            subject: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.grade.count({ where }),
        ]);

        // Additional filtering for teachers with multiple courses
        let filteredGrades = grades;
        if (request.user.role === 'TEACHER') {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: request.user.id },
            });
            if (teacher) {
                const teacherCourses = await prisma.course.findMany({
                    where: { teacherId: teacher.id },
                    select: { id: true },
                });
                const courseIds = teacherCourses.map(c => c.id);
                filteredGrades = grades.filter(g => courseIds.includes(g.courseId));
            }
        }

        return reply.send({
            success: true,
            data: filteredGrades,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    });

    // ========================================
    // GET GRADE BY ID
    // ========================================

    app.get<{ Params: { id: string } }>('/:id', {
        schema: {
            tags: ['Grades'],
            summary: 'Get grade by ID',
            description: 'Returns grade details by ID',
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

        const grade = await prisma.grade.findUnique({
            where: { id },
            include: {
                student: {
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
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        subject: true,
                    },
                },
            },
        });

        if (!grade) {
            return reply.status(404).send({
                success: false,
                error: 'Grade not found',
            });
        }

        // Check access permissions
        const hasAccess = await checkGradeAccess(request.user.id, request.user.role, grade);
        if (!hasAccess) {
            return reply.status(403).send({
                success: false,
                error: 'Access denied',
            });
        }

        return reply.send({
            success: true,
            data: grade,
        });
    });

    // ========================================
    // CREATE GRADE
    // ========================================

    app.post<{ Body: z.infer<typeof createGradeSchema> }>('/', {
        schema: {
            tags: ['Grades'],
            summary: 'Create new grade',
            description: 'Creates a new grade (teachers and admins only)',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['studentId', 'courseId', 'type', 'title', 'score', 'maxScore'],
                properties: {
                    studentId: { type: 'string' },
                    courseId: { type: 'string' },
                    type: { type: 'string', enum: Object.values(GradeType) },
                    title: { type: 'string' },
                    score: { type: 'number' },
                    maxScore: { type: 'number' },
                    weight: { type: 'number' },
                    feedback: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: z.infer<typeof createGradeSchema> }>, reply: FastifyReply) => {
        // Only teachers and admins can create grades
        if (!['ADMIN', 'TEACHER'].includes(request.user.role)) {
            return reply.status(403).send({
                success: false,
                error: 'Access denied',
            });
        }

        const validation = createGradeSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const { studentId, courseId, type, title, score, maxScore, weight, feedback } = validation.data;

        // Verify course and teacher ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { teacher: true },
        });

        if (!course) {
            return reply.status(404).send({
                success: false,
                error: 'Course not found',
            });
        }

        // Check if teacher owns the course
        if (request.user.role === 'TEACHER') {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: request.user.id },
            });
            if (!teacher || teacher.id !== course.teacherId) {
                return reply.status(403).send({
                    success: false,
                    error: 'You can only grade assignments for your own courses',
                });
            }
        }

        // Verify student exists
        const student = await prisma.student.findUnique({
            where: { id: studentId },
        });

        if (!student) {
            return reply.status(404).send({
                success: false,
                error: 'Student not found',
            });
        }

        // Calculate percentage
        const percentage = (score / maxScore) * 100;

        const grade = await prisma.grade.create({
            data: {
                studentId,
                courseId,
                type,
                title,
                score,
                maxScore,
                percentage,
                weight: weight || 1,
                feedback,
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
            message: 'Grade created successfully',
            data: grade,
        });
    });

    // ========================================
    // GET STUDENT GRADES
    // ========================================

    app.get<{ Params: { studentId: string } }>('/student/:studentId', {
        schema: {
            tags: ['Grades'],
            summary: 'Get student grades',
            description: 'Returns all grades for a specific student',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    studentId: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { studentId: string } }>, reply: FastifyReply) => {
        const { studentId } = request.params;

        // Students can only view their own grades
        if (request.user.role === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { userId: request.user.id },
            });
            if (!student || student.id !== studentId) {
                return reply.status(403).send({
                    success: false,
                    error: 'Access denied',
                });
            }
        }

        const grades = await prisma.grade.findMany({
            where: { studentId },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        subject: true,
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
}

export default gradeRoutes;
