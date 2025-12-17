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
export interface CreateStudentDto {
    userId: string;
    rollNumber: string;
    gradeLevel: string;
    section: string;
    stream?: string;
    admissionDate?: Date;
}

export interface UpdateStudentDto {
    rollNumber?: string;
    gradeLevel?: string;
    section?: string;
    stream?: string;
}

export interface StudentQueryOptions extends PaginationOptions {
    search?: string;
    gradeLevel?: string;
    section?: string;
    stream?: string;
}

// Service class
export class StudentsService {
    /**
     * Create a new student profile
     */
    async create(createStudentDto: CreateStudentDto): Promise<any> {
        // Check if user exists and is a student
        const user = await prisma.user.findUnique({
            where: { id: createStudentDto.userId },
            select: { id: true, role: true, firstName: true, lastName: true }
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.role !== 'STUDENT') {
            throw new BadRequestError('User must have STUDENT role');
        }

        // Check if roll number already exists
        const existingStudent = await prisma.student.findUnique({
            where: { rollNumber: createStudentDto.rollNumber }
        });

        if (existingStudent) {
            throw new ConflictError('Student with this roll number already exists');
        }

        try {
            const student = await prisma.student.create({
                data: {
                    ...createStudentDto,
                    admissionDate: createStudentDto.admissionDate || new Date(),
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

            return student;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Student profile already exists for this user');
            }
            throw error;
        }
    }

    /**
     * Get all students with pagination and filtering
     */
    async findAll(options: StudentQueryOptions = {}): Promise<PaginationResult<any>> {
        const { page, limit, sortBy, sortOrder } = sanitizePaginationOptions(options);
        const { search, gradeLevel, section, stream } = options;

        // Build search and filter conditions
        const where = createSearchWhereClause({
            search,
            searchFields: ['user.firstName', 'user.lastName', 'rollNumber'],
            filters: {
                ...(gradeLevel && { gradeLevel }),
                ...(section && { section }),
                ...(stream && { stream }),
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.student.count({ where });

        // Get students with pagination
        const students = await prisma.student.findMany({
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
                enrollments: {
                    select: {
                        id: true,
                        course: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                                subject: true,
                                teacher: {
                                    select: {
                                        user: {
                                            select: {
                                                firstName: true,
                                                lastName: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        enrolledAt: true,
                        completedAt: true,
                        progress: true,
                    },
                },
            },
        });

        return formatPaginationResult(students, totalItems, options);
    }

    /**
     * Get student by ID
     */
    async findById(id: string): Promise<any> {
        const student = await prisma.student.findUnique({
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
                enrollments: {
                    include: {
                        course: {
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
                        },
                    },
                },
                attendance: {
                    include: {
                        course: {
                            select: {
                                name: true,
                                code: true,
                            },
                        },
                    },
                    orderBy: {
                        date: 'desc',
                    },
                },
                grades: {
                    include: {
                        course: {
                            select: {
                                name: true,
                                code: true,
                            },
                        },
                    },
                    orderBy: {
                        gradedAt: 'desc',
                    },
                },
                bookLoans: {
                    where: {
                        status: 'ACTIVE',
                    },
                    include: {
                        book: {
                            select: {
                                title: true,
                                author: true,
                                isbn: true,
                            },
                        },
                    },
                },
                parentLinks: {
                    include: {
                        parent: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        phone: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!student) {
            throw new NotFoundError('Student not found');
        }

        return student;
    }

    /**
     * Get student by roll number
     */
    async findByRollNumber(rollNumber: string): Promise<any> {
        const student = await prisma.student.findUnique({
            where: { rollNumber },
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

        if (!student) {
            throw new NotFoundError('Student not found');
        }

        return student;
    }

    /**
     * Update student
     */
    async update(id: string, updateStudentDto: UpdateStudentDto): Promise<any> {
        // Check if student exists
        await this.findById(id);

        // If rollNumber is being updated, check for conflicts
        if (updateStudentDto.rollNumber) {
            const existingStudent = await prisma.student.findFirst({
                where: {
                    rollNumber: updateStudentDto.rollNumber,
                    NOT: { id },
                },
            });

            if (existingStudent) {
                throw new ConflictError('Another student with this roll number already exists');
            }
        }

        try {
            const student = await prisma.student.update({
                where: { id },
                data: updateStudentDto,
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

            return student;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Roll number already exists');
            }
            throw error;
        }
    }

    /**
     * Delete student
     */
    async delete(id: string): Promise<void> {
        // Check if student exists
        await this.findById(id);

        await prisma.student.delete({
            where: { id },
        });
    }

    /**
     * Enroll student in course
     */
    async enrollInCourse(studentId: string, courseId: string): Promise<any> {
        // Check if student exists
        const student = await this.findById(studentId);

        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teacher: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Check if enrollment already exists
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId,
                    courseId,
                },
            },
        });

        if (existingEnrollment) {
            throw new ConflictError('Student is already enrolled in this course');
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                studentId,
                courseId,
            },
            include: {
                course: {
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
                },
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
        });

        return enrollment;
    }

    /**
     * Get students statistics
     */
    async getStudentsStatistics(): Promise<any> {
        const [totalStudents, activeStudents, studentsByGrade] = await Promise.all([
            prisma.student.count(),
            prisma.student.count({
                where: {
                    user: {
                        status: 'ACTIVE',
                    },
                },
            }),
            prisma.student.groupBy({
                by: ['gradeLevel'],
                _count: {
                    id: true,
                },
            }),
        ]);

        const gradeDistribution = studentsByGrade.map(item => ({
            gradeLevel: item.gradeLevel,
            count: item._count.id,
        }));

        return {
            totalStudents,
            activeStudents,
            gradeDistribution,
        };
    }
}

// Export singleton instance
export const studentsService = new StudentsService();

export default studentsService;
