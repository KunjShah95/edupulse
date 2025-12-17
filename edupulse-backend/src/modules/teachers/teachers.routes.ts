import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../../config/database.js';
import { z } from 'zod';

// Validation schemas
const createTeacherSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    phone: z.string().optional(),
    employeeId: z.string().min(1),
    department: z.string().min(1),
    subjects: z.array(z.string()).min(1),
    qualification: z.string().optional(),
});

const updateTeacherSchema = z.object({
    department: z.string().optional(),
    subjects: z.array(z.string()).optional(),
    qualification: z.string().optional(),
});

const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    department: z.string().optional(),
    subject: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

async function teacherRoutes(app: FastifyInstance): Promise<void> {
    // All routes require authentication
    app.addHook('preHandler', app.authenticate);

    // ========================================
    // LIST TEACHERS
    // ========================================

    app.get('/', {
        schema: {
            tags: ['Teachers'],
            summary: 'List all teachers',
            description: 'Returns paginated list of teachers',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'number', default: 1 },
                    limit: { type: 'number', default: 10 },
                    search: { type: 'string' },
                    department: { type: 'string' },
                    subject: { type: 'string' },
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
            });
        }

        const { page, limit, search, department, subject, sortBy, sortOrder } = query.data;
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
            department?: string;
            subjects?: { has: string };
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

        if (department) where.department = department;
        if (subject) where.subjects = { has: subject };

        const [teachers, total] = await Promise.all([
            prisma.teacher.findMany({
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
                    courses: {
                        select: {
                            id: true,
                            name: true,
                            subject: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: sortBy === 'createdAt' ? { createdAt: sortOrder } : { [sortBy]: sortOrder },
            }),
            prisma.teacher.count({ where }),
        ]);

        // Format response
        const formattedTeachers = teachers.map(teacher => {
            const { id: _, ...userData } = teacher.user;
            return {
                id: teacher.id,
                userId: teacher.userId,
                employeeId: teacher.employeeId,
                department: teacher.department,
                subjects: teacher.subjects,
                qualification: teacher.qualification,
                coursesCount: teacher.courses.length,
                ...userData,
                createdAt: teacher.createdAt,
            };
        });

        return reply.send({
            success: true,
            data: formattedTeachers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    });

    // ========================================
    // GET TEACHER BY ID
    // ========================================

    app.get<{ Params: { id: string } }>('/:id', {
        schema: {
            tags: ['Teachers'],
            summary: 'Get teacher by ID',
            description: 'Returns teacher details by ID',
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

        const teacher = await prisma.teacher.findUnique({
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
                courses: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                        code: true,
                        gradeLevel: true,
                        isActive: true,
                    },
                },
            },
        });

        if (!teacher) {
            return reply.status(404).send({
                success: false,
                error: 'Teacher not found',
            });
        }

        return reply.send({
            success: true,
            data: teacher,
        });
    });

    // ========================================
    // CREATE TEACHER
    // ========================================

    app.post<{ Body: z.infer<typeof createTeacherSchema> }>('/', {
        schema: {
            tags: ['Teachers'],
            summary: 'Create new teacher',
            description: 'Creates a new teacher account (admin only)',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName', 'employeeId', 'department', 'subjects'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' },
                    employeeId: { type: 'string' },
                    department: { type: 'string' },
                    subjects: { type: 'array', items: { type: 'string' } },
                    qualification: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: z.infer<typeof createTeacherSchema> }>, reply: FastifyReply) => {
        if (request.user.role !== 'ADMIN') {
            return reply.status(403).send({
                success: false,
                error: 'Access denied. Admin only.',
            });
        }

        const validation = createTeacherSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const { email, password, firstName, lastName, phone, employeeId, department, subjects, qualification } = validation.data;

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

        // Check if employee ID already exists
        const existingEmployee = await prisma.teacher.findUnique({
            where: { employeeId },
        });

        if (existingEmployee) {
            return reply.status(400).send({
                success: false,
                error: 'Employee ID already exists',
            });
        }

        // Import argon2 for password hashing
        const argon2 = await import('argon2');
        const hashedPassword = await argon2.hash(password);

        // Create user and teacher in transaction
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    firstName,
                    lastName,
                    phone,
                    role: 'TEACHER',
                    status: 'ACTIVE',
                    emailVerified: true, // Admin-created accounts are pre-verified
                },
            });

            const teacher = await tx.teacher.create({
                data: {
                    userId: user.id,
                    employeeId,
                    department,
                    subjects,
                    qualification,
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

            return { user, teacher };
        });

        return reply.status(201).send({
            success: true,
            message: 'Teacher created successfully',
            data: {
                id: result.teacher.id,
                userId: result.user.id,
                email: result.user.email,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
                employeeId: result.teacher.employeeId,
                department: result.teacher.department,
                subjects: result.teacher.subjects,
            },
        });
    });

    // ========================================
    // UPDATE TEACHER
    // ========================================

    app.put<{ Params: { id: string }; Body: z.infer<typeof updateTeacherSchema> }>('/:id', {
        schema: {
            tags: ['Teachers'],
            summary: 'Update teacher',
            description: 'Updates teacher information',
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
                    department: { type: 'string' },
                    subjects: { type: 'array', items: { type: 'string' } },
                    qualification: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updateTeacherSchema> }>, reply: FastifyReply) => {
        if (request.user.role !== 'ADMIN') {
            return reply.status(403).send({
                success: false,
                error: 'Access denied. Admin only.',
            });
        }

        const { id } = request.params;
        const validation = updateTeacherSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
            });
        }

        const teacher = await prisma.teacher.update({
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
            message: 'Teacher updated successfully',
            data: teacher,
        });
    });

    // ========================================
    // DELETE TEACHER
    // ========================================

    app.delete<{ Params: { id: string } }>('/:id', {
        schema: {
            tags: ['Teachers'],
            summary: 'Delete teacher',
            description: 'Deletes a teacher account (admin only)',
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

        const teacher = await prisma.teacher.findUnique({
            where: { id },
        });

        if (!teacher) {
            return reply.status(404).send({
                success: false,
                error: 'Teacher not found',
            });
        }

        // Delete the user (cascades to teacher)
        await prisma.user.delete({
            where: { id: teacher.userId },
        });

        return reply.send({
            success: true,
            message: 'Teacher deleted successfully',
        });
    });

    // ========================================
    // GET TEACHER COURSES
    // ========================================

    app.get<{ Params: { id: string } }>('/:id/courses', {
        schema: {
            tags: ['Teachers'],
            summary: 'Get teacher courses',
            description: 'Returns all courses taught by a teacher',
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

        const courses = await prisma.course.findMany({
            where: { teacherId: id },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        lessons: true,
                        quizzes: true,
                    },
                },
                schedules: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return reply.send({
            success: true,
            data: courses,
        });
    });

    // ========================================
    // GET TEACHER SCHEDULE
    // ========================================

    app.get<{ Params: { id: string } }>('/:id/schedule', {
        schema: {
            tags: ['Teachers'],
            summary: 'Get teacher schedule',
            description: 'Returns weekly schedule for a teacher',
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

        const courses = await prisma.course.findMany({
            where: { teacherId: id },
            include: {
                schedules: {
                    where: { isActive: true },
                },
            },
        });

        // Organize by day of week
        const weeklySchedule: Record<number, Array<{
            courseId: string;
            courseName: string;
            subject: string;
            startTime: string;
            endTime: string;
            room: string | null;
        }>> = {
            0: [], // Sunday
            1: [], // Monday
            2: [], // Tuesday
            3: [], // Wednesday
            4: [], // Thursday
            5: [], // Friday
            6: [], // Saturday
        };

        for (const course of courses) {
            for (const schedule of course.schedules) {
                weeklySchedule[schedule.dayOfWeek].push({
                    courseId: course.id,
                    courseName: course.name,
                    subject: course.subject,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    room: schedule.room,
                });
            }
        }

        // Sort each day by start time
        for (const day of Object.keys(weeklySchedule)) {
            weeklySchedule[parseInt(day)].sort((a, b) =>
                a.startTime.localeCompare(b.startTime)
            );
        }

        return reply.send({
            success: true,
            data: weeklySchedule,
        });
    });

    // ========================================
    // GET TEACHER STUDENTS
    // ========================================

    app.get<{ Params: { id: string } }>('/:id/students', {
        schema: {
            tags: ['Teachers'],
            summary: 'Get teacher students',
            description: 'Returns all students enrolled in teacher\'s courses',
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

        // Get all courses by this teacher
        const courses = await prisma.course.findMany({
            where: { teacherId: id },
            select: { id: true },
        });

        const courseIds = courses.map(c => c.id);

        // Get all students enrolled in these courses
        const enrollments = await prisma.enrollment.findMany({
            where: {
                courseId: { in: courseIds },
            },
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
                course: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                    },
                },
            },
            distinct: ['studentId'],
        });

        // Group by student
        const studentsMap = new Map<string, {
            student: typeof enrollments[0]['student'];
            user: typeof enrollments[0]['student']['user'];
            courses: typeof enrollments[0]['course'][];
        }>();

        for (const enrollment of enrollments) {
            const existing = studentsMap.get(enrollment.studentId);
            if (existing) {
                existing.courses.push(enrollment.course);
            } else {
                studentsMap.set(enrollment.studentId, {
                    student: enrollment.student,
                    user: enrollment.student.user,
                    courses: [enrollment.course],
                });
            }
        }

        const students = Array.from(studentsMap.values()).map(({ student, user, courses }) => {
            const { id: _, ...userData } = user;
            return {
                id: student.id,
                userId: student.userId,
                rollNumber: student.rollNumber,
                gradeLevel: student.gradeLevel,
                section: student.section,
                ...userData,
                enrolledCourses: courses,
            };
        });

        return reply.send({
            success: true,
            data: students,
            total: students.length,
        });
    });
}

export default teacherRoutes;
