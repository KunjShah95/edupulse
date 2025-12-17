import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import config from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { requestContextMiddleware } from './middleware/request-context.middleware.js';
import { loggingService } from './services/logging.service.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/users.routes.js';
import studentRoutes from './modules/students/students.routes.js';
import teacherRoutes from './modules/teachers/teachers.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import quizRoutes from './modules/quiz/quiz.routes.js';
import { registerFileRoutes } from './routes/files.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify({
        logger: loggingService.getLogger(),
    });

    // ========================================
    // PLUGINS
    // ========================================

    // Security - Helmet
    await app.register(helmet, {
        contentSecurityPolicy: config.env === 'production',
    });

    // CORS
    await app.register(cors, {
        origin: config.corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });

    // Rate Limiting
    await app.register(rateLimit, {
        max: config.rateLimit.max,
        timeWindow: config.rateLimit.windowMs,
        errorResponseBuilder: () => ({
            statusCode: 429,
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
        }),
    });

    // JWT
    await app.register(jwt, {
        secret: config.jwt.accessSecret,
        sign: {
            expiresIn: config.jwt.accessExpiry,
        },
    });

    // Cookies
    await app.register(cookie, {
        secret: config.jwt.refreshSecret,
        hook: 'onRequest',
    });

    // Request Context Middleware (for correlation IDs and timing)
    app.addHook('onRequest', requestContextMiddleware);

    // Response logging
    app.addHook('onResponse', (request, reply, done) => {
        loggingService.logResponse(request, reply.statusCode, Date.now() - request.startTime);
        done();
    });

    // Multipart/form-data file upload support
    await app.register(multipart, {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
        },
    });

    // Swagger Documentation
    await app.register(swagger, {
        openapi: {
            openapi: '3.0.0',
            info: {
                title: 'EduPulse API',
                description: 'Backend API for EduPulse School Management System',
                version: '1.0.0',
            },
            servers: [
                {
                    url: `http://localhost:${config.port}`,
                    description: 'Development server',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
            tags: [
                { name: 'Health', description: 'Health check endpoints' },
                { name: 'Auth', description: 'Authentication endpoints' },
                { name: 'Users', description: 'User management endpoints' },
                { name: 'Students', description: 'Student management endpoints' },
                { name: 'Teachers', description: 'Teacher management endpoints' },
                { name: 'Quizzes', description: 'Quiz management endpoints' },
            ],
        },
    });

    await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
    });

    // JWT DECORATOR

    app.decorate('authenticate', async function (
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Invalid or expired token',
            });
        }
    });

    // ERROR HANDLING
    app.setErrorHandler((error: any, request, reply) => {
        const statusCode = error.statusCode || 500;

        request.log.error({
            err: error,
            request: {
                method: request.method,
                url: request.url,
                params: request.params,
                query: request.query,
            },
        });

        // Don't expose internal errors in production
        const message = config.env === 'production' && statusCode === 500
            ? 'Internal Server Error'
            : error.message;

        reply.status(statusCode).send({
            statusCode,
            error: error.name || 'Error',
            message,
            ...(config.env === 'development' && { stack: error.stack }),
        });
    });

    // ========================================
    // ROUTES
    // ========================================

    const apiPrefix = `/api/${config.apiVersion}`;

    // Health check (no prefix)
    await app.register(healthRoutes, { prefix: '/health' });

    // API routes
    await app.register(authRoutes, { prefix: `${apiPrefix}/auth` });
    await app.register(userRoutes, { prefix: `${apiPrefix}/users` });
    await app.register(studentRoutes, { prefix: `${apiPrefix}/students` });
    await app.register(teacherRoutes, { prefix: `${apiPrefix}/teachers` });
    await app.register(quizRoutes, { prefix: `${apiPrefix}` });

    // File routes
    await registerFileRoutes(app);

    // Root route
    app.get('/', async () => ({
        name: 'EduPulse API',
        version: '1.0.0',
        docs: '/docs',
        health: '/health',
    }));

    // ========================================
    // LIFECYCLE HOOKS
    // ========================================

    app.addHook('onClose', async () => {
        await disconnectDatabase();
    });

    return app;
}

// Type augmentation for Fastify
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: {
            id: string;
            email: string;
            role: string;
        };
        user: {
            id: string;
            email: string;
            role: string;
        };
    }
}

export default buildApp;
