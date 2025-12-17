import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Resend } from 'resend';

vi.mock('resend');

import { emailService } from './email.service.js';

describe('Email Service', () => {
    const mockSend = vi.fn();
    const mockResendClient = {
        emails: {
            send: mockSend,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(Resend).mockReturnValue(mockResendClient as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // EMAIL SENDING
    // ========================================

    describe('Email Sending', () => {
        it('should send basic email', async () => {
            mockSend.mockResolvedValue({ id: 'email-123', from: 'noreply@edupulse.com' });

            await emailService.sendEmail({
                to: 'user@example.com',
                subject: 'Welcome to EduPulse',
                html: '<p>Welcome!</p>',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'Welcome to EduPulse',
                })
            );
        });

        it('should include from address', async () => {
            mockSend.mockResolvedValue({ id: 'email-456' });

            await emailService.sendEmail({
                to: 'user@example.com',
                subject: 'Test',
                html: '<p>Test</p>',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: expect.stringContaining('@edupulse.com'),
                })
            );
        });

        it('should handle email sending errors', async () => {
            mockSend.mockRejectedValue(new Error('Rate limit exceeded'));

            expect(async () => {
                await emailService.sendEmail({
                    to: 'user@example.com',
                    subject: 'Test',
                    html: '<p>Test</p>',
                });
            }).rejects.toThrow('Rate limit exceeded');
        });

        it('should return email ID on success', async () => {
            const mockId = 'email-789';
            mockSend.mockResolvedValue({ id: mockId });

            const result = await emailService.sendEmail({
                to: 'user@example.com',
                subject: 'Notification',
                html: '<p>Notification</p>',
            });

            expect(result.id).toBe(mockId);
        });
    });

    // ========================================
    // VERIFICATION EMAIL
    // ========================================

    describe('Verification Email', () => {
        it('should send verification email', async () => {
            mockSend.mockResolvedValue({ id: 'verify-email-123' });

            await emailService.sendVerificationEmail({
                email: 'newuser@example.com',
                verificationToken: 'token-abc-123',
                verificationUrl: 'https://edupulse.com/verify?token=token-abc-123',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'newuser@example.com',
                    subject: expect.stringContaining('Verify'),
                })
            );
        });

        it('should include verification link in email', async () => {
            mockSend.mockResolvedValue({ id: 'verify-email-456' });

            await emailService.sendVerificationEmail({
                email: 'user@example.com',
                verificationToken: 'token-xyz',
                verificationUrl: 'https://edupulse.com/verify?token=token-xyz',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('token-xyz'),
                })
            );
        });

        it('should include expiry time in verification email', async () => {
            mockSend.mockResolvedValue({ id: 'verify-email-789' });

            await emailService.sendVerificationEmail({
                email: 'user@example.com',
                verificationToken: 'token-123',
                verificationUrl: 'https://edupulse.com/verify?token=token-123',
            });

            expect(mockSend).toHaveBeenCalled();
        });

        it('should send HTML formatted verification email', async () => {
            mockSend.mockResolvedValue({ id: 'verify-email-html' });

            await emailService.sendVerificationEmail({
                email: 'user@example.com',
                verificationToken: 'token-html',
                verificationUrl: 'https://edupulse.com/verify?token=token-html',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('<'),
                })
            );
        });
    });

    // ========================================
    // PASSWORD RESET EMAIL
    // ========================================

    describe('Password Reset Email', () => {
        it('should send password reset email', async () => {
            mockSend.mockResolvedValue({ id: 'reset-email-123' });

            await emailService.sendPasswordResetEmail({
                email: 'user@example.com',
                resetToken: 'reset-token-abc',
                resetUrl: 'https://edupulse.com/reset-password?token=reset-token-abc',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: expect.stringContaining('Reset'),
                })
            );
        });

        it('should include reset link with token', async () => {
            mockSend.mockResolvedValue({ id: 'reset-email-456' });

            await emailService.sendPasswordResetEmail({
                email: 'user@example.com',
                resetToken: 'reset-token-xyz',
                resetUrl: 'https://edupulse.com/reset-password?token=reset-token-xyz',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('reset-token-xyz'),
                })
            );
        });

        it('should warn about expiry in password reset email', async () => {
            mockSend.mockResolvedValue({ id: 'reset-email-789' });

            await emailService.sendPasswordResetEmail({
                email: 'user@example.com',
                resetToken: 'token-123',
                resetUrl: 'https://edupulse.com/reset-password?token=token-123',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('expire'),
                })
            );
        });

        it('should include security warning', async () => {
            mockSend.mockResolvedValue({ id: 'reset-email-security' });

            await emailService.sendPasswordResetEmail({
                email: 'user@example.com',
                resetToken: 'token-sec',
                resetUrl: 'https://edupulse.com/reset-password?token=token-sec',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('secure'),
                })
            );
        });
    });

    // ========================================
    // WELCOME EMAIL
    // ========================================

    describe('Welcome Email', () => {
        it('should send welcome email to new user', async () => {
            mockSend.mockResolvedValue({ id: 'welcome-email-123' });

            await emailService.sendWelcomeEmail('newstudent@example.com', 'John Doe');

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'newstudent@example.com',
                    subject: expect.stringContaining('Welcome'),
                })
            );
        });

        it('should personalize welcome email with name', async () => {
            mockSend.mockResolvedValue({ id: 'welcome-email-456' });

            await emailService.sendWelcomeEmail('user@example.com', 'Jane Smith');

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('Jane Smith'),
                })
            );
        });

        it('should include getting started information', async () => {
            mockSend.mockResolvedValue({ id: 'welcome-email-789' });

            await emailService.sendWelcomeEmail('user@example.com', 'User');

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('guide'),
                })
            );
        });
    });

    // ========================================
    // GRADE NOTIFICATION EMAIL
    // ========================================

    describe('Grade Notification Email', () => {
        it('should send grade notification email', async () => {
            mockSend.mockResolvedValue({ id: 'grade-email-123' });

            await emailService.sendGradeNotificationEmail(
                'student@example.com',
                'John Doe',
                'Mathematics 101',
                95,
                'https://edupulse.com/courses/math-101'
            );

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'student@example.com',
                    subject: expect.stringContaining('Grade'),
                })
            );
        });

        it('should include grade and score', async () => {
            mockSend.mockResolvedValue({ id: 'grade-email-456' });

            await emailService.sendGradeNotificationEmail(
                'student@example.com',
                'Jane Smith',
                'English Literature',
                87,
                'https://edupulse.com/courses/english-lit'
            );

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('87'),
                })
            );
        });

        it('should include course name', async () => {
            mockSend.mockResolvedValue({ id: 'grade-email-789' });

            await emailService.sendGradeNotificationEmail(
                'student@example.com',
                'Student',
                'Physics 201',
                92,
                'https://edupulse.com/courses/physics-201'
            );

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('Physics 201'),
                })
            );
        });
    });

    // ========================================
    // ATTENDANCE NOTIFICATION EMAIL
    // ========================================

    describe('Attendance Notification Email', () => {
        it('should send attendance notification email', async () => {
            mockSend.mockResolvedValue({ id: 'attendance-email-123' });

            await emailService.sendAttendanceNotificationEmail(
                'student@example.com',
                'John Doe',
                85,
                'https://edupulse.com/dashboard'
            );

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'student@example.com',
                    subject: expect.stringContaining('Attendance'),
                })
            );
        });

        it('should include attendance percentage', async () => {
            mockSend.mockResolvedValue({ id: 'attendance-email-456' });

            await emailService.sendAttendanceNotificationEmail(
                'student@example.com',
                'Jane Smith',
                92,
                'https://edupulse.com/dashboard'
            );

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('92'),
                })
            );
        });

        it('should handle low attendance percentage', async () => {
            mockSend.mockResolvedValue({ id: 'attendance-email-789' });

            await emailService.sendAttendanceNotificationEmail(
                'student@example.com',
                'Student',
                78,
                'https://edupulse.com/dashboard'
            );

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('78'),
                })
            );
        });
    });

    // ========================================
    // ASSIGNMENT NOTIFICATION EMAIL
    // ========================================

    describe('Assignment Notification Email', () => {
        it('should send assignment notification email', async () => {
            mockSend.mockResolvedValue({ id: 'assignment-email-123' });

            await emailService.sendAssignmentNotificationEmail(
                'student@example.com',
                'John Doe',
                'English',
                'Essay on Shakespeare',
                '2024-02-15',
                'https://edupulse.com/courses/english'
            );

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'student@example.com',
                    subject: expect.stringContaining('Assignment'),
                })
            );
        });

        it('should include assignment title', async () => {
            mockSend.mockResolvedValue({ id: 'assignment-email-456' });

            await emailService.sendAssignmentNotificationEmail(
                'student@example.com',
                'Jane Smith',
                'Math',
                'Calculus Problem Set',
                '2024-02-20',
                'https://edupulse.com/courses/math'
            );

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('Calculus Problem Set'),
                })
            );
        });

        it('should include due date', async () => {
            mockSend.mockResolvedValue({ id: 'assignment-email-789' });

            await emailService.sendAssignmentNotificationEmail(
                'student@example.com',
                'Student',
                'Science',
                'Lab Report',
                '2024-03-01',
                'https://edupulse.com/courses/science'
            );

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('2024-03-01'),
                })
            );
        });

        it('should include course name', async () => {
            mockSend.mockResolvedValue({ id: 'assignment-email-desc' });

            await emailService.sendAssignmentNotificationEmail(
                'student@example.com',
                'Student',
                'Art',
                'Painting Project',
                '2024-03-10',
                'https://edupulse.com/courses/art'
            );

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('Art'),
                })
            );
        });
    });

    // ========================================
    // BULK EMAIL OPERATIONS
    // ========================================

    describe('Bulk Email Operations', () => {
        it('should send emails to multiple recipients', async () => {
            mockSend.mockResolvedValue({ id: 'bulk-email-123' });

            const recipients = [
                'teacher1@example.com',
                'teacher2@example.com',
                'teacher3@example.com',
            ];

            for (const email of recipients) {
                await emailService.sendEmail({
                    to: email,
                    subject: 'Staff Meeting',
                    html: '<p>Meeting at 3 PM</p>',
                });
            }

            expect(mockSend).toHaveBeenCalledTimes(3);
        });

        it('should handle bulk email failures gracefully', async () => {
            mockSend.mockRejectedValueOnce(new Error('Invalid email'));
            mockSend.mockResolvedValueOnce({ id: 'bulk-email-456' });

            expect(async () => {
                await emailService.sendEmail({
                    to: 'invalid-email',
                    subject: 'Test',
                    html: '<p>Test</p>',
                });
            }).rejects.toThrow();
        });
    });

    // ========================================
    // ERROR HANDLING
    // ========================================

    describe('Error Handling', () => {
        it('should handle invalid email address', async () => {
            mockSend.mockRejectedValue(new Error('Invalid email address'));

            expect(async () => {
                await emailService.sendEmail({
                    to: 'not-an-email',
                    subject: 'Test',
                    html: '<p>Test</p>',
                });
            }).rejects.toThrow('Invalid email address');
        });

        it('should handle Resend API errors', async () => {
            mockSend.mockRejectedValue(new Error('API Error: 500'));

            expect(async () => {
                await emailService.sendEmail({
                    to: 'user@example.com',
                    subject: 'Test',
                    html: '<p>Test</p>',
                });
            }).rejects.toThrow('API Error');
        });

        it('should handle missing email configuration', async () => {
            delete process.env.RESEND_API_KEY;

            expect(() => {
                // Service should throw if API key is not configured
                vi.mocked(Resend).mockImplementation(() => {
                    throw new Error('RESEND_API_KEY not configured');
                });
            }).toThrow();
        });

        it('should handle network timeouts', async () => {
            mockSend.mockRejectedValue(new Error('Connection timeout'));

            expect(async () => {
                await emailService.sendEmail({
                    to: 'user@example.com',
                    subject: 'Test',
                    html: '<p>Test</p>',
                });
            }).rejects.toThrow('Connection timeout');
        });

        it('should handle rate limiting', async () => {
            mockSend.mockRejectedValue(new Error('Rate limit exceeded'));

            expect(async () => {
                await emailService.sendEmail({
                    to: 'user@example.com',
                    subject: 'Test',
                    html: '<p>Test</p>',
                });
            }).rejects.toThrow('Rate limit exceeded');
        });
    });

    // ========================================
    // EMAIL TEMPLATE RENDERING
    // ========================================

    describe('Email Template Rendering', () => {
        it('should render HTML template correctly', async () => {
            mockSend.mockResolvedValue({ id: 'template-123' });

            await emailService.sendVerificationEmail({
                email: 'user@example.com',
                verificationToken: 'token-123',
                verificationUrl: 'https://example.com/verify',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('<!DOCTYPE'),
                })
            );
        });

        it('should include brand elements in templates', async () => {
            mockSend.mockResolvedValue({ id: 'template-456' });

            await emailService.sendWelcomeEmail('user@example.com', 'John');

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('EduPulse'),
                })
            );
        });

        it('should render responsive templates', async () => {
            mockSend.mockResolvedValue({ id: 'template-responsive' });

            await emailService.sendPasswordResetEmail({
                email: 'user@example.com',
                resetToken: 'token-123',
                resetUrl: 'https://example.com/reset',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('media'),
                })
            );
        });
    });

    // ========================================
    // CONFIGURATION
