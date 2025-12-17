// ========================================
// RATE LIMITING MIDDLEWARE
// ========================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import { BadRequestError } from '../utils/error.util.js';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, {
    count: number;
    resetTime: number;
}>();

// Default rate limits
export const defaultRateLimits = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // Maximum requests per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (request: FastifyRequest) => {
        // Use user ID if authenticated, otherwise IP address
        return (request.user?.id) || request.ip || 'anonymous';
    },
    onLimitReached: (request: FastifyRequest, reply: FastifyReply) => {
        reply.status(429).send({
            success: false,
            error: {
                message: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((rateLimitStore.get(request.ip || 'anonymous')?.resetTime || 0 - Date.now()) / 1000)
            }
        });
    }
};

// Role-based rate limits
export const roleBasedRateLimits = {
    [UserRole.STUDENT]: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
    [UserRole.TEACHER]: { maxRequests: 200, windowMs: 15 * 60 * 1000 },
    [UserRole.ADMIN]: { maxRequests: 500, windowMs: 15 * 60 * 1000 },
    [UserRole.PARENT]: { maxRequests: 150, windowMs: 15 * 60 * 1000 },
};

// Endpoint-specific rate limits
export const endpointRateLimits = {
    '/api/auth/login': { maxRequests: 5, windowMs: 15 * 60 * 1000 },
    '/api/auth/register': { maxRequests: 3, windowMs: 60 * 60 * 1000 },
    '/api/auth/forgot-password': { maxRequests: 3, windowMs: 60 * 60 * 1000 },
    '/api/upload': { maxRequests: 10, windowMs: 60 * 60 * 1000 },
    '/api/notifications/send': { maxRequests: 50, windowMs: 60 * 60 * 1000 },
};

interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (request: FastifyRequest) => string;
    onLimitReached?: (request: FastifyRequest, reply: FastifyReply) => void;
}

/**
 * Create rate limiting middleware
 */
export const createRateLimitMiddleware = (options: RateLimitOptions) => {
    const {
        maxRequests,
        windowMs,
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
        keyGenerator = defaultRateLimits.keyGenerator,
        onLimitReached = defaultRateLimits.onLimitReached
    } = options;

    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        const key = keyGenerator(request);
        const now = Date.now();
        
        // Get or create rate limit record
        let rateLimit = rateLimitStore.get(key);
        
        if (!rateLimit || now > rateLimit.resetTime) {
            // Reset or create new record
            rateLimit = {
                count: 1,
                resetTime: now + windowMs
            };
            rateLimitStore.set(key, rateLimit);
        } else {
            // Increment counter
            rateLimit.count++;
        }

        // Check if limit exceeded
        if (rateLimit.count > maxRequests) {
            // Set retry-after header
            reply.header('Retry-After', Math.ceil((rateLimit.resetTime - now) / 1000));
            reply.header('X-RateLimit-Limit', maxRequests.toString());
            reply.header('X-RateLimit-Remaining', '0');
            reply.header('X-RateLimit-Reset', rateLimit.resetTime.toString());
            
            onLimitReached(request, reply);
            return;
        }

        // Set rate limit headers
        reply.header('X-RateLimit-Limit', maxRequests.toString());
        reply.header('X-RateLimit-Remaining', (maxRequests - rateLimit.count).toString());
        reply.header('X-RateLimit-Reset', rateLimit.resetTime.toString());
    };
};

/**
 * Role-based rate limiting middleware
 */
export const roleBasedRateLimit = () => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        const user = request.user;
        
        if (!user) {
            // Use default limits for unauthenticated requests
            return createRateLimitMiddleware({
                maxRequests: 50,
                windowMs: 15 * 60 * 1000
            })(request, reply);
        }

        const roleLimit = (roleBasedRateLimits as any)[user.role as UserRole] || defaultRateLimits;
        return createRateLimitMiddleware(roleLimit)(request, reply);
    };
};

/**
 * Endpoint-specific rate limiting middleware
 */
export const endpointRateLimit = () => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        const path = (request as any).routerPath || request.url;
        
        // Check for specific endpoint limits
        for (const [endpoint, limit] of Object.entries(endpointRateLimits)) {
            if (path.startsWith(endpoint)) {
                return createRateLimitMiddleware(limit)(request, reply);
            }
        }
        
        // Use role-based limits if no specific endpoint limit found
        return roleBasedRateLimit()(request, reply);
    };
};

/**
 * Strict rate limiting for sensitive operations
 */
export const strictRateLimit = createRateLimitMiddleware({
    maxRequests: 3,
    windowMs: 15 * 60 * 1000,
    keyGenerator: (request) => {
        return (request.user?.id) || request.ip || 'anonymous';
    }
});

/**
 * Burst protection (allow sudden spikes but limit sustained traffic)
 */
export const burstProtection = createRateLimitMiddleware({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: true, // Don't count successful requests
    skipFailedRequests: false, // Count failed requests
});

/**
 * File upload rate limiting
 */
export const uploadRateLimit = createRateLimitMiddleware({
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: (request) => {
        return (request.user?.id) || request.ip || 'anonymous';
    }
});

/**
 * API key rate limiting (for external integrations)
 */
export const apiKeyRateLimit = createRateLimitMiddleware({
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: (request) => {
        // Use API key as identifier
        const apiKey = request.headers['x-api-key'] as string;
        return apiKey || request.ip || 'anonymous';
    }
});

/**
 * Clean up expired rate limit entries
 */
export const cleanupRateLimitStore = (): void => {
    const now = Date.now();
    
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    }
};

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

export default {
    createRateLimitMiddleware,
    roleBasedRateLimit,
    endpointRateLimit,
    strictRateLimit,
    burstProtection,
    uploadRateLimit,
    apiKeyRateLimit,
    roleBasedRateLimits,
    endpointRateLimits,
    cleanupRateLimitStore,
};
