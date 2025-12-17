import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../../config/database.js';
import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

// Validation schemas
const createAttendanceSchema = z.object({
    studentId: z.string().min(1),
    courseId: z.string().min(1),
    date: z.string().datetime(),
    status: z.nativeEnum(AttendanceStatus),
    remarks: z.string().optional(),
});

const updateAttendanceSchema = z.object({
    status: z.nativeEnum(AttendanceStatus).optional(),
    remarks: z.string().optional(),
});

const bulkAttendanceSchema = z.object({
    date: z.string().datetime(),
    courseId: z.string().min(1),
    records: z.array(z.object({
        studentId: z.string().min(1),
        status: z.nativeEnum(AttendanceStatus),
        remarks: z.string().optional(),
    })),
});

const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    studentId: z.string().optional(),
    courseId: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    status: z.nativeEnum(AttendanceStatus).optional(),
    sortBy: z.string().default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Helper function to check attendance access
async function checkAttendanceAccess(userId: string, userRole: string, attendance: any): Promise<boolean> {
    // Admins have access to everything
    if (userRole === 'ADMIN') return true;
    
    // Students can only see their own attendance
    if (userRole === 'STUDENT') {
        const student = await prisma.student.findUnique({
            where: { userId },
        });
        return !!(student && student.id === attendance.studentId);
    }
    
    // Teachers can only see attendance for their courses
    if (userRole === 'TEACHER') {
        const teacher = await prisma.teacher.findUnique({
            where: { userId },
        });
        return !!(teacher && teacher.id === attendance.course.teacherId);
    }
    
    return false;
}

