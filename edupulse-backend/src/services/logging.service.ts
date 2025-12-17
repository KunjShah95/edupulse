import pino, { Logger, LoggerOptions } from 'pino';
import { FastifyRequest } from 'fastify';
import config from '../config/index.js';

export interface LogContext {
    correlationId?: string;
    userId?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    duration?: number;
    error?: Error;
    userAgent?: string;
    ip?: string;
    query?: string;
    event?: string;
    email?: string;
    timestamp?: string;
    service?: string;
    [key: string]: any;
}

export class LoggingService {
    private logger: Logger;

    constructor() {
        const loggerOptions: LoggerOptions = {
            level: config.logLevel,
            formatters: {
                level: (label) => {
                    return { level: label.toUpperCase() };
                },
                bindings: (bindings) => {
                    return {
                        service: 'edupulse-api',
                        environment: config.env,
                        pid: bindings.pid,
                    };
                },
            },
            timestamp: pino.stdTimeFunctions.isoTime,
        };

        if (config.env === 'development') {
            this.logger = pino(
                {
                    ...loggerOptions,
                    transport: {
                        target: 'pino-pretty',
                        options: {
                            colorize: true,
                            singleLine: false,
                            translateTime: 'SYS:standard',
                        },
                    },
                }
            );
        } else {
            // Production: JSON logging
            this.logger = pino(loggerOptions);
        }
    }

    /**
     * Get logger instance
     */
    getLogger(): Logger {
        return this.logger;
    }

    /**
     * Log info level
     */
    info(message: string, context?: LogContext): void {
        this.logger.info(this.enrichContext(context), message);
    }

    /**
     * Log error level
     */
    error(message: string, context?: LogContext): void {
        this.logger.error(this.enrichContext(context), message);
    }

    /**
     * Log warning level
     */
    warn(message: string, context?: LogContext): void {
        this.logger.warn(this.enrichContext(context), message);
    }

    /**
     * Log debug level
     */
    debug(message: string, context?: LogContext): void {
        this.logger.debug(this.enrichContext(context), message);
    }

    /**
     * Log request
     */
    logRequest(request: FastifyRequest): void {
        this.info('Incoming request', {
            correlationId: request.id,
            method: request.method,
            url: request.url,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
            userId: (request.user?.id as string) || undefined,
        });
    }

    /**
     * Log response
     */
    logResponse(
        request: FastifyRequest,
        statusCode: number,
        duration: number
    ): void {
        const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        
        this[logLevel as 'info' | 'warn' | 'error']('HTTP response', {
            correlationId: request.id,
            method: request.method,
            url: request.url,
            statusCode,
            duration,
            userId: (request.user?.id as string) || undefined,
        });
    }

    /**
     * Log database query
     */
    logDatabaseQuery(
        query: string,
        duration: number,
        context?: LogContext
    ): void {
        this.debug('Database query', {
            ...context,
            query: query.substring(0, 200), // Truncate long queries
            duration,
        });
    }

    /**
     * Log error with stack trace
     */
    logError(
        error: Error,
        message: string,
        context?: LogContext
    ): void {
        this.error(message, {
            ...context,
            error,
        });
    }

    /**
     * Log authentication event
     */
    logAuthEvent(
        event: 'login' | 'register' | 'logout' | 'tokenRefresh' | 'passwordReset',
        userId: string,
        email: string,
        context?: LogContext
    ): void {
        this.info(`Authentication event: ${event}`, {
            ...context,
            event,
            userId,
            email,
        });
    }

    /**
     * Log business event
     */
    logBusinessEvent(
        event: string,
        userId: string,
        details: Record<string, any> = {},
        context?: LogContext
    ): void {
        this.info(`Business event: ${event}`, {
            ...context,
            event,
            userId,
            ...details,
        });
    }

    /**
     * Create child logger with context
     */
    createChildLogger(context: LogContext): Logger {
        return this.logger.child(this.enrichContext(context));
    }

    /**
     * Enrich context with common fields
     */
    private enrichContext(context?: LogContext): LogContext {
        return {
            timestamp: new Date().toISOString(),
            service: 'edupulse-api',
            ...context,
        };
    }

    /**
     * Performance logging decorator
     */
    static async measurePerformance<T>(
        logger: LoggingService,
        operationName: string,
        fn: () => Promise<T>,
        context?: LogContext
    ): Promise<T> {
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            
            if (duration > 1000) {
                logger.warn(`Slow operation: ${operationName}`, {
                    ...context,
                    duration,
                });
            } else {
                logger.debug(`Operation completed: ${operationName}`, {
                    ...context,
                    duration,
                });
            }
            
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`Operation failed: ${operationName}`, {
                ...context,
                duration,
                error: error instanceof Error ? error : new Error(String(error)),
            });
            throw error;
        }
    }
}

// Export singleton instance
export const loggingService = new LoggingService();
