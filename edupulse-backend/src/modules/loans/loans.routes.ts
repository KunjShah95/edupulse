import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LoansService } from './loans.service.js';
import {
    createLoanSchema,
    returnLoanSchema,
    extendLoanSchema,
    updateLoanSchema,
    loanQuerySchema,
    loanAvailabilityQuerySchema,
    bulkReturnSchema,
    loansListResponseSchema,
    loanResponseSchema,
    loansStatisticsResponseSchema,
    overdueLoansResponseSchema,
    userLoansResponseSchema,
    loanAvailabilityResponseSchema,
} from './loans.dto.js';
import { validate } from '../../middleware/validation.middleware.js';
import { UserRole } from '@prisma/client';

// Helper middleware functions (simplified versions)
const requireAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Simplified auth - assume user is attached to request
    const user = (request as any).user;
    if (!user) {
        reply.status(401).send({
            success: false,
            error: 'Authentication required',
            code: 'UNAUTHORIZED',
        });
        return;
    }
};

const requireRole = (roles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        const user = (request as any).user;
        if (!user || !roles.includes(user.role)) {
            reply.status(403).send({
                success: false,
                error: 'Insufficient permissions',
                code: 'FORBIDDEN',
            });
            return;
        }
    };
};

const endpointRateLimit = () => async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Simplified rate limiting - would implement actual rate limiting logic
    return Promise.resolve();
};

/**
 * Loans Routes
 */
