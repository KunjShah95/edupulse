import * as Sentry from '@sentry/node';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import config from '../config/index.js';

/**
 * Initialize Sentry error tracking
 */
export function initializeSentry(): void {
    if (!config.sentry.dsn) {
        console.warn('Sentry DSN not configured. Error tracking disabled.');
        return;
    }

    Sentry.init({
        dsn: config.sentry.dsn,
        environment: config.env,
        tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,
        beforeSend(event: any, hint: any) {
            // Filter out certain errors
            if (event.exception) {
                const error = hint.originalException;
                // Don't send 4xx errors to Sentry
                if (error instanceof Error && error.message.includes('Invalid')) {
                    return null;
                }
            }
            return event;
        },
    });

    console.log('Sentry error tracking initialized');
}

/**
 * Register Sentry hooks with Fastify
 */
export async function registerSentryHooks(app: FastifyInstance): Promise<void> {
    if (!config.sentry.dsn) {
        return;
    }

    // Capture request context
    app.addHook('onRequest', async (request: FastifyRequest) => {
        // Set user context if authenticated
        if (request.user?.id) {
            Sentry.setUser({
                id: request.user.id as string,
                email: request.user.email as string,
                role: request.user.role as string,
            });
        }

        // Set request context
        Sentry.setContext('http', {
            method: request.method,
            url: request.url,
            query: request.query,
            headers: {
                'user-agent': request.headers['user-agent'],
                'content-type': request.headers['content-type'],
            },
        });

        // Set correlation ID as tag
        Sentry.setTag('correlationId', request.id);
    });

    // Capture errors
    app.setErrorHandler((error: any, request, reply) => {
        Sentry.captureException(error, {
            level: error.statusCode >= 500 ? 'error' : 'warning',
            tags: {
                statusCode: error.statusCode || 500,
                method: request.method,
                url: request.url,
            },
            extra: {
                correlationId: request.id,
                userId: request.user?.id,
                body: request.body,
            },
        });

        const statusCode = error.statusCode || 500;
        const message = config.env === 'production' && statusCode === 500
            ? 'Internal Server Error'
            : error.message;

        request.log.error({
            err: error,
            request: {
                method: request.method,
                url: request.url,
                correlationId: request.id,
            },
        });

        reply.status(statusCode).send({
            statusCode,
            error: error.name || 'Error',
            message,
            ...(config.env === 'development' && { stack: error.stack }),
            correlationId: request.id,
        });
    });

    // Capture response errors
    app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
        const statusCode = reply.statusCode;

        if (statusCode >= 500) {
            Sentry.captureMessage(
                `Server error: ${request.method} ${request.url} - ${statusCode}`,
                'error'
            );
        } else if (statusCode >= 400) {
            Sentry.captureMessage(
                `Client error: ${request.method} ${request.url} - ${statusCode}`,
                'warning'
            );
        }
    });
}

/**
 * Capture breadcrumb event
 */
export function captureBreadcrumb(
    message: string,
    category: string,
    level: Sentry.SeverityLevel = 'info',
    data?: Record<string, any>
): void {
    if (!config.sentry.dsn) {
        return;
    }

    Sentry.captureMessage(message, {
        level,
        tags: { category },
        extra: data,
    });
}

/**
 * Capture business event
 */
export function captureBusinessEvent(
    event: string,
    userId: string,
    details: Record<string, any> = {}
): void {
    if (!config.sentry.dsn) {
        return;
    }

    Sentry.captureMessage(`Business event: ${event}`, {
        level: 'info',
        tags: {
            event,
            userId,
        },
        extra: details,
    });
}

/**
 * Capture performance transaction
 */
export function captureTransaction(
    name: string,
    op: string,
    duration: number,
    statusCode: number = 200
): void {
    if (!config.sentry.dsn) {
        return;
    }

    Sentry.captureMessage(`Transaction: ${name}`, {
        tags: {
            transaction: name,
            operation: op,
            duration,
            status: statusCode,
        },
    });
}

export default {
    initializeSentry,
    registerSentryHooks,
    captureBreadcrumb,
    captureBusinessEvent,
    captureTransaction,
};
