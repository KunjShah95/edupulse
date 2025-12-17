import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ReservationsService } from './reservations.service.js';
import {
    createReservationSchema,
    cancelReservationSchema,
    updateReservationSchema,
    reservationQuerySchema,
    reservationAvailabilityQuerySchema,
    bulkCancelReservationSchema,
    fulfillReservationSchema,
    reservationsListResponseSchema,
    reservationResponseSchema,
    reservationsStatisticsResponseSchema,
    userReservationsResponseSchema,
    reservationAvailabilityResponseSchema,
} from './reservations.dto.js';
import { validate } from '../../middleware/validation.middleware.js';
import { AuthenticatedRequest, authenticate, requireTeacherOrAdmin } from '../../middleware/auth.middleware.js';

// --- Types / Interfaces ---
interface Reservation {
    id: string;
    [key: string]: any;
}

interface UserReservationsSummary {
    activeReservations: Reservation[];
    pendingReservations: Reservation[];
    expiredReservations: Reservation[];
    fulfilledReservations: Reservation[];
}

type FastifyRequestWithUser = AuthenticatedRequest;

const endpointRateLimit = () => async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Simplified rate limiting - would implement actual rate limiting logic
    return Promise.resolve();
};

const requireAuth = authenticate;

// Wrapper for requireTeacherOrAdmin to work with preHandler
const requireTeacherOrAdminWrapper = (request: FastifyRequest, reply: FastifyReply): void => {
    requireTeacherOrAdmin(request as any, reply, {} as FastifyInstance);
};

/**
 * Reservations Routes
 */
