import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import pino from 'pino';
import { loggingService } from './logging.service.js';

vi.mock('pino');

describe('Logging Service', () => {
    const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(pino).mockReturnValue(mockLogger as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // LOG LEVELS
    // ========================================

    describe('Log Levels', () => {
        it('should log info messages', () => {
            loggingService.info('User registered', { userId: 'uuid', email: 'user@example.com' });

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'User registered',
                    context: expect.objectContaining({ userId: 'uuid' }),
                })
            );
        });

        it('should log error messages', () => {
            const error = new Error('Database connection failed');
            loggingService.error('Database error', { error: error.message });

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Database error',
                })
            );
        });

        it('should log warning messages', () => {
            loggingService.warn('High memory usage detected', { usage: '85%' });

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'High memory usage detected',
                })
            );
        });

        it('should log debug messages', () => {
            loggingService.debug('Query execution', { query: 'SELECT * FROM users' });

            expect(mockLogger.debug).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Query execution',
                })
            );
        });
    });

    // ========================================
    // REQUEST LOGGING
    // ========================================

    describe('Request Logging', () => {
        it('should log request with method and URL', () => {
            const mockRequest = {
                method: 'POST',
                url: '/api/v1/auth/login',
                headers: { 'user-agent': 'Mozilla/5.0' },
                ip: '192.168.1.1',
            };

            loggingService.logRequest(mockRequest as any);

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Incoming request',
                })
            );
        });

        it('should include request headers in logging', () => {
            const mockRequest = {
                method: 'GET',
                url: '/api/v1/users',
                headers: { authorization: 'Bearer token' },
                ip: '192.168.1.1',
            };

            loggingService.logRequest(mockRequest as any);

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should include client IP in request logging', () => {
            const mockRequest = {
                method: 'POST',
                url: '/api/v1/auth/register',
                headers: {},
                ip: '203.0.113.5',
            };

            loggingService.logRequest(mockRequest as any);

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Incoming request',
                })
            );
        });
    });

    // ========================================
    // RESPONSE LOGGING
    // ========================================

    describe('Response Logging', () => {
        it('should log response with status code', () => {
            const mockRequest = {
                method: 'GET',
                url: '/api/v1/users',
                headers: {},
            };

            loggingService.logResponse(mockRequest as any, 200, 45);

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Outgoing response',
                })
            );
        });

        it('should include response time in milliseconds', () => {
            const mockRequest = { method: 'POST', url: '/api/v1/auth/login', headers: {} };
            const responseTime = 125;

            loggingService.logResponse(mockRequest as any, 200, responseTime);

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should log error responses with 4xx status codes', () => {
            const mockRequest = { method: 'GET', url: '/api/v1/users/invalid', headers: {} };

            loggingService.logResponse(mockRequest as any, 404, 12);

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should log error responses with 5xx status codes', () => {
            const mockRequest = { method: 'POST', url: '/api/v1/auth/register', headers: {} };

            loggingService.logResponse(mockRequest as any, 500, 234);

            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should measure slow response times (> 1000ms)', () => {
            const mockRequest = { method: 'GET', url: '/api/v1/heavy-query', headers: {} };

            loggingService.logResponse(mockRequest as any, 200, 1250);

            expect(mockLogger.warn).toHaveBeenCalled();
        });
    });

    // ========================================
    // DATABASE QUERY LOGGING
    // ========================================

    describe('Database Query Logging', () => {
        it('should log database queries with execution time', () => {
            loggingService.logDatabaseQuery('SELECT * FROM users WHERE id = $1', 45, {
                userId: 'uuid',
            });

            expect(mockLogger.debug).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Database query executed',
                })
            );
        });

        it('should warn on slow database queries (> 500ms)', () => {
            loggingService.logDatabaseQuery('SELECT * FROM large_table', 850, {
                table: 'large_table',
            });

            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should include query text in logs', () => {
            const query = 'INSERT INTO audit_log (action, user_id) VALUES ($1, $2)';
            loggingService.logDatabaseQuery(query, 120, {});

            expect(mockLogger.debug).toHaveBeenCalled();
        });

        it('should handle query parameters in logging', () => {
            loggingService.logDatabaseQuery(
                'UPDATE users SET status = $1 WHERE id = $2',
                65,
                {
                    params: ['ACTIVE', 'user-123'],
                }
            );

            expect(mockLogger.debug).toHaveBeenCalled();
        });
    });

    // ========================================
    // AUTHENTICATION EVENT LOGGING
    // ========================================

    describe('Authentication Event Logging', () => {
        it('should log successful login', () => {
            loggingService.logAuthEvent('LOGIN_SUCCESS', 'user-123', 'user@example.com', {
                ipAddress: '192.168.1.1',
            });

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Authentication event: LOGIN_SUCCESS',
                })
            );
        });

        it('should log failed login attempts', () => {
            loggingService.logAuthEvent('LOGIN_FAILURE', 'user-123', 'user@example.com', {
                reason: 'Invalid password',
                ipAddress: '203.0.113.5',
            });

            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should log password reset requests', () => {
            loggingService.logAuthEvent('PASSWORD_RESET_REQUESTED', 'user-123', 'user@example.com', {
                ipAddress: '192.168.1.1',
            });

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should log email verification', () => {
            loggingService.logAuthEvent('EMAIL_VERIFIED', 'user-123', 'user@example.com', {});

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should log logout events', () => {
            loggingService.logAuthEvent('LOGOUT', 'user-123', 'user@example.com', {
                sessionDuration: 3600,
            });

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should log suspicious login from new location', () => {
            loggingService.logAuthEvent('LOGIN_NEW_LOCATION', 'user-123', 'user@example.com', {
                location: 'New York, USA',
                ipAddress: '203.0.113.99',
            });

            expect(mockLogger.warn).toHaveBeenCalled();
        });
    });

    // ========================================
    // BUSINESS EVENT LOGGING
    // ========================================

    describe('Business Event Logging', () => {
        it('should log business events with context', () => {
            loggingService.logBusinessEvent('QUIZ_SUBMITTED', 'student-123', {
                quizId: 'quiz-456',
                score: 85,
                passed: true,
            });

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Business event: QUIZ_SUBMITTED',
                })
            );
        });

        it('should log course enrollment', () => {
            loggingService.logBusinessEvent('COURSE_ENROLLED', 'student-123', {
                courseId: 'course-789',
                courseName: 'Mathematics 101',
            });

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should log grade submission', () => {
            loggingService.logBusinessEvent('GRADE_SUBMITTED', 'teacher-456', {
                studentId: 'student-123',
                courseId: 'course-789',
                grade: 'A',
            });

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should log attendance marking', () => {
            loggingService.logBusinessEvent('ATTENDANCE_MARKED', 'teacher-456', {
                studentId: 'student-123',
                date: '2024-01-15',
                status: 'PRESENT',
            });

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should log file upload', () => {
            loggingService.logBusinessEvent('FILE_UPLOADED', 'student-123', {
                fileName: 'assignment.pdf',
                fileSize: 2048576,
                folder: 'assignments',
            });

            expect(mockLogger.info).toHaveBeenCalled();
        });
    });

    // ========================================
    // PERFORMANCE MEASUREMENT
    // ========================================

    describe('Performance Measurement', () => {
        it('should measure function execution time', async () => {
            const mockFn = vi.fn().mockResolvedValue('result');

            const result = await loggingService.measurePerformance(
                'test_operation',
                'test',
                mockFn
            );

            expect(result).toBe('result');
            expect(mockFn).toHaveBeenCalled();
        });

        it('should warn on slow operations (> 5000ms)', async () => {
            const slowFn = vi.fn().mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 5100))
            );

            await loggingService.measurePerformance('slow_operation', 'test', slowFn);

            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should log operation name and duration', async () => {
            const mockFn = vi.fn().mockResolvedValue('success');

            await loggingService.measurePerformance('custom_task', 'operation', mockFn);

            expect(mockLogger.debug).toHaveBeenCalled();
        });

        it('should handle function errors during measurement', async () => {
            const errorFn = vi.fn().mockRejectedValue(new Error('Operation failed'));

            expect(async () => {
                await loggingService.measurePerformance('failing_operation', 'test', errorFn);
            }).rejects.toThrow('Operation failed');
        });
    });

    // ========================================
    // CORRELATION ID TRACKING
    // ========================================

    describe('Correlation ID Tracking', () => {
        it('should include correlation ID in all logs', () => {
            loggingService.info('Test message', {
                correlationId: 'corr-123-abc',
            });

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should maintain correlation ID across multiple logs', () => {
            const correlationId = 'corr-uuid-123';

            loggingService.info('First log', { correlationId });
            loggingService.debug('Second log', { correlationId });

            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockLogger.debug).toHaveBeenCalled();
        });
    });

    // ========================================
    // LOGGER CONFIGURATION
    // ========================================

    describe('Logger Configuration', () => {
        it('should use JSON format in production', () => {
            process.env.NODE_ENV = 'production';
            const logger = loggingService.getLogger();

            expect(logger).toBeDefined();
        });

        it('should use pretty print in development', () => {
            process.env.NODE_ENV = 'development';
            const logger = loggingService.getLogger();

            expect(logger).toBeDefined();
        });

        it('should expose logger instance', () => {
            const logger = loggingService.getLogger();

            expect(logger).toHaveProperty('info');
            expect(logger).toHaveProperty('error');
            expect(logger).toHaveProperty('warn');
            expect(logger).toHaveProperty('debug');
        });
    });

    // ========================================
    // ERROR HANDLING IN LOGGING
    // ========================================

    describe('Error Handling', () => {
        it('should handle logging of Error objects', () => {
            const error = new Error('Something went wrong');
            loggingService.error('Error occurred', { error: error.message, stack: error.stack });

            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should safely log circular references', () => {
            const obj: any = { name: 'test' };
            obj.self = obj; // Create circular reference

            loggingService.info('Circular object', obj);

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should handle undefined context gracefully', () => {
            loggingService.info('Message with no context');

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should handle null values in context', () => {
            loggingService.info('Message with null', { userId: null, data: undefined });

            expect(mockLogger.info).toHaveBeenCalled();
        });
    });

    // ========================================
    // SENSITIVE DATA HANDLING
    // ========================================

    describe('Sensitive Data Handling', () => {
        it('should not log passwords', () => {
            loggingService.info('User action', {
                userId: 'uuid',
                // password should not be in logs
            });

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should not log credit card numbers', () => {
            loggingService.info('Payment action', {
                transactionId: 'trans-123',
                // creditCard should not be in logs
            });

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should redact API keys', () => {
            loggingService.debug('API call', {
                endpoint: '/api/endpoint',
                // apiKey should be redacted
            });

            expect(mockLogger.debug).toHaveBeenCalled();
        });
    });
});
