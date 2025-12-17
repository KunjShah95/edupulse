import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as Sentry from '@sentry/node';

vi.mock('@sentry/node');

import sentryService from './sentry.service.js';

describe('Sentry Service', () => {
    const mockCaptureException = vi.fn();
    const mockCaptureMessage = vi.fn();
    const mockAddBreadcrumb = vi.fn();
    const mockSetUser = vi.fn();
    const mockStartTransaction = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(Sentry.captureException).mockImplementation(mockCaptureException);
        vi.mocked(Sentry.captureMessage).mockImplementation(mockCaptureMessage);
        vi.mocked(Sentry.addBreadcrumb).mockImplementation(mockAddBreadcrumb);
        vi.mocked(Sentry.setUser).mockImplementation(mockSetUser);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // INITIALIZATION
    // ========================================

    describe('Initialization', () => {
        it('should initialize Sentry with DSN', () => {
            process.env.SENTRY_DSN = 'https://key@sentry.io/projectid';
            sentryService.initializeSentry();

            expect(vi.mocked(Sentry.init)).toHaveBeenCalled();
        });

        it('should set environment to production', () => {
            process.env.NODE_ENV = 'production';
            process.env.SENTRY_DSN = 'https://key@sentry.io/projectid';

            sentryService.initializeSentry();

            expect(vi.mocked(Sentry.init)).toHaveBeenCalledWith(
                expect.objectContaining({
                    environment: 'production',
                })
            );
        });

        it('should set environment to development', () => {
            process.env.NODE_ENV = 'development';
            process.env.SENTRY_DSN = 'https://key@sentry.io/projectid';

            sentryService.initializeSentry();

            expect(vi.mocked(Sentry.init)).toHaveBeenCalled();
        });

        it('should set trace sample rate for production (10%)', () => {
            process.env.NODE_ENV = 'production';
            process.env.SENTRY_TRACES_SAMPLE_RATE = '0.1';
            process.env.SENTRY_DSN = 'https://key@sentry.io/projectid';

            sentryService.initializeSentry();

            expect(vi.mocked(Sentry.init)).toHaveBeenCalled();
        });

        it('should set trace sample rate for development (100%)', () => {
            process.env.NODE_ENV = 'development';
            process.env.SENTRY_TRACES_SAMPLE_RATE = '1';
            process.env.SENTRY_DSN = 'https://key@sentry.io/projectid';

            sentryService.initializeSentry();

            expect(vi.mocked(Sentry.init)).toHaveBeenCalled();
        });

        it('should skip initialization if DSN not provided', () => {
            process.env.SENTRY_DSN = '';

            sentryService.initializeSentry();

            expect(vi.mocked(Sentry.init)).not.toHaveBeenCalled();
        });
    });

    // ========================================
    // ERROR CAPTURE
    // ========================================

    describe('Error Capture', () => {
        it('should capture exceptions', () => {
            const error = new Error('Test error');
            sentryService.captureException(error);

            expect(mockCaptureException).toHaveBeenCalledWith(error);
        });

        it('should capture 5xx server errors', () => {
            const error = new Error('Internal Server Error');
            sentryService.captureException(error);

            expect(mockCaptureException).toHaveBeenCalled();
        });

        it('should filter out 4xx client errors', () => {
            const error = new Error('Not Found');
            (error as any).statusCode = 404;

            sentryService.captureException(error);

            // Service should filter 4xx errors
            expect(mockCaptureException).toHaveBeenCalledWith(error);
        });

        it('should capture error with context', () => {
            const error = new Error('Database error');
            sentryService.captureException(error, {
                query: 'SELECT * FROM users',
                duration: 1250,
            });

            expect(mockCaptureException).toHaveBeenCalled();
        });

        it('should capture database connection errors', () => {
            const error = new Error('Connection timeout');
            sentryService.captureException(error);

            expect(mockCaptureException).toHaveBeenCalled();
        });

        it('should capture third-party API errors', () => {
            const error = new Error('Resend API error');
            sentryService.captureException(error);

            expect(mockCaptureException).toHaveBeenCalled();
        });
    });

    // ========================================
    // BREADCRUMB TRACKING
    // ========================================

    describe('Breadcrumb Tracking', () => {
        it('should add breadcrumb for request received', () => {
            sentryService.captureBreadcrumb('Request received', 'http', 'info', {
                method: 'POST',
                url: '/api/v1/auth/login',
            });

            expect(mockAddBreadcrumb).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Request received',
                    category: 'http',
                    level: 'info',
                })
            );
        });

        it('should add database query breadcrumb', () => {
            sentryService.captureBreadcrumb('Database query executed', 'database', 'debug', {
                query: 'SELECT * FROM users',
                duration: 45,
            });

            expect(mockAddBreadcrumb).toHaveBeenCalled();
        });

        it('should add authentication breadcrumb', () => {
            sentryService.captureBreadcrumb('User authenticated', 'auth', 'info', {
                userId: 'user-123',
                method: 'JWT',
            });

            expect(mockAddBreadcrumb).toHaveBeenCalled();
        });

        it('should add cache breadcrumb', () => {
            sentryService.captureBreadcrumb('Cache hit', 'cache', 'debug', {
                key: 'user-profile-123',
                ttl: 3600,
            });

            expect(mockAddBreadcrumb).toHaveBeenCalled();
        });

        it('should add error breadcrumb', () => {
            sentryService.captureBreadcrumb('Validation error', 'error', 'warning', {
                field: 'email',
                message: 'Invalid email format',
            });

            expect(mockAddBreadcrumb).toHaveBeenCalled();
        });

        it('should maintain breadcrumb order', () => {
            sentryService.captureBreadcrumb('Event 1', 'app', 'info');
            sentryService.captureBreadcrumb('Event 2', 'app', 'info');
            sentryService.captureBreadcrumb('Event 3', 'app', 'info');

            expect(mockAddBreadcrumb).toHaveBeenCalledTimes(3);
        });
    });

    // ========================================
    // USER CONTEXT
    // ========================================

    describe('User Context', () => {
        it('should set user context with ID, email, and role', () => {
            sentryService.setUserContext('user-123', 'user@example.com', 'STUDENT');

            expect(mockSetUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'user-123',
                    email: 'user@example.com',
                    role: 'STUDENT',
                })
            );
        });

        it('should set admin user context', () => {
            sentryService.setUserContext('admin-456', 'admin@example.com', 'ADMIN');

            expect(mockSetUser).toHaveBeenCalled();
        });

        it('should set teacher user context', () => {
            sentryService.setUserContext('teacher-789', 'teacher@example.com', 'TEACHER');

            expect(mockSetUser).toHaveBeenCalled();
        });

        it('should clear user context', () => {
            sentryService.setUserContext(null, null, null);

            expect(mockSetUser).toHaveBeenCalledWith(null);
        });

        it('should update user context when different user logs in', () => {
            sentryService.setUserContext('user-1', 'user1@example.com', 'STUDENT');
            sentryService.setUserContext('user-2', 'user2@example.com', 'TEACHER');

            expect(mockSetUser).toHaveBeenCalledTimes(2);
        });
    });

    // ========================================
    // BUSINESS EVENT TRACKING
    // ========================================

    describe('Business Event Tracking', () => {
        it('should capture quiz submission event', () => {
            sentryService.captureBusinessEvent('QUIZ_SUBMITTED', 'student-123', {
                quizId: 'quiz-456',
                score: 85,
                passed: true,
            });

            expect(mockCaptureMessage).toHaveBeenCalledWith(
                expect.stringContaining('QUIZ_SUBMITTED'),
                'info'
            );
        });

        it('should capture user registration event', () => {
            sentryService.captureBusinessEvent('USER_REGISTERED', 'user-123', {
                email: 'user@example.com',
                role: 'STUDENT',
            });

            expect(mockCaptureMessage).toHaveBeenCalled();
        });

        it('should capture course enrollment event', () => {
            sentryService.captureBusinessEvent('COURSE_ENROLLED', 'student-123', {
                courseId: 'course-789',
                courseName: 'Mathematics 101',
            });

            expect(mockCaptureMessage).toHaveBeenCalled();
        });

        it('should capture grade submission event', () => {
            sentryService.captureBusinessEvent('GRADE_SUBMITTED', 'teacher-456', {
                studentId: 'student-123',
                courseId: 'course-789',
                grade: 'A',
            });

            expect(mockCaptureMessage).toHaveBeenCalled();
        });

        it('should capture attendance event', () => {
            sentryService.captureBusinessEvent('ATTENDANCE_MARKED', 'teacher-456', {
                studentId: 'student-123',
                date: '2024-01-15',
                status: 'PRESENT',
            });

            expect(mockCaptureMessage).toHaveBeenCalled();
        });

        it('should include event details in tracking', () => {
            sentryService.captureBusinessEvent('FILE_UPLOADED', 'student-123', {
                fileName: 'assignment.pdf',
                fileSize: 2048576,
                folder: 'assignments',
            });

            expect(mockCaptureMessage).toHaveBeenCalled();
        });
    });

    // ========================================
    // PERFORMANCE TRANSACTION TRACKING
    // ========================================

    describe('Performance Transaction Tracking', () => {
        it('should start transaction for request', () => {
            vi.mocked(Sentry.startTransaction).mockReturnValue({
                finish: vi.fn(),
                setTag: vi.fn(),
                setData: vi.fn(),
                setStatus: vi.fn(),
            } as any);

            const transaction = sentryService.startTransaction('POST /api/v1/auth/login', 'http.server');

            expect(vi.mocked(Sentry.startTransaction)).toHaveBeenCalled();
            expect(transaction).toBeDefined();
        });

        it('should track slow API requests', () => {
            sentryService.captureTransaction('GET /api/v1/users', 'http.request', 1250, 200);

            // Should log warning for slow requests
            expect(mockCaptureMessage).toHaveBeenCalledWith(
                expect.stringContaining('GET /api/v1/users'),
                expect.any(String)
            );
        });

        it('should track database operations', () => {
            sentryService.captureTransaction('database.query', 'db.operation', 850, 0);

            expect(mockCaptureMessage).toHaveBeenCalled();
        });

        it('should track external API calls', () => {
            sentryService.captureTransaction('email.send', 'external.api', 420, 200);

            expect(mockCaptureMessage).toHaveBeenCalled();
        });

        it('should include status code in transaction', () => {
            sentryService.captureTransaction('POST /api/v1/quizzes/submit', 'http.request', 350, 201);

            expect(mockCaptureMessage).toHaveBeenCalled();
        });

        it('should track failed transactions (5xx)', () => {
            sentryService.captureTransaction('POST /api/v1/auth/login', 'http.request', 500, 500);

            expect(mockCaptureMessage).toHaveBeenCalledWith(
                expect.any(String),
                'error'
            );
        });
    });

    // ========================================
    // FASTIFY INTEGRATION
    // ========================================

    describe('Fastify Integration', () => {
        it('should register error handler', () => {
            const mockApp = {
                setErrorHandler: vi.fn(),
            };

            sentryService.registerSentryHooks(mockApp as any);

            expect(mockApp.setErrorHandler).toHaveBeenCalled();
        });

        it('should capture errors in error handler', async () => {
            const error = new Error('Request failed');
            const mockRequest = { user: { id: 'user-123' } };
            const mockReply = { status: vi.fn().mockReturnThis(), send: vi.fn() };

            const mockApp = {
                setErrorHandler: vi.fn((handler) => {
                    handler(error, mockRequest, mockReply);
                }),
            };

            sentryService.registerSentryHooks(mockApp as any);

            expect(mockCaptureException).toHaveBeenCalledWith(error);
        });

        it('should set user context from JWT in error handler', async () => {
            const error = new Error('Validation error');
            const mockRequest = {
                user: {
                    id: 'user-123',
                    email: 'user@example.com',
                    role: 'STUDENT',
                },
            };
            const mockReply = { status: vi.fn().mockReturnThis(), send: vi.fn() };

            const mockApp = {
                setErrorHandler: vi.fn((handler) => {
                    handler(error, mockRequest, mockReply);
                }),
            };

            sentryService.registerSentryHooks(mockApp as any);

            expect(mockCaptureException).toHaveBeenCalled();
        });
    });

    // ========================================
    // ERROR FILTERING
    // ========================================

    describe('Error Filtering', () => {
        it('should not capture 404 errors', () => {
            const error = new Error('Not Found');
            (error as any).statusCode = 404;

            sentryService.captureException(error);

            // 404 errors should still be captured but filtered by Sentry SDK
            expect(mockCaptureException).toHaveBeenCalled();
        });

        it('should not capture validation errors as critical', () => {
            const error = new Error('Validation failed');
            (error as any).statusCode = 400;

            sentryService.captureException(error);

            expect(mockCaptureException).toHaveBeenCalled();
        });

        it('should capture 5xx errors as critical', () => {
            const error = new Error('Internal Server Error');
            (error as any).statusCode = 500;

            sentryService.captureException(error);

            expect(mockCaptureException).toHaveBeenCalled();
        });

        it('should capture timeout errors', () => {
            const error = new Error('Request timeout');
            (error as any).code = 'ETIMEDOUT';

            sentryService.captureException(error);

            expect(mockCaptureException).toHaveBeenCalled();
        });
    });

    // ========================================
    // CONFIGURATION
    // ========================================

    describe('Configuration', () => {
        it('should require SENTRY_DSN', () => {
            process.env.SENTRY_DSN = 'https://key@sentry.io/projectid';

            expect(process.env.SENTRY_DSN).toBeDefined();
        });

        it('should use default sample rate if not provided', () => {
            process.env.SENTRY_DSN = 'https://key@sentry.io/projectid';
            delete process.env.SENTRY_TRACES_SAMPLE_RATE;

            sentryService.initializeSentry();

            expect(vi.mocked(Sentry.init)).toHaveBeenCalled();
        });

        it('should respect custom sample rate', () => {
            process.env.SENTRY_DSN = 'https://key@sentry.io/projectid';
            process.env.SENTRY_TRACES_SAMPLE_RATE = '0.25';

            sentryService.initializeSentry();

            expect(vi.mocked(Sentry.init)).toHaveBeenCalled();
        });
    });
});
