// ========================================
// VALIDATION MIDDLEWARE
// ========================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/error.util.js';

/**
 * Zod validation middleware for request body
 */
export const validateBody = (schema: ZodSchema) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
            // Validate request body
            const result = schema.safeParse(request.body);
            
            if (!result.success) {
                const errorMessages = result.error.errors.map(err => 
                    `${err.path.join('.')}: ${err.message}`
                );
                
                throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`);
            }
            
            // Replace request body with validated data
            request.body = result.data;
        } catch (error) {
            if (error instanceof ValidationError) {
                reply.status(400).send({
                    success: false,
                    error: error.message,
                    code: 'VALIDATION_ERROR',
                });
                return;
            }
            
            reply.status(400).send({
                success: false,
                error: 'Invalid request data',
                code: 'VALIDATION_ERROR',
            });
        }
    };
};

/**
 * Zod validation middleware for query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
            // Validate query parameters
            const result = schema.safeParse(request.query);
            
            if (!result.success) {
                const errorMessages = result.error.errors.map(err => 
                    `${err.path.join('.')}: ${err.message}`
                );
                
                throw new ValidationError(`Query validation failed: ${errorMessages.join(', ')}`);
            }
            
            // Replace query with validated data
            request.query = result.data;
        } catch (error) {
            if (error instanceof ValidationError) {
                reply.status(400).send({
                    success: false,
                    error: error.message,
                    code: 'QUERY_VALIDATION_ERROR',
                });
                return;
            }
            
            reply.status(400).send({
                success: false,
                error: 'Invalid query parameters',
                code: 'QUERY_VALIDATION_ERROR',
            });
        }
    };
};

/**
 * Zod validation middleware for URL parameters
 */
export const validateParams = (schema: ZodSchema) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
            // Validate URL parameters
            const result = schema.safeParse(request.params);
            
            if (!result.success) {
                const errorMessages = result.error.errors.map(err => 
                    `${err.path.join('.')}: ${err.message}`
                );
                
                throw new ValidationError(`Parameter validation failed: ${errorMessages.join(', ')}`);
            }
            
            // Replace params with validated data
            request.params = result.data;
        } catch (error) {
            if (error instanceof ValidationError) {
                reply.status(400).send({
                    success: false,
                    error: error.message,
                    code: 'PARAM_VALIDATION_ERROR',
                });
                return;
            }
            
            reply.status(400).send({
                success: false,
                error: 'Invalid URL parameters',
                code: 'PARAM_VALIDATION_ERROR',
            });
        }
    };
};

/**
 * Combined validation middleware for body, query, and params
 */
export const validate = (schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
            // Validate body if schema provided
            if (schemas.body) {
                const bodyResult = schemas.body.safeParse(request.body);
                if (!bodyResult.success) {
                    const errorMessages = bodyResult.error.errors.map(err => 
                        `body.${err.path.join('.')}: ${err.message}`
                    );
                    throw new ValidationError(`Body validation failed: ${errorMessages.join(', ')}`);
                }
                request.body = bodyResult.data;
            }

            // Validate query if schema provided
            if (schemas.query) {
                const queryResult = schemas.query.safeParse(request.query);
                if (!queryResult.success) {
                    const errorMessages = queryResult.error.errors.map(err => 
                        `query.${err.path.join('.')}: ${err.message}`
                    );
                    throw new ValidationError(`Query validation failed: ${errorMessages.join(', ')}`);
                }
                request.query = queryResult.data;
            }

            // Validate params if schema provided
            if (schemas.params) {
                const paramsResult = schemas.params.safeParse(request.params);
                if (!paramsResult.success) {
                    const errorMessages = paramsResult.error.errors.map(err => 
                        `params.${err.path.join('.')}: ${err.message}`
                    );
                    throw new ValidationError(`Parameter validation failed: ${errorMessages.join(', ')}`);
                }
                request.params = paramsResult.data;
            }
        } catch (error) {
            if (error instanceof ValidationError) {
                reply.status(400).send({
                    success: false,
                    error: error.message,
                    code: 'VALIDATION_ERROR',
                });
                return;
            }
            
            reply.status(400).send({
                success: false,
                error: 'Invalid request data',
                code: 'VALIDATION_ERROR',
            });
        }
    };
};

/**
 * Email validation utility
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Password strength validation
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Phone number validation utility
 */
export const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * UUID validation utility
 */
export const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

/**
 * Date validation utility
 */
export const isValidDate = (date: string | Date): boolean => {
    const parsedDate = new Date(date);
    return !Number.isNaN(parsedDate.getTime());
};
