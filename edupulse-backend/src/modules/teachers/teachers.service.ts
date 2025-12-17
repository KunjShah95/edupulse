import { PrismaClient } from '@prisma/client';
import { 
    PaginationOptions, 
    PaginationResult, 
    sanitizePaginationOptions,
    formatPaginationResult,
    createSearchWhereClause
} from '../../utils/pagination.util.js';
import { 
    NotFoundError, 
    ConflictError, 
    BadRequestError,
    ValidationError 
} from '../../utils/error.util.js';

const prisma = new PrismaClient();

// DTOs
export interface CreateTeacherDto {
    userId: string;
    employeeId: string;
    department: string;
    subjects: string[];
    qualification?: string;
    joinDate?: Date;
}

export interface UpdateTeacherDto {
    employeeId?: string;
    department?: string;
    subjects?: string[];
    qualification?: string;
}

export interface TeacherQueryOptions extends PaginationOptions {
    search?: string;
    department?: string;
    subject?: string;
}

// Service class
export class TeachersService {
    /**
     * Create a new teacher profile
     */
    async create(createTeacherDto: CreateTeacherDto): Promise<any> {
        // Check if user exists and is a teacher
        const user = await prisma.user.findUnique({
            where: { id: createTeacherDto.userId },
            select: { id: true, role: true, firstName: true, lastName: true }
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.role !== 'TEACHER') {
            throw new BadRequestError('User must have TEACHER role');
        }

        // Check if employee ID already exists
        const existingTeacher = await prisma.teacher.findUnique({
            where: { employeeId: createTeacherDto.employeeId }
        });

        if (existingTeacher) {
            throw new ConflictError('Teacher with this employee ID already exists');
        }

        try {
            const teacher = await prisma.teacher.create({
                data: {
                    ...createTeacherDto,
                    joinDate: createTeacherDto.joinDate || new Date(),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            avatar: true,
                            phone: true,
                            dateOfBirth: true,
                            gender: true,
                            address: true,
                        },
                    },
                },
            });

            return teacher;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Teacher profile already exists for this user');
            }
            throw error;
        }
    }

    /**
     * Get all teachers with pagination and filtering
     */
    async findAll(options: TeacherQueryOptions = {}): Promise<PaginationResult<any>> {
        const { page, limit, sortBy, sortOrder } = sanitizePaginationOptions(options);
        const { search, department, subject } = options;

        // Build search and filter conditions
        const where = createSearchWhereClause({
            search,
            searchFields: ['user.firstName', 'user.lastName', 'employeeId'],
            filters: {
                ...(department && { department }),
                ...(subject && { 
                    subjects: {
                        has: subject
                    }
                }),
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.teacher.count({ where });

        // Get teachers with pagination
        const teachers = await prisma.teacher.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
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
                        code: true,
                        name: true,
                        subject: true,
                        gradeLevel: true,
                        isActive: true,
                        enrollments: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });

        return formatPaginationResult(teachers, totalItems, options);
    }

    /**
     * Get teacher by ID
     */
    async findById(id: string): Promise<any> {
        const teacher = await prisma.teacher.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        avatar: true,
                        phone: true,
                        dateOfBirth: true,
                        gender: true,
                        address: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                courses: {
                    include: {
                        enrollments: {
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
                        },
                        schedules: {
                            select: {
                                id: true,
                                dayOfWeek: true,
                                startTime: true,
                                endTime: true,
                                room: true,
                                isActive: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        courses: true,
                    },
                },
            },
        });

        if (!teacher) {
            throw new NotFoundError('Teacher not found');
        }

        return teacher;
    }

    /**
     * Get teacher by employee ID
     */
    async findByEmployeeId(employeeId: string): Promise<any> {
        const teacher = await prisma.teacher.findUnique({
            where: { employeeId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        status: true,
                    },
                },
            },
        });

        if (!teacher) {
            throw new NotFoundError('Teacher not found');
        }

        return teacher;
    }

    /**
     * Update teacher
     */
    async update(id: string, updateTeacherDto: UpdateTeacherDto): Promise<any> {
        // Check if teacher exists
        await this.findById(id);

        // If employeeId is being updated, check for conflicts
        if (updateTeacherDto.employeeId) {
            const existingTeacher = await prisma.teacher.findFirst({
                where: {
                    employeeId: updateTeacherDto.employeeId,
                    NOT: { id },
                },
            });

            if (existingTeacher) {
                throw new ConflictError('Another teacher with this employee ID already exists');
            }
        }

        try {
            const teacher = await prisma.teacher.update({
                where: { id },
                data: updateTeacherDto,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            avatar: true,
                            phone: true,
                            dateOfBirth: true,
                            gender: true,
                            address: true,
                            status: true,
                        },
                    },
                },
            });

            return teacher;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Employee ID already exists');
            }
            throw error;
        }
    }

    /**
     * Delete teacher
     */
    async delete(id: string): Promise<void> {
        // Check if teacher exists
        await this.findById(id);

        await prisma.teacher.delete({
            where: { id },
        });
    }

    /**
     * Get teachers by department
     */
    async findByDepartment(department: string, options: TeacherQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, department });
    }

    /**
     * Get teachers by subject
     */
    async findBySubject(subject: string, options: TeacherQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, subject });
    }

    /**
     * Create course for teacher
     */
    async createCourse(teacherId: string, courseData: any): Promise<any> {
        // Check if teacher exists
        const teacher = await this.findById(teacherId);

        // Check if course code already exists
        const existingCourse = await prisma.course.findUnique({
            where: { code: courseData.code }
        });

        if (existingCourse) {
            throw new ConflictError('Course with this code already exists');
        }

        const course = await prisma.course.create({
            data: {
                ...courseData,
                teacherId,
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
                enrollments: {
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
                },
            },
        });

        return course;
    }

    /**
     * Get teacher's courses
     */
    async getCourses(teacherId: string, options: any = {}): Promise<PaginationResult<any>> {
        // Check if teacher exists
        await this.findById(teacherId);

        const { page = 1, limit = 10, search } = options;

        const where: any = { teacherId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
            ];
        }

        const totalItems = await prisma.course.count({ where });

        const courses = await prisma.course.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                enrollments: {
                    select: {
                        id: true,
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
                },
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
        });

        return formatPaginationResult(courses, totalItems, options);
    }

    /**
     * Get teacher's students
     */
    async getStudents(teacherId: string, courseId?: string, options: any = {}): Promise<PaginationResult<any>> {
        // Check if teacher exists
        await this.findById(teacherId);

        const { page = 1, limit = 10, search } = options;

        const where: any = {
            enrollments: {
                some: {
                    course: {
                        teacherId,
                        ...(courseId && { id: courseId }),
                    },
                },
            },
        };

        if (search) {
            where.OR = [
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName: { contains: search, mode: 'insensitive' } } },
                { rollNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        const totalItems = await prisma.student.count({ where });

        const students = await prisma.student.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
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
                enrollments: {
                    where: {
                        course: {
                            teacherId,
                        },
                    },
                    include: {
                        course: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
            },
        });

        return formatPaginationResult(students, totalItems, options);
    }

    /**
     * Mark attendance for students
     */
    async markAttendance(teacherId: string, courseId: string, attendanceData: any[]): Promise<any> {
        // Check if teacher exists and owns the course
        const teacher = await this.findById(teacherId);
        
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                teacherId,
            },
        });

        if (!course) {
            throw new NotFoundError('Course not found or you do not have permission to mark attendance');
        }

        // Create attendance records
        const attendanceRecords = await Promise.all(
            attendanceData.map(async (record) => {
                return prisma.attendance.upsert({
                    where: {
                        studentId_courseId_date: {
                            studentId: record.studentId,
                            courseId,
                            date: new Date(record.date),
                        },
                    },
                    update: {
                        status: record.status,
                        remarks: record.remarks,
                    },
                    create: {
                        studentId: record.studentId,
                        courseId,
                        date: new Date(record.date),
                        status: record.status,
                        remarks: record.remarks,
                    },
                });
            })
        );

        return {
            success: true,
            message: 'Attendance marked successfully',
            data: attendanceRecords,
        };
    }

    /**
     * Add grade for student
     */
    async addGrade(teacherId: string, gradeData: any): Promise<any> {
        // Check if teacher exists and owns the course
        const teacher = await this.findById(teacherId);
        
        const course = await prisma.course.findFirst({
            where: {
                id: gradeData.courseId,
                teacherId,
            },
        });

        if (!course) {
            throw new NotFoundError('Course not found or you do not have permission to add grades');
        }

        // Check if student is enrolled in the course
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: gradeData.studentId,
                    courseId: gradeData.courseId,
                },
            },
        });

        if (!enrollment) {
            throw new BadRequestError('Student is not enrolled in this course');
        }

        // Calculate percentage
        const percentage = (gradeData.score / gradeData.maxScore) * 100;

        const grade = await prisma.grade.create({
            data: {
                ...gradeData,
                percentage,
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
                    },
                },
            },
        });

        return grade;
    }

    /**
     * Get teachers statistics
     */
    async getTeachersStatistics(): Promise<any> {
        const [totalTeachers, activeTeachers, teachersByDepartment] = await Promise.all([
            prisma.teacher.count(),
            prisma.teacher.count({
                where: {
                    user: {
                        status: 'ACTIVE',
                    },
                },
            }),
            prisma.teacher.groupBy({
                by: ['department'],
                _count: {
                    id: true,
                },
            }),
        ]);

        const departmentDistribution = teachersByDepartment.map(item => ({
            department: item.department,
            count: item._count.id,
        }));

        // Get total courses taught
        const totalCourses = await prisma.course.count({
            where: {
                teacher: {
                    user: {
                        status: 'ACTIVE',
                    },
                },
            },
        });

        return {
            totalTeachers,
            activeTeachers,
            departmentDistribution,
            totalCourses,
        };
    }
}

// Export singleton instance
export const teachersService = new TeachersService();

export default teachersService;
