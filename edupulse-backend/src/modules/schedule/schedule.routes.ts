import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
    createScheduleSchema,
    updateScheduleSchema,
    scheduleQuerySchema,
    schedulesListResponseSchema,
    scheduleResponseSchema,
    weeklyScheduleResponseSchema,
    schedulesStatisticsResponseSchema,
    availableRoomsResponseSchema,
    roomAvailabilityQuerySchema,
} from './schedule.dto.js';
import { scheduleService } from './schedule.service.js';
import { validate } from '../../middleware/validation.middleware.js';
import { requireTeacherOrStudent } from '../../middleware/roles.middleware.js';
import { endpointRateLimit } from '../../middleware/rate-limit.middleware.js';

/**
 * Schedule Routes
 */
export async function scheduleRoutes(app: FastifyInstance): Promise<void> {
    const service = scheduleService;

    // ===============================
    // GET /api/schedules
    // Get all schedules with pagination and filtering
    // ===============================
    app.get(
        '/',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
                querystring: scheduleQuerySchema,
                response: {
                    200: schedulesListResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const queryOptions = scheduleQuerySchema.parse(request.query);
                const result = await service.findAll(queryOptions);

                reply.send({
                    success: true,
                    message: 'Schedules retrieved successfully',
                    data: result.data,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.totalItems,
                        totalPages: Math.ceil(result.totalItems / result.limit),
                        hasNext: result.page < Math.ceil(result.totalItems / result.limit),
                        hasPrev: result.page > 1,
                    },
                });
            } catch (error) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve schedules',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // ===============================
    // GET /api/schedules/course/:courseId
    // Get schedules by course ID
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
                querystring: scheduleQuerySchema.omit({ courseId: true }),
                response: {
                    200: schedulesListResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { courseId } = request.params as { courseId: string };
                const queryOptions = scheduleQuerySchema.omit({ courseId: true }).parse(request.query);
                const result = await service.findByCourseId(courseId, queryOptions);

                reply.send({
                    success: true,
                    message: `Schedules for course ${courseId} retrieved successfully`,
                    data: result.data,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.totalItems,
                        totalPages: Math.ceil(result.totalItems / result.limit),
                        hasNext: result.page < Math.ceil(result.totalItems / result.limit),
                        hasPrev: result.page > 1,
                    },
                });
            } catch (error) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve schedules by course',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // ===============================
    // GET /api/schedules/day/:dayOfWeek
    // Get schedules by day of week
    // ===============================
    app.get(
        '/day/:dayOfWeek',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        dayOfWeek: z.coerce.number().int().min(0).max(6),
                    },
                    required: ['dayOfWeek'],
                },
                querystring: scheduleQuerySchema.omit({ dayOfWeek: true }),
                response: {
                    200: schedulesListResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { dayOfWeek } = request.params as { dayOfWeek: number };
                const queryOptions = scheduleQuerySchema.omit({ dayOfWeek: true }).parse(request.query);
                const result = await service.findByDayOfWeek(dayOfWeek, queryOptions);

                reply.send({
                    success: true,
                    message: `Schedules for day ${dayOfWeek} retrieved successfully`,
                    data: result.data,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.totalItems,
                        totalPages: Math.ceil(result.totalItems / result.limit),
                        hasNext: result.page < Math.ceil(result.totalItems / result.limit),
                        hasPrev: result.page > 1,
                    },
                });
            } catch (error) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve schedules by day',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // ===============================
    // GET /api/schedules/room/:room
    // Get schedules by room
    // ===============================
    app.get(
        '/room/:room',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        room: { type: 'string' },
                    },
                    required: ['room'],
                },
                querystring: scheduleQuerySchema.omit({ room: true }),
                response: {
                    200: schedulesListResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { room } = request.params as { room: string };
                const queryOptions = scheduleQuerySchema.omit({ room: true }).parse(request.query);
                const result = await service.findByRoom(room, queryOptions);

                reply.send({
                    success: true,
                    message: `Schedules for room "${room}" retrieved successfully`,
                    data: result.data,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.totalItems,
                        totalPages: Math.ceil(result.totalItems / result.limit),
                        hasNext: result.page < Math.ceil(result.totalItems / result.limit),
                        hasPrev: result.page > 1,
                    },
                });
            } catch (error) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve schedules by room',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // ===============================
    // GET /api/schedules/:id
    // Get schedule by ID
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
                const schedule = await service.findById(id);

                reply.send({
                    success: true,
                    message: 'Schedule retrieved successfully',
                    data: schedule,
                });
            } catch (error: any) {
                if (error.message && error.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Schedule not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to retrieve schedule',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ===============================
    // POST /api/schedules
    // Create a new schedule
    // ===============================
    app.post(
        '/',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
                validate({ body: createScheduleSchema }),
            ],
            schema: {
                body: createScheduleSchema,
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
                const scheduleData = request.body as any;
                const schedule = await service.create(scheduleData);

                reply.code(201).send({
                    success: true,
                    message: 'Schedule created successfully',
                    data: schedule,
                });
            } catch (error: any) {
                if (error.message && error.message.includes('already exists')) {
                    reply.code(409).send({
                        success: false,
                        error: {
                            message: error.message,
                            code: 'CONFLICT',
                        },
                    });
                } else if (error.message && error.message.includes('not found')) {
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
                            message: 'Failed to create schedule',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ===============================
    // PUT /api/schedules/:id
    // Update schedule
    // ===============================
    app.put(
        '/:id',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
                validate({ body: updateScheduleSchema }),
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
                },
                body: updateScheduleSchema,
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
                const schedule = await service.update(id, updateData);

                reply.send({
                    success: true,
                    message: 'Schedule updated successfully',
                    data: schedule,
                });
            } catch (error: any) {
                if (error.message && error.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Schedule not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else if (error.message && error.message.includes('already exists')) {
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
                            message: 'Failed to update schedule',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ===============================
    // DELETE /api/schedules/:id
    // Delete schedule
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
                    message: 'Schedule deleted successfully',
                });
            } catch (error: any) {
                if (error.message && error.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Schedule not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to delete schedule',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ===============================
    // GET /api/schedules/course/:courseId/weekly
    // Get weekly schedule for a course
    // ===============================
    app.get(
        '/course/:courseId/weekly',
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
                    200: weeklyScheduleResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { courseId } = request.params as { courseId: string };
                const weeklySchedule = await service.getWeeklySchedule(courseId);

                reply.send({
                    success: true,
                    message: 'Weekly schedule retrieved successfully',
                    data: weeklySchedule,
                });
            } catch (error: any) {
                if (error.message && error.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Course not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to retrieve weekly schedule',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ===============================
    // GET /api/schedules/available-rooms
    // Get available rooms for a time slot
    // ===============================
    app.get(
        '/available-rooms',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrStudent,
            ],
            schema: {
                querystring: roomAvailabilityQuerySchema,
                response: {
                    200: availableRoomsResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { dayOfWeek, startTime, endTime } = roomAvailabilityQuerySchema.parse(request.query);
                const availableRooms = await service.getAvailableRooms(dayOfWeek, startTime, endTime);

                reply.send({
                    success: true,
                    message: 'Available rooms retrieved successfully',
                    data: availableRooms,
                });
            } catch (error: any) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve available rooms',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // ===============================
    // GET /api/schedules/statistics
    // Get schedules statistics
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
                    200: schedulesStatisticsResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const statistics = await service.getSchedulesStatistics();

                reply.send({
                    success: true,
                    message: 'Schedule statistics retrieved successfully',
                    data: statistics,
                });
            } catch (error: any) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve schedule statistics',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );
}