export async function loansRoutes(app: FastifyInstance): Promise<void> {
    const loansService = new LoansService();

    // ================================
    // USER ROUTES (Student/Teacher)
    // ================================

    // Borrow a book
    app.post(
        '/borrow',
        {
            preHandler: [
                endpointRateLimit(),
                requireAuth,
                validate({ body: createLoanSchema }),
            ],
            schema: {
                body: createLoanSchema,
                response: {
                    201: loanResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const body = request.body as any;
                const userId = (request as any).user.id;

                // Ensure users can only borrow for themselves
                if (body.borrowerId !== userId) {
                    reply.status(403).send({
                        success: false,
                        error: {
                            message: 'You can only borrow books for yourself',
                            code: 'FORBIDDEN',
                        },
                    });
                    return;
                }

                const result = await loansService.create(body);

                reply.code(201).send({
                    success: true,
                    message: 'Book borrowed successfully',
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
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('maximum loan limit')) {
                    reply.code(400).send({
                        success: false,
                        error: {
                            message: e.message,
                            code: 'BAD_REQUEST',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('already have this book')) {
                    reply.code(409).send({
                        success: false,
                        error: {
                            message: e.message,
                            code: 'CONFLICT',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to borrow book',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // Get user's loans summary
    app.get(
        '/user/:userId/summary',
        {
            preHandler: [endpointRateLimit(), requireAuth],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string' },
                    },
                    required: ['userId'],
                },
                response: {
                    200: userLoansResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { userId } = request.params as { userId: string };
                const currentUserId = (request as any).user.id;

                // Users can only access their own loans
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

                const result = await loansService.getUserLoansSummary(userId);

                reply.send({
                    success: true,
                    message: 'User loans summary retrieved successfully',
                    data: {
                        active: result.activeLoans,
                        overdue: result.overdueLoans,
                        history: result.returnedLoans,
                        totalActive: result.counts.active,
                        totalOverdue: result.counts.overdue,
                        totalFines: 0, // Calculate if needed
                    },
                });
            } catch (e: any) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve user loans summary',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // Return a book
    app.post(
        '/:id/return',
        {
            preHandler: [
                endpointRateLimit(),
                requireAuth,
                validate({ body: returnLoanSchema }),
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
                },
                body: returnLoanSchema,
                response: {
                    200: loanResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { id } = request.params as { id: string };
                const body = request.body as any;

                const result = await loansService.returnBook(id, body);

                reply.send({
                    success: true,
                    message: 'Book returned successfully',
                    data: result,
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Loan not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('already been returned')) {
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
                            message: 'Failed to return book',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // Extend loan due date
    app.post(
        '/:id/extend',
        {
            preHandler: [
                endpointRateLimit(),
                requireAuth,
                validate({ body: extendLoanSchema }),
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
                },
                body: extendLoanSchema,
                response: {
                    200: loanResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { id } = request.params as { id: string };
                const body = request.body as any;

                const result = await loansService.extendLoan(id, body);

                reply.send({
                    success: true,
                    message: 'Loan extended successfully',
                    data: result,
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Loan not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('active loans')) {
                    reply.code(400).send({
                        success: false,
                        error: {
                            message: 'Only active loans can be extended',
                            code: 'BAD_REQUEST',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('overdue')) {
                    reply.code(400).send({
                        success: false,
                        error: {
                            message: 'Cannot extend overdue loans',
                            code: 'BAD_REQUEST',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to extend loan',
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

    // Create loan (staff only)
    app.post(
        '/',
        {
            preHandler: [
                endpointRateLimit(),
                requireAuth,
                requireRole([UserRole.TEACHER, UserRole.ADMIN]),
                validate({ body: createLoanSchema }),
            ],
            schema: {
                body: createLoanSchema,
                response: {
                    201: loanResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const body = request.body as any;
                const result = await loansService.create(body);

                reply.code(201).send({
                    success: true,
                    message: 'Loan created successfully',
                    data: result,
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Book or borrower not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('maximum loan limit')) {
                    reply.code(400).send({
                        success: false,
                        error: {
                            message: e.message,
                            code: 'BAD_REQUEST',
                        },
                    });
                } else if (e?.message && typeof e.message === 'string' && e.message.includes('already have this book')) {
                    reply.code(409).send({
                        success: false,
                        error: {
                            message: e.message,
                            code: 'CONFLICT',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to create loan',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // List loans (staff with filtering)
    app.get(
        '/',
        {
            preHandler: [
                endpointRateLimit(),
                requireAuth,
                requireRole([UserRole.TEACHER, UserRole.ADMIN]),
                validate({ query: loanQuerySchema }),
            ],
            schema: {
                querystring: loanQuerySchema,
                response: {
                    200: loansListResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const queryOptions = loanQuerySchema.parse(request.query);
                const result = await loansService.findAll(queryOptions);

                reply.send({
                    success: true,
                    message: 'Loans retrieved successfully',
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
                        message: 'Failed to retrieve loans',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // Get single loan
    app.get(
        '/:id',
        {
            preHandler: [endpointRateLimit(), requireAuth],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
                },
                response: {
                    200: loanResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { id } = request.params as { id: string };
                const user = (request as any).user;

                // Students can only access their own loans
                if (user.role === UserRole.STUDENT) {
                    const userLoans = await loansService.getUserLoansSummary(user.id);
                    const loanExists = 
                        userLoans.activeLoans.some((loan: any) => loan.id === id) ||
                        userLoans.overdueLoans.some((loan: any) => loan.id === id) ||
                        userLoans.returnedLoans.some((loan: any) => loan.id === id);
                    
                    if (!loanExists) {
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

                const result = await loansService.findById(id);

                reply.send({
                    success: true,
                    message: 'Loan retrieved successfully',
                    data: result,
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Loan not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to retrieve loan',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // Update loan (staff only)
    app.put(
        '/:id',
        {
            preHandler: [
                endpointRateLimit(),
                requireAuth,
                requireRole([UserRole.TEACHER, UserRole.ADMIN]),
                validate({ body: updateLoanSchema }),
            ],
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                    required: ['id'],
                },
                body: updateLoanSchema,
                response: {
                    200: loanResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const { id } = request.params as { id: string };
                const body = request.body as any;
                const result = await loansService.update(id, body);

                reply.send({
                    success: true,
                    message: 'Loan updated successfully',
                    data: result,
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Loan not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to update loan',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );

    // Get overdue loans (staff only)
    app.get(
        '/overdue',
        {
            preHandler: [
                endpointRateLimit(),
                requireAuth,
                requireRole([UserRole.TEACHER, UserRole.ADMIN]),
                validate({ query: loanQuerySchema }),
            ],
            schema: {
                querystring: loanQuerySchema,
                response: {
                    200: overdueLoansResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const queryOptions = loanQuerySchema.parse(request.query);
                const result = await loansService.getOverdueLoans(queryOptions);

                reply.send({
                    success: true,
                    message: 'Overdue loans retrieved successfully',
                    data: result.data,
                });
            } catch (e: any) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve overdue loans',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // Get loan statistics (staff only)
    app.get(
        '/statistics',
        {
            preHandler: [
                endpointRateLimit(),
                requireAuth,
                requireRole([UserRole.TEACHER, UserRole.ADMIN]),
            ],
            schema: {
                response: {
                    200: loansStatisticsResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const result = await loansService.getLoansStatistics();

                reply.send({
                    success: true,
                    message: 'Loan statistics retrieved successfully',
                    data: result,
                });
            } catch (e: any) {
                reply.code(500).send({
                    success: false,
                    error: {
                        message: 'Failed to retrieve loan statistics',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        }
    );

    // Delete loan (admin only)
    app.delete(
        '/:id',
        {
            preHandler: [
                endpointRateLimit(),
                requireAuth,
                requireRole([UserRole.ADMIN]),
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
                await loansService.delete(id);

                reply.send({
                    success: true,
                    message: 'Loan deleted successfully',
                });
            } catch (e: any) {
                if (e?.message && typeof e.message === 'string' && e.message.includes('not found')) {
                    reply.code(404).send({
                        success: false,
                        error: {
                            message: 'Loan not found',
                            code: 'NOT_FOUND',
                        },
                    });
                } else {
                    reply.code(500).send({
                        success: false,
                        error: {
                            message: 'Failed to delete loan',
                            code: 'INTERNAL_SERVER_ERROR',
                        },
                    });
                }
            }
        }
    );
}
