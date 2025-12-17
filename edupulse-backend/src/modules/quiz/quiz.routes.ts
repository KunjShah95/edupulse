import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import quizService, {
    createQuizSchema,
    updateQuizSchema,
    createQuestionSchema,
    submitQuizSchema,
} from './quiz.service.js';
import { z } from 'zod';

async function quizRoutes(app: FastifyInstance): Promise<void> {
    // All quiz routes require authentication
    app.addHook('preHandler', app.authenticate);

    // ========================================
    // QUIZ CRUD OPERATIONS
    // ========================================

    // CREATE QUIZ (Teacher/Admin only)
    app.post<{ Body: z.infer<typeof createQuizSchema>; Params: { courseId: string } }>('/courses/:courseId/quizzes', {
        schema: {
            tags: ['Quizzes'],
            summary: 'Create a new quiz',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    courseId: { type: 'string' },
                },
            },
            body: {
                type: 'object',
                required: ['title', 'totalPoints', 'passingScore'],
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    totalPoints: { type: 'number' },
                    passingScore: { type: 'number' },
                    timeLimit: { type: 'number' },
                    shuffleQuestions: { type: 'boolean' },
                    shuffleOptions: { type: 'boolean' },
                    showResults: { type: 'boolean' },
                },
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        statusCode: { type: 'number' },
                        data: { type: 'object' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: z.infer<typeof createQuizSchema>; Params: { courseId: string } }>, reply: FastifyReply) => {
        try {
            if (!['TEACHER', 'ADMIN'].includes(request.user.role)) {
                return reply.status(403).send({
                    statusCode: 403,
                    error: 'Forbidden',
                    message: 'Only teachers and admins can create quizzes',
                });
            }

            const validation = createQuizSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    statusCode: 400,
                    error: 'Validation Error',
                    message: 'Invalid quiz data',
                    details: validation.error.errors,
                });
            }

            const quiz = await quizService.createQuiz({ ...validation.data, courseId: request.params.courseId });

            return reply.status(201).send({
                statusCode: 201,
                data: quiz,
                message: 'Quiz created successfully',
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: error.message || 'Failed to create quiz',
            });
        }
    });

    // GET QUIZ BY ID
    app.get<{ Params: { quizId: string } }>('/quizzes/:quizId', {
        schema: {
            tags: ['Quizzes'],
            summary: 'Get quiz by ID',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    quizId: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        statusCode: { type: 'number' },
                        data: { type: 'object' },
                    },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { quizId: string } }>, reply: FastifyReply) => {
        try {
            const quiz = await quizService.getQuiz(request.params.quizId);

            if (!quiz) {
                return reply.status(404).send({
                    statusCode: 404,
                    error: 'Not Found',
                    message: 'Quiz not found',
                });
            }

            return reply.status(200).send({
                statusCode: 200,
                data: quiz,
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: error.message,
            });
        }
    });

    // LIST QUIZZES BY COURSE
    app.get<{ Params: { courseId: string }; Querystring: { page?: string; limit?: string } }>('/courses/:courseId/quizzes', {
        schema: {
            tags: ['Quizzes'],
            summary: 'List quizzes for a course',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    courseId: { type: 'string' },
                },
            },
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'string', default: '1' },
                    limit: { type: 'string', default: '10' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { courseId: string }; Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
        try {
            const page = parseInt(request.query.page || '1');
            const limit = parseInt(request.query.limit || '10');

            const result = await quizService.getQuizzesByCourse(request.params.courseId, page, limit);

            return reply.status(200).send({
                statusCode: 200,
                data: result.quizzes,
                pagination: result.pagination,
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: error.message,
            });
        }
    });

    // UPDATE QUIZ
    app.put<{ Params: { quizId: string }; Body: z.infer<typeof updateQuizSchema> }>('/quizzes/:quizId', {
        schema: {
            tags: ['Quizzes'],
            summary: 'Update quiz',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    quizId: { type: 'string' },
                },
            },
            body: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    totalPoints: { type: 'number' },
                    passingScore: { type: 'number' },
                    timeLimit: { type: 'number' },
                    shuffleQuestions: { type: 'boolean' },
                    shuffleOptions: { type: 'boolean' },
                    showResults: { type: 'boolean' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { quizId: string }; Body: z.infer<typeof updateQuizSchema> }>, reply: FastifyReply) => {
        try {
            if (!['TEACHER', 'ADMIN'].includes(request.user.role)) {
                return reply.status(403).send({
                    statusCode: 403,
                    error: 'Forbidden',
                    message: 'Only teachers and admins can update quizzes',
                });
            }

            const validation = updateQuizSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    statusCode: 400,
                    error: 'Validation Error',
                    message: 'Invalid quiz data',
                    details: validation.error.errors,
                });
            }

            const quiz = await quizService.updateQuiz(request.params.quizId, validation.data);

            return reply.status(200).send({
                statusCode: 200,
                data: quiz,
                message: 'Quiz updated successfully',
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: error.message,
            });
        }
    });

    // DELETE QUIZ
    app.delete<{ Params: { quizId: string } }>('/quizzes/:quizId', {
        schema: {
            tags: ['Quizzes'],
            summary: 'Delete quiz',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    quizId: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { quizId: string } }>, reply: FastifyReply) => {
        try {
            if (!['TEACHER', 'ADMIN'].includes(request.user.role)) {
                return reply.status(403).send({
                    statusCode: 403,
                    error: 'Forbidden',
                    message: 'Only teachers and admins can delete quizzes',
                });
            }

            await quizService.deleteQuiz(request.params.quizId);

            return reply.status(200).send({
                statusCode: 200,
                message: 'Quiz deleted successfully',
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: error.message,
            });
        }
    });

    // ========================================
    // QUESTION MANAGEMENT
    // ========================================

    // ADD QUESTION TO QUIZ
    app.post<{ Params: { quizId: string }; Body: z.infer<typeof createQuestionSchema> }>('/quizzes/:quizId/questions', {
        schema: {
            tags: ['Quizzes'],
            summary: 'Add question to quiz',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    quizId: { type: 'string' },
                },
            },
            body: {
                type: 'object',
                properties: {
                    text: { type: 'string' },
                    type: { type: 'string', enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'] },
                    points: { type: 'number' },
                    explanation: { type: 'string' },
                    options: { type: 'array' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { quizId: string }; Body: z.infer<typeof createQuestionSchema> }>, reply: FastifyReply) => {
        try {
            const validation = createQuestionSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    statusCode: 400,
                    error: 'Validation Error',
                    message: 'Invalid question data',
                    details: validation.error.errors,
                });
            }

            const question = await quizService.addQuestion(request.params.quizId, validation.data);

            return reply.status(201).send({
                statusCode: 201,
                data: question,
                message: 'Question added successfully',
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: error.message,
            });
        }
    });

    // DELETE QUESTION
    app.delete<{ Params: { questionId: string } }>('/questions/:questionId', {
        schema: {
            tags: ['Quizzes'],
            summary: 'Delete question',
            security: [{ bearerAuth: [] }],
        },
    }, async (request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) => {
        try {
            await quizService.deleteQuestion(request.params.questionId);

            return reply.status(200).send({
                statusCode: 200,
                message: 'Question deleted successfully',
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: error.message,
            });
        }
    });

    // ========================================
    // QUIZ SUBMISSION
    // ========================================

    // SUBMIT QUIZ ANSWERS
    app.post<{ Params: { quizId: string }; Body: z.infer<typeof submitQuizSchema> }>('/quizzes/:quizId/submit', {
        schema: {
            tags: ['Quizzes'],
            summary: 'Submit quiz answers',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    quizId: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { quizId: string }; Body: z.infer<typeof submitQuizSchema> }>, reply: FastifyReply) => {
        try {
            const validation = submitQuizSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    statusCode: 400,
                    error: 'Validation Error',
                    message: 'Invalid submission data',
                    details: validation.error.errors,
                });
            }

            const result = await quizService.submitQuiz(
                request.params.quizId,
                request.user.id,
                validation.data
            );

            return reply.status(200).send({
                statusCode: 200,
                data: result,
                message: result.passed ? 'Quiz passed!' : 'Quiz submitted',
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: error.message,
            });
        }
    });

    // ========================================
    // ANALYTICS
    // ========================================

    // GET QUIZ ANALYTICS
    app.get<{ Params: { quizId: string } }>('/quizzes/:quizId/analytics', {
        schema: {
            tags: ['Quizzes'],
            summary: 'Get quiz analytics',
            security: [{ bearerAuth: [] }],
        },
    }, async (request: FastifyRequest<{ Params: { quizId: string } }>, reply: FastifyReply) => {
        try {
            const analytics = await quizService.getQuizAnalytics(request.params.quizId);

            return reply.status(200).send({
                statusCode: 200,
                data: analytics,
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: error.message,
            });
        }
    });

    // GET STUDENT QUIZ STATS
    app.get('/quizzes/student/stats', {
        schema: {
            tags: ['Quizzes'],
            summary: 'Get student quiz statistics',
            security: [{ bearerAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const stats = await quizService.getStudentQuizStats(request.user.id);

            return reply.status(200).send({
                statusCode: 200,
                data: stats,
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: error.message,
            });
        }
    });
}

export default quizRoutes;