export async function reservationsRoutes(app: FastifyInstance): Promise<void> {
    const reservationsService = new ReservationsService();

    // ================================
    // USER ROUTES (Student/Teacher)
    // ================================

    // Check reservation availability
    app.get(
        '/availability',
        {
            preHandler: [endpointRateLimit(), validate({ query: reservationAvailabilityQuerySchema })],
            schema: {
                querystring: reservationAvailabilityQuerySchema,
                response: {
                    200: reservationAvailabilityResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const query = request.query as any;
                const result = await reservationsService.checkAvailability(query);

                reply.send({
                    success: true,
                    message: 'Reservation availability checked',
                    data: result,
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Book not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to check reservation availability',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // Create a reservation
    app.post(
        '/',
        {
            preHandler: [
                endpointRateLimit(),
                validate({ body: createReservationSchema }),
            ],
            schema: {
                body: createReservationSchema,
                response: {
                    201: reservationResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const body = request.body as any;
                const userId = (request as any).user?.id;

                // Ensure users can only reserve for themselves
                if (body.userId !== userId) {
                    reply.status(403).send({
                        success: false,
                        error: {
                            message: 'You can only make reservations for yourself',
                            code: 'FORBIDDEN',
                        },
                    });
                    return;
                }

                const result = await reservationsService.create(body);

                reply.code(201).send({
                    success: true,
                    message: 'Reservation created successfully',
                    data: result,
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Book not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('already have a reservation')) {
                    reply.code(409).send({
                        success: false,
                        error: {
                            message: e.message,
                            code: 'CONFLICT',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('maximum reservation limit')) {
                    reply.code(400).send({
                        success: false,
                        error: {
                            message: e.message,
                            code: 'BAD_REQUEST',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('currently available')) {
                    reply.code(400).send({
                        success: false,
                        error: {
                            message: e.message,
                            code: 'BAD_REQUEST',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to create reservation',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // Get user's reservations summary
    app.get(
        '/user/:userId',
        {
            preHandler: [endpointRateLimit()],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string' },
                    },
                    required: ['userId'],
                },
                response: {
                    200: userReservationsResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { userId } = request.params as { userId: string };
                const currentUserId = (request as any).user?.id;

                // Users can only access their own reservations
                if (userId !== currentUserId) {
                    reply.status(403).send({
                        success: false,
                        error: {
                            message: 'Access denied',
                            code: 'FORBIDDEN',
                        },
                    });
                    return;
                }

                const result = await reservationsService.getUserReservationsSummary(userId);

                reply.send({
                    success: true,
                    message: 'User reservations retrieved successfully',
                    data: {
                        active: result.activeReservations,
                        pending: result.pendingReservations,
                        expired: result.expiredReservations,
                        history: result.fulfilledReservations,
                        totalActive: result.activeReservations.length,
                        totalPending: result.pendingReservations.length,
                        totalExpired: result.expiredReservations.length,
                    },
                });
            } catch (e: any) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve user reservations',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // Cancel a reservation
    app.post(
        '/:id/cancel',
        {
            preHandler: [
                endpointRateLimit(),
                validate({ body: cancelReservationSchema }),
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
                },
                body: cancelReservationSchema,
                response: {
                    200: reservationResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { id } = request.params as { id: string };
                const body = request.body as any;
                const userId = (request as any).user?.id;

                const result = await reservationsService.cancel(id, body);

                reply.send({
                    success: true,
                    message: 'Reservation cancelled successfully',
                    data: result,
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Reservation not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('pending reservations')) {
                    reply.code(400).send({
                        success: false,
                        error: {
                            message: e.message,
                            code: 'BAD_REQUEST',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to cancel reservation',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // ================================
    // STAFF/ADMIN ROUTES
    // ================================

    // List reservations (staff with filtering)
    app.get(
        '/',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrAdminWrapper,
                validate({ query: reservationQuerySchema }),
            ],
            schema: {
                querystring: reservationQuerySchema,
                response: {
                    200: reservationsListResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const queryOptions = reservationQuerySchema.parse(request.query);
                const result = await reservationsService.findAll(queryOptions);

                reply.send({
                    success: true,
                    message: 'Reservations retrieved successfully',
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
            } catch (e: any) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve reservations',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // Get single reservation
    app.get(
        '/:id',
        {
            preHandler: [endpointRateLimit()],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
                },
                response: {
                    200: reservationResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { id } = request.params as { id: string };
                const user = (request as any).user;

                // Students can only access their own reservations
                if (user?.role === 'STUDENT') {
                    const userReservations = await reservationsService.getUserReservationsSummary(user.id) as UserReservationsSummary;
                    const allUserReservations = [
                        ...userReservations.activeReservations,
                        ...userReservations.pendingReservations,
                        ...userReservations.expiredReservations,
                        ...userReservations.fulfilledReservations
                    ];
                    const reservationExists = allUserReservations.some((res: any) => res.id === id);
                    
                    if (!reservationExists) {
                        reply.status(403).send({
                            success: false,
                            error: {
                                message: 'Access denied',
                                code: 'FORBIDDEN',
                            },
                        });
                        return;
                    }
                }

                const result = await reservationsService.findById(id);

                reply.send({
                    success: true,
                    message: 'Reservation retrieved successfully',
                    data: result,
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Reservation not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to retrieve reservation',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // Update reservation (staff only)
    app.put(
        '/:id',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrAdminWrapper,
                validate({ body: updateReservationSchema }),
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
                },
                body: updateReservationSchema,
                response: {
                    200: reservationResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { id } = request.params as { id: string };
                const body = request.body as any;
                const result = await reservationsService.update(id, body);

                reply.send({
                    success: true,
                    message: 'Reservation updated successfully',
                    data: result,
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Reservation not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to update reservation',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // Fulfill reservation (convert to loan)
    app.post(
        '/:id/fulfill',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrAdminWrapper,
                validate({ body: fulfillReservationSchema }),
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
                },
                body: fulfillReservationSchema,
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
                const body = request.body as any;
                const result = await reservationsService.fulfill(id, body);

                reply.send({
                    success: true,
                    message: 'Reservation fulfilled successfully',
                    data: result,
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Reservation not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('pending reservations')) {
                    reply.code(400).send({
                        success: false,
                        error: {
                            message: e.message,
                            code: 'BAD_REQUEST',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('expired')) {
                    reply.code(400).send({
                        success: false,
                        error: {
                            message: e.message,
                            code: 'BAD_REQUEST',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('not available')) {
                    reply.code(400).send({
                        success: false,
                        error: {
                            message: e.message,
                            code: 'BAD_REQUEST',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to fulfill reservation',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // Get pending reservations (staff only)
    app.get(
        '/pending',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrAdminWrapper,
                validate({ query: reservationQuerySchema }),
            ],
            schema: {
                querystring: reservationQuerySchema,
                response: {
                    200: reservationsListResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const queryOptions = reservationQuerySchema.parse(request.query);
                const result = await reservationsService.getPendingReservations(queryOptions);

                reply.send({
                    success: true,
                    message: 'Pending reservations retrieved successfully',
                    data: result.data,
                });
            } catch (e: any) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve pending reservations',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // Get expired reservations (staff only)
    app.get(
        '/expired',
        {
            preHandler: [
                endpointRateLimit(),
                requireTeacherOrAdminWrapper,
                validate({ query: reservationQuerySchema }),
            ],
            schema: {
                querystring: reservationQuerySchema,
                response: {
                    200: reservationsListResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const queryOptions = reservationQuerySchema.parse(request.query);
                const result = await reservationsService.getExpiredReservations(queryOptions);

                reply.send({
                    success: true,
                    message: 'Expired reservations retrieved successfully',
                    data: result.data,
                });
            } catch (e: any) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve expired reservations',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );
}
