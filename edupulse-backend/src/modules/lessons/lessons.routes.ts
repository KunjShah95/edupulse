import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
    createLessonSchema, 
    updateLessonSchema, 
    lessonQuerySchema,
    reorderLessonsSchema,
    lessonsListResponseSchema 
} from './lessons.dto.js';
import { lessonsService } from './lessons.service.js';
import { validate } from '../../middleware/validation.middleware.js';
import { requireTeacherOrStudent } from '../../middleware/roles.middleware.js';
import { endpointRateLimit } from '../../middleware/rate-limit.middleware.js';

/**
 * Lessons Routes
 */
export async function lessonsRoutes(app: FastifyInstance): Promise<void> {
    const service = lessonsService;

    // ===============================
    // GET /api/lessons
    // Get all lessons with pagination and filtering
    // ===============================
    app.get(
        '/',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
                querystring: lessonQuerySchema,
                response: {
                    200: lessonsListResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const queryOptions = lessonQuerySchema.parse(request.query);
                const result = await service.findAll(queryOptions);
                
                reply.send({
                    success: true,
                    message: 'Lessons retrieved successfully',
                    data: result.data,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.totalItems,
                        totalPages: result.pagination.totalPages,
                        hasNext: result.pagination.hasNextPage,
                        hasPrev: result.pagination.hasPreviousPage,
                    },
                });
            } catch (error) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: '',
                        code: 'INTERNAL_SERVER_ERROR',                    },
                });
            }
        }
    );

    // ===============================
    // GET /api/lessons/course/:courseId
    // Get lessons by course ID
    // ===============================
    app.get(
        '/course/:courseId',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        courseId: { type: 'string' },
                    },
                    required: ['courseId'],
                },
                querystring: lessonQuerySchema.omit({ courseId: true }),
                response: {
                    200: lessonsListResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { courseId } = request.params as { courseId: string };
                const queryOptions = lessonQuerySchema.omit({ courseId: true }).parse(request.query);
                const result = await service.findByCourseId(courseId, queryOptions);
                
                reply.send({
                    success: true,
                    message: 'Course lessons retrieved successfully',
                    data: result.data,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.totalItems,
                        totalPages: result.pagination.totalPages,
                        hasNext: result.pagination.hasNextPage,
                        hasPrev: result.pagination.hasPreviousPage,
                    },
                });
            } catch (error) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve course lessons',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // ===============================
    // GET /api/lessons/teacher/:teacherId
    // Get lessons by teacher ID
    // ===============================
    app.get(
        '/teacher/:teacherId',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        teacherId: { type: 'string' },
                    },
                    required: ['teacherId'],
                },
                querystring: lessonQuerySchema,
                response: {
                    200: lessonsListResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { teacherId } = request.params as { teacherId: string };
                const queryOptions = lessonQuerySchema.parse(request.query);
                const result = await service.findByTeacherId(teacherId, queryOptions);
                
                reply.send({
                    success: true,
                    message: 'Teacher lessons retrieved successfully',
                    data: result.data,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.totalItems,
                        totalPages: result.pagination.totalPages,
                        hasNext: result.pagination.hasNextPage,
                        hasPrev: result.pagination.hasPreviousPage,
                    },
                });
            } catch (error) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve teacher lessons',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // ===============================
    // GET /api/lessons/:id
    // Get lesson by ID
    // ===============================
    app.get(
        '/:id',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
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
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { id } = request.params as { id: string };
                const lesson = await service.findById(id);
                
                reply.send({
                    success: true,
                    message: 'Lesson retrieved successfully',
                    data: lesson,
                });
            } catch (error: any) {
                if (error?.message && error.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Lesson not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to retrieve lesson',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ===============================
    // POST /api/lessons
    // Create a new lesson
    // ===============================
    app.post(
        '/',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
                validate({ body: createLessonSchema }),
            ],
            schema: {
                body: createLessonSchema,
                response: {
                    201: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
                            data: { type: 'object' },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const lessonData = request.body as any;
                const lesson = await service.create(lessonData);
                
                reply.code(201).send({
                    success: true,
                    message: 'Lesson created successfully',
                    data: lesson,
                });
            } catch (error: any) {
                if (error?.message && error.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Course not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else if (error?.message && error.message.includes('already exists')) {
                    reply.code(409).send({
                        success: false,
                        error: {
                            message: error.message,
                            code: 'CONFLICT',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to create lesson',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ===============================
    // PUT /api/lessons/:id
    // Update lesson
    // ===============================
    app.put(
        '/:id',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
                validate({ body: updateLessonSchema }),
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
                },
                body: updateLessonSchema,
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
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { id } = request.params as { id: string };
                const updateData = request.body as any;
                const lesson = await service.update(id, updateData);
                
                reply.send({
                    success: true,
                    message: 'Lesson updated successfully',
                    data: lesson,
                });
            } catch (error: any) {
                if (error?.message && error.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Lesson not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else if (error?.message && error.message.includes('already exists')) {
                    reply.code(409).send({
                        success: false,
                        error: {
                            message: error.message,
                            code: 'CONFLICT',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to update lesson',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ===============================
    // DELETE /api/lessons/:id
    // Delete lesson
    // ===============================
    app.delete(
        '/:id',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
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
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { id } = request.params as { id: string };
                await service.delete(id);
                
                reply.send({
                    success: true,
                    message: 'Lesson deleted successfully',
                });
            } catch (error: any) {
                if (error?.message && error.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Lesson not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to delete lesson',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ===============================
    // PATCH /api/lessons/:id/publish
    // Toggle lesson publish status
    // ===============================
    app.patch(
        '/:id/publish',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
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
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { id } = request.params as { id: string };
                const lesson = await service.togglePublish(id);
                
                reply.send({
                    success: true,
                    message: `Lesson ${lesson.isPublished ? 'published' : 'unpublished'} successfully`,
                    data: lesson,
                });
            } catch (error: any) {
                if (error?.message && error.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Lesson not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to toggle lesson publish status',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ===============================
    // POST /api/lessons/reorder
    // Reorder lessons in a course
    // ===============================
    app.post(
        '/reorder',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
                validate({ body: reorderLessonsSchema }),
            ],
            schema: {
                body: reorderLessonsSchema,
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
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { lessonOrders } = request.body as any;
                // Extract courseId from first lesson
                const firstLesson = lessonOrders[0];
                const lesson = await service.findById(firstLesson.id);
                
                await service.reorderLessons(lesson.courseId, lessonOrders);
                
                reply.send({
                    success: true,
                    message: 'Lessons reordered successfully',
                });
            } catch (error: any) {
                if (error?.message && error.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: error.message,
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to reorder lessons',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ===============================
    // GET /api/lessons/statistics
    // Get lessons statistics
    // ===============================
    app.get(
        '/statistics',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
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
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const stats = await service.getLessonsStatistics();
                
                reply.send({
                    success: true,
                    message: 'Lessons statistics retrieved successfully',
                    data: stats,
                });
            } catch (error: any) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve lessons statistics',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // ===============================
    // GET /api/lessons/next-order/:courseId
    // Get next lesson order for a course
    // ===============================
    app.get(
        '/next-order/:courseId',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        courseId: { type: 'string' },
                    },
                    required: ['courseId'],
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
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { courseId } = request.params as { courseId: string };
                const nextOrder = await service.getNextOrder(courseId);
                
                reply.send({
                    success: true,
                    message: 'Next lesson order retrieved successfully',
                    data: { nextOrder },
                });
            } catch (error: any) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve next lesson order',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );
}

export default lessonsRoutes;
