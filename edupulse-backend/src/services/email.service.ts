import { Resend } from 'resend';
import config from '../config/index.js';

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
}

export interface PasswordResetEmailData {
    email: string;
    resetToken: string;
    resetUrl: string;
}

export interface EmailVerificationData {
    email: string;
    verificationToken: string;
    verificationUrl: string;
}

export interface NotificationEmailData {
    to: string;
    subject: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
}

export class EmailService {
    private resend: Resend;

    constructor() {
        this.resend = new Resend(config.email.resendApiKey);
    }

    /**
     * Send generic email
     */
    async sendEmail(options: EmailOptions): Promise<{ id: string } | null> {
        if (!config.email.resendApiKey) {
            console.warn('Resend API key not configured. Email not sent.');
            return null;
        }

        try {
            const response = await this.resend.emails.send({
                from: config.email.from,
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
                html: options.html,
                ...(options.text && { text: options.text }),
                ...(options.replyTo && { replyTo: options.replyTo }),
            });

            if (response.error) {
                throw new Error(response.error.message);
            }

            return { id: response.data?.id || '' };
        } catch (error: any) {
            console.error('Email sending failed:', error.message);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ id: string } | null> {
        const html = this.getPasswordResetTemplate(data.resetUrl);
        
        return this.sendEmail({
            to: data.email,
            subject: 'Reset Your EduPulse Password',
            html,
            text: `Click here to reset your password: ${data.resetUrl}`,
        });
    }

    /**
     * Send email verification email
     */
    async sendVerificationEmail(data: EmailVerificationData): Promise<{ id: string } | null> {
        const html = this.getVerificationTemplate(data.verificationUrl);
        
        return this.sendEmail({
            to: data.email,
            subject: 'Verify Your EduPulse Email Address',
            html,
            text: `Click here to verify your email: ${data.verificationUrl}`,
        });
    }

    /**
     * Send notification email
     */
    async sendNotificationEmail(data: NotificationEmailData): Promise<{ id: string } | null> {
        const html = this.getNotificationTemplate(data);
        
        return this.sendEmail({
            to: data.to,
            subject: data.subject,
            html,
        });
    }

    /**
     * Send welcome email to new user
     */
    async sendWelcomeEmail(email: string, userName: string): Promise<{ id: string } | null> {
        const html = this.getWelcomeTemplate(userName);
        
        return this.sendEmail({
            to: email,
            subject: 'Welcome to EduPulse!',
            html,
        });
    }

    /**
     * Send grade notification email
     */
    async sendGradeNotificationEmail(
        to: string,
        studentName: string,
        courseName: string,
        grade: number,
        courseDashboardUrl: string
    ): Promise<{ id: string } | null> {
        const html = this.getGradeNotificationTemplate(
            studentName,
            courseName,
            grade,
            courseDashboardUrl
        );
        
        return this.sendEmail({
            to,
            subject: `New Grade Posted: ${courseName}`,
            html,
        });
    }

    /**
     * Send attendance notification email
     */
    async sendAttendanceNotificationEmail(
        to: string,
        studentName: string,
        attendancePercentage: number,
        dashboardUrl: string
    ): Promise<{ id: string } | null> {
        const html = this.getAttendanceNotificationTemplate(
            studentName,
            attendancePercentage,
            dashboardUrl
        );
        
        return this.sendEmail({
            to,
            subject: 'Attendance Update',
            html,
        });
    }

    /**
     * Send assignment/lesson notification
     */
    async sendAssignmentNotificationEmail(
        to: string,
        studentName: string,
        courseName: string,
        assignmentTitle: string,
        dueDate: string,
        courseUrl: string
    ): Promise<{ id: string } | null> {
        const html = this.getAssignmentNotificationTemplate(
            studentName,
            courseName,
            assignmentTitle,
            dueDate,
            courseUrl
        );
        
        return this.sendEmail({
            to,
            subject: `New Assignment: ${assignmentTitle}`,
            html,
        });
    }

    // ========== EMAIL TEMPLATES ==========

    private getPasswordResetTemplate(resetUrl: string): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                        .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Reset Your Password</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>We received a request to reset your password. Click the button below to create a new password.</p>
                            <a href="${resetUrl}" class="button">Reset Password</a>
                            <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
                            <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
                            <div class="footer">
                                <p>&copy; 2024 EduPulse. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    private getVerificationTemplate(verificationUrl: string): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                        .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Verify Your Email</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>Welcome to EduPulse! Please verify your email address to complete your registration.</p>
                            <a href="${verificationUrl}" class="button">Verify Email</a>
                            <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
                            <div class="footer">
                                <p>&copy; 2024 EduPulse. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    private getWelcomeTemplate(userName: string): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to EduPulse!</h1>
                        </div>
                        <div class="content">
                            <p>Hello ${userName},</p>
                            <p>Thank you for joining EduPulse! We're excited to have you on board.</p>
                            <p>You can now access all the features of our school management system, including:</p>
                            <ul>
                                <li>Track your academic progress</li>
                                <li>Access course materials</li>
                                <li>View your schedule and attendance</li>
                                <li>Manage your library books</li>
                            </ul>
                            <p>If you have any questions, feel free to reach out to our support team.</p>
                            <div class="footer">
                                <p>&copy; 2024 EduPulse. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    private getNotificationTemplate(
        data: NotificationEmailData
    ): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                        .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>${data.subject}</h1>
                        </div>
                        <div class="content">
                            <p>${data.message}</p>
                            ${data.actionUrl && data.actionText ? `<a href="${data.actionUrl}" class="button">${data.actionText}</a>` : ''}
                            <div class="footer">
                                <p>&copy; 2024 EduPulse. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    private getGradeNotificationTemplate(
        studentName: string,
        courseName: string,
        grade: number,
        courseUrl: string
    ): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                        .grade-box { background: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; border-left: 4px solid #667eea; }
                        .grade-box .grade { font-size: 36px; font-weight: bold; color: #667eea; }
                        .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Grade Posted</h1>
                        </div>
                        <div class="content">
                            <p>Hello ${studentName},</p>
                            <p>Your instructor has posted a new grade for <strong>${courseName}</strong>.</p>
                            <div class="grade-box">
                                <p>Your Grade</p>
                                <div class="grade">${grade}%</div>
                            </div>
                            <a href="${courseUrl}" class="button">View Course</a>
                            <div class="footer">
                                <p>&copy; 2024 EduPulse. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    private getAttendanceNotificationTemplate(
        studentName: string,
        attendancePercentage: number,
        dashboardUrl: string
    ): string {
        const statusColor = attendancePercentage >= 75 ? '#28a745' : attendancePercentage >= 60 ? '#ffc107' : '#dc3545';
        const statusText = attendancePercentage >= 75 ? 'Good' : attendancePercentage >= 60 ? 'Needs Improvement' : 'Critical';

        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                        .status-box { background: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; border-left: 4px solid ${statusColor}; }
                        .status-box .percentage { font-size: 36px; font-weight: bold; color: ${statusColor}; }
                        .status-box .status-text { color: ${statusColor}; font-weight: bold; }
                        .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Attendance Update</h1>
                        </div>
                        <div class="content">
                            <p>Hello ${studentName},</p>
                            <p>Here's your latest attendance information:</p>
                            <div class="status-box">
                                <p>Attendance Rate</p>
                                <div class="percentage">${attendancePercentage}%</div>
                                <p class="status-text">${statusText}</p>
                            </div>
                            <a href="${dashboardUrl}" class="button">View Dashboard</a>
                            <div class="footer">
                                <p>&copy; 2024 EduPulse. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    private getAssignmentNotificationTemplate(
        studentName: string,
        courseName: string,
        assignmentTitle: string,
        dueDate: string,
        courseUrl: string
    ): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                        .assignment-box { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
                        .assignment-box h3 { margin-top: 0; color: #333; }
                        .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>New Assignment</h1>
                        </div>
                        <div class="content">
                            <p>Hello ${studentName},</p>
                            <p>You have a new assignment in <strong>${courseName}</strong>.</p>
                            <div class="assignment-box">
                                <h3>${assignmentTitle}</h3>
                                <p><strong>Due Date:</strong> ${dueDate}</p>
                                <p><strong>Course:</strong> ${courseName}</p>
                            </div>
                            <a href="${courseUrl}" class="button">View Assignment</a>
                            <div class="footer">
                                <p>&copy; 2024 EduPulse. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }
}

// Export singleton instance
export const emailService = new EmailService();