async function attendanceRoutes(app: FastifyInstance): Promise<void> {
    // All routes require authentication
    app.addHook('preHandler', app.authenticate);

    // ========================================
    // LIST ATTENDANCE RECORDS
    // ========================================

    app.get('/', {
        schema: {
            tags: ['Attendance'],
            summary: 'List attendance records',
            description: 'Returns paginated list of attendance records',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'number', default: 1 },
                    limit: { type: 'number', default: 10 },
                    studentId: { type: 'string' },
                    courseId: { type: 'string' },
                    dateFrom: { type: 'string', format: 'date-time' },
                    dateTo: { type: 'string', format: 'date-time' },
                    status: { type: 'string', enum: Object.values(AttendanceStatus) },
                    sortBy: { type: 'string', default: 'date' },
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

        const { page, limit, studentId, courseId, dateFrom, dateTo, status, sortBy, sortOrder } = query.data;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (studentId) where.studentId = studentId;
        if (courseId) where.courseId = courseId;
        if (status) where.status = status;
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date.gte = new Date(dateFrom);
            if (dateTo) where.date.lte = new Date(dateTo);
        }

        // Students can only see their own attendance
        if (request.user.role === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { userId: request.user.id },
            });
            if (student) {
                where.studentId = student.id;
            }
        }

        // Teachers can only see attendance for their courses
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

        const [attendance, total] = await Promise.all([
            prisma.attendance.findMany({
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
            prisma.attendance.count({ where }),
        ]);

        // Additional filtering for teachers with multiple courses
        let filteredAttendance = attendance;
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
                filteredAttendance = attendance.filter(a => courseIds.includes(a.courseId));
            }
        }

        return reply.send({
            success: true,
            data: filteredAttendance,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    });

    // ========================================
    // CREATE ATTENDANCE RECORD
    // ========================================

    app.post<{ Body: z.infer<typeof createAttendanceSchema> }>('/', {
        schema: {
            tags: ['Attendance'],
            summary: 'Create attendance record',
            description: 'Creates a new attendance record (teachers and admins only)',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['studentId', 'courseId', 'date', 'status'],
                properties: {
                    studentId: { type: 'string' },
                    courseId: { type: 'string' },
                    date: { type: 'string', format: 'date-time' },
                    status: { type: 'string', enum: Object.values(AttendanceStatus) },
                    remarks: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: z.infer<typeof createAttendanceSchema> }>, reply: FastifyReply) => {
        // Only teachers and admins can create attendance records
        if (!['ADMIN', 'TEACHER'].includes(request.user.role)) {
            return reply.status(403).send({
                success: false,
                error: 'Access denied',
            });
        }

        const validation = createAttendanceSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const { studentId, courseId, date, status, remarks } = validation.data;

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
                    error: 'You can only mark attendance for your own courses',
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

        const attendance = await prisma.attendance.create({
            data: {
                studentId,
                courseId,
                date: new Date(date),
                status,
                remarks,
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
            message: 'Attendance record created successfully',
            data: attendance,
        });
    });

    // ========================================
    // BULK CREATE ATTENDANCE RECORDS
    // ========================================

    app.post<{ Body: z.infer<typeof bulkAttendanceSchema> }>('/bulk', {
        schema: {
            tags: ['Attendance'],
            summary: 'Create bulk attendance records',
            description: 'Creates multiple attendance records for a course and date (teachers and admins only)',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['date', 'courseId', 'records'],
                properties: {
                    date: { type: 'string', format: 'date-time' },
                    courseId: { type: 'string' },
                    records: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['studentId', 'status'],
                            properties: {
                                studentId: { type: 'string' },
                                status: { type: 'string', enum: Object.values(AttendanceStatus) },
                                remarks: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: z.infer<typeof bulkAttendanceSchema> }>, reply: FastifyReply) => {
        // Only teachers and admins can create bulk attendance records
        if (!['ADMIN', 'TEACHER'].includes(request.user.role)) {
            return reply.status(403).send({
                success: false,
                error: 'Access denied',
            });
        }

        const validation = bulkAttendanceSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const { date, courseId, records } = validation.data;

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
                    error: 'You can only mark attendance for your own courses',
                });
            }
        }

        // Verify all students exist
        const studentIds = records.map(r => r.studentId);
        const students = await prisma.student.findMany({
            where: { id: { in: studentIds } },
        });

        if (students.length !== studentIds.length) {
            return reply.status(404).send({
                success: false,
                error: 'One or more students not found',
            });
        }

        // Create attendance records in a transaction
        const attendanceRecords = await prisma.$transaction(
            records.map(record => 
                prisma.attendance.upsert({
                    where: {
                        studentId_courseId_date: {
                            studentId: record.studentId,
                            courseId,
                            date: new Date(date),
                        },
                    },
                    update: {
                        status: record.status,
                        remarks: record.remarks,
                    },
                    create: {
                        studentId: record.studentId,
                        courseId,
                        date: new Date(date),
                        status: record.status,
                        remarks: record.remarks,
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
                    },
                })
            )
        );

        return reply.status(201).send({
            success: true,
            message: `${attendanceRecords.length} attendance records created/updated successfully`,
            data: attendanceRecords,
        });
    });

    // ========================================
    // GET STUDENT ATTENDANCE
    // ========================================

    app.get<{ Params: { studentId: string } }>('/student/:studentId', {
        schema: {
            tags: ['Attendance'],
            summary: 'Get student attendance',
            description: 'Returns all attendance records for a specific student',
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

        // Students can only view their own attendance
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

        const attendance = await prisma.attendance.findMany({
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
            orderBy: { date: 'desc' },
        });

        // Calculate statistics
        const total = attendance.length;
        const present = attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
        const absent = attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
        const late = attendance.filter(a => a.status === AttendanceStatus.LATE).length;
        const excused = attendance.filter(a => a.status === AttendanceStatus.EXCUSED).length;

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
    // GET COURSE ATTENDANCE
    // ========================================

    app.get<{ Params: { courseId: string } }>('/course/:courseId', {
        schema: {
            tags: ['Attendance'],
            summary: 'Get course attendance',
            description: 'Returns all attendance records for a specific course',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    courseId: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) => {
        const { courseId } = request.params;

        // Teachers can only see attendance for their courses
        if (request.user.role === 'TEACHER') {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: request.user.id },
            });
            const course = await prisma.course.findUnique({
                where: { id: courseId },
            });
            
            if (!course || !teacher || course.teacherId !== teacher.id) {
                return reply.status(403).send({
                    success: false,
                    error: 'Access denied',
                });
            }
        }

        const attendance = await prisma.attendance.findMany({
            where: { courseId },
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
            },
            orderBy: [{ date: 'desc' }, { student: { user: { firstName: 'asc' } } }],
        });

        return reply.send({
            success: true,
            data: attendance,
        });
    });
}

export default attendanceRoutes;
