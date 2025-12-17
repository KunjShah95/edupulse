import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

declare module 'fastify' {
    interface FastifyRequest {
        id: string; // Correlation ID
        startTime: number; // Request start time in milliseconds
    }
}

/**
 * Middleware to add correlation ID and timing information to each request
 * This enables request tracing across logs and different services
 */
export async function requestContextMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    // Generate or extract correlation ID
    const correlationId = 
        (request.headers['x-correlation-id'] as string) ||
        (request.headers['x-request-id'] as string) ||
        uuidv4();

    request.id = correlationId;
    request.startTime = Date.now();

    // Add correlation ID to response headers
    reply.header('x-correlation-id', correlationId);
}

/**
 * Get request context information for logging
 */
export function getRequestContext(request: FastifyRequest) {
    return {
        correlationId: request.id,
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        userId: (request.user?.id as string) || undefined,
    };
}
