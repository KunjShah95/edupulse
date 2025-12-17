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
export interface CreateLessonDto {
    courseId: string;
    title: string;
    description?: string;
    content?: string;
    order: number;
    duration?: number;
    videoUrl?: string;
    attachments?: string[];
    isPublished?: boolean;
}

export interface UpdateLessonDto {
    title?: string;
    description?: string;
    content?: string;
    order?: number;
    duration?: number;
    videoUrl?: string;
    attachments?: string[];
    isPublished?: boolean;
}

export interface LessonQueryOptions extends PaginationOptions {
    courseId?: string;
    isPublished?: boolean;
    search?: string;
}

// Service class
export class LessonsService {
    /**
     * Create a new lesson
     */
    async create(createLessonDto: CreateLessonDto): Promise<any> {
        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: createLessonDto.courseId },
            select: { id: true, name: true, code: true }
        });

        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Check if lesson order already exists for this course
        const existingLesson = await prisma.lesson.findFirst({
            where: {
                courseId: createLessonDto.courseId,
                order: createLessonDto.order
            }
        });

        if (existingLesson) {
            throw new ConflictError('A lesson with this order already exists in the course');
        }

        try {
            const lesson = await prisma.lesson.create({
                data: {
                    ...createLessonDto,
                    isPublished: createLessonDto.isPublished || false,
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
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
                },
            });

            return lesson;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Lesson already exists');
            }
            throw error;
        }
    }

    /**
     * Get all lessons with pagination and filtering
     */
    async findAll(options: LessonQueryOptions = {}): Promise<PaginationResult<any>> {
        const { page, limit, sortBy, sortOrder } = sanitizePaginationOptions(options);
        const { courseId, isPublished, search } = options;

        // Build search and filter conditions
        const where = createSearchWhereClause({
            search,
            searchFields: ['title', 'description'],
            filters: {
                ...(courseId && { courseId }),
                ...(isPublished !== undefined && { isPublished }),
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.lesson.count({ where });

        // Get lessons with pagination
        const lessons = await prisma.lesson.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
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
            },
        });

        return formatPaginationResult(lessons, totalItems, options);
    }

    /**
     * Get lesson by ID
     */
    async findById(id: string): Promise<any> {
        const lesson = await prisma.lesson.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        subject: true,
                        teacher: {
                            select: {
                                id: true,
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

        if (!lesson) {
            throw new NotFoundError('Lesson not found');
        }

        return lesson;
    }

    /**
     * Get lessons by course ID
     */
    async findByCourseId(courseId: string, options: LessonQueryOptions = {}): Promise<PaginationResult<any>> {
        const { page, limit, sortBy = 'order', sortOrder = 'asc' } = sanitizePaginationOptions(options);
        const { isPublished } = options;

        const where: any = { courseId };
        if (isPublished !== undefined) {
            where.isPublished = isPublished;
        }

        const totalItems = await prisma.lesson.count({ where });

        const lessons = await prisma.lesson.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
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
        });

        return formatPaginationResult(lessons, totalItems, options);
    }

    /**
     * Update lesson
     */
    async update(id: string, updateLessonDto: UpdateLessonDto): Promise<any> {
        // Check if lesson exists
        await this.findById(id);

        // If order is being updated, check for conflicts
        if (updateLessonDto.order) {
            const lesson = await prisma.lesson.findUnique({
                where: { id },
                select: { courseId: true }
            });

            if (lesson) {
                const existingLesson = await prisma.lesson.findFirst({
                    where: {
                        courseId: lesson.courseId,
                        order: updateLessonDto.order,
                        NOT: { id },
                    },
                });

                if (existingLesson) {
                    throw new ConflictError('A lesson with this order already exists in the course');
                }
            }
        }

        try {
            const lesson = await prisma.lesson.update({
                where: { id },
                data: updateLessonDto,
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
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
                },
            });

            return lesson;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Lesson with this order already exists');
            }
            throw error;
        }
    }

    /**
     * Delete lesson
     */
    async delete(id: string): Promise<void> {
        // Check if lesson exists
        await this.findById(id);

        await prisma.lesson.delete({
            where: { id },
        });
    }

    /**
     * Publish/Unpublish lesson
     */
    async togglePublish(id: string): Promise<any> {
        const lesson = await this.findById(id);

        const updatedLesson = await prisma.lesson.update({
            where: { id },
            data: {
                isPublished: !lesson.isPublished,
            },
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
        });

        return updatedLesson;
    }

    /**
     * Reorder lessons in a course
     */
    async reorderLessons(courseId: string, lessonOrders: { id: string; order: number }[]): Promise<any> {
        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true }
        });

        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Validate that all lessons belong to the course
        const lessonIds = lessonOrders.map(item => item.id);
        const existingLessons = await prisma.lesson.findMany({
            where: {
                id: { in: lessonIds },
                courseId,
            },
            select: { id: true }
        });

        if (existingLessons.length !== lessonIds.length) {
            throw new BadRequestError('Some lessons do not belong to this course');
        }

        // Update lesson orders in a transaction
        await prisma.$transaction(
            lessonOrders.map(item =>
                prisma.lesson.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
        );

        return {
            success: true,
            message: 'Lessons reordered successfully',
        };
    }

    /**
     * Get next lesson order for a course
     */
    async getNextOrder(courseId: string): Promise<number> {
        const lastLesson = await prisma.lesson.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        return lastLesson ? lastLesson.order + 1 : 1;
    }

    /**
     * Get lessons statistics
     */
    async getLessonsStatistics(): Promise<any> {
        const [totalLessons, publishedLessons, draftLessons] = await Promise.all([
            prisma.lesson.count(),
            prisma.lesson.count({ where: { isPublished: true } }),
            prisma.lesson.count({ where: { isPublished: false } }),
        ]);

        return {
            totalLessons,
            publishedLessons,
            draftLessons,
        };
    }

    /**
     * Get lessons by teacher
     */
    async findByTeacherId(teacherId: string, options: LessonQueryOptions = {}): Promise<PaginationResult<any>> {
        const { page, limit, sortBy, sortOrder } = sanitizePaginationOptions(options);
        const { search, isPublished } = options;

        const where = createSearchWhereClause({
            search,
            searchFields: ['title', 'description'],
            filters: {
                ...(isPublished !== undefined && { isPublished }),
                course: {
                    teacherId,
                },
            },
        });

        const totalItems = await prisma.lesson.count({ where });

        const lessons = await prisma.lesson.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
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
            },
        });

        return formatPaginationResult(lessons, totalItems, options);
    }
}

// Export singleton instance
export const lessonsService = new LessonsService();

export default lessonsService;
