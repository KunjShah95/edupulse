import { PrismaClient } from '@prisma/client';
import { 
    PaginationOptions, 
    PaginationResult, 
    sanitizePaginationOptions,
    formatPaginationResult,
    createSearchWhereClause
} from '../../utils/pagination.util.js';
import { 
    hashPassword, 
    verifyPassword, 
    isValidEmail,
    validatePasswordStrength 
} from '../../utils/hash.util.js';
import { 
    AppError, 
    NotFoundError, 
    ConflictError, 
    BadRequestError,
    ValidationError 
} from '../../utils/error.util.js';
import { generateVerificationToken, hashData } from '../../utils/hash.util.js';

const prisma = new PrismaClient();

// DTOs
export interface CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT';
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
    address?: string;
    avatar?: string;
}

export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
    address?: string;
    avatar?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
}

export interface UserQueryOptions extends PaginationOptions {
    search?: string;
    role?: string;
    status?: string;
    emailVerified?: boolean;
}

// Service class
export class UsersService {
    /**
     * Create a new user
     */
    async create(createUserDto: CreateUserDto): Promise<any> {
        // Validate email format
        if (!isValidEmail(createUserDto.email)) {
            throw new ValidationError('Invalid email format');
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(createUserDto.password);
        if (!passwordValidation.isValid) {
            throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: createUserDto.email }
        });

        if (existingUser) {
            throw new ConflictError('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await hashPassword(createUserDto.password);

        // Generate email verification token
        const emailVerifyToken = generateVerificationToken();
        const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        try {
            const user = await prisma.user.create({
                data: {
                    ...createUserDto,
                    password: hashedPassword,
                    emailVerifyToken: await hashData(emailVerifyToken),
                    emailVerifyExpiry,
                    status: 'PENDING_VERIFICATION',
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    avatar: true,
                    phone: true,
                    dateOfBirth: true,
                    gender: true,
                    address: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return {
                user,
                emailVerifyToken, // In real app, this would be sent via email
            };
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('User with this email already exists');
            }
            throw error;
        }
    }

    /**
     * Get all users with pagination and filtering
     */
    async findAll(options: UserQueryOptions = {}): Promise<PaginationResult<any>> {
        const { page, limit, sortBy, sortOrder } = sanitizePaginationOptions(options);
        const { search, role, status, emailVerified } = options;

        // Build search and filter conditions
        const where = createSearchWhereClause({
            search,
            searchFields: ['firstName', 'lastName', 'email'],
            filters: {
                ...(role && { role }),
                ...(status && { status }),
                ...(emailVerified !== undefined && { emailVerified }),
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.user.count({ where });

        // Get users with pagination
        const users = await prisma.user.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                avatar: true,
                phone: true,
                dateOfBirth: true,
                gender: true,
                address: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                // Include role-specific profile data
                student: {
                    select: {
                        id: true,
                        rollNumber: true,
                        gradeLevel: true,
                        section: true,
                        stream: true,
                    },
                },
                teacher: {
                    select: {
                        id: true,
                        employeeId: true,
                        department: true,
                        subjects: true,
                    },
                },
                admin: {
                    select: {
                        id: true,
                        adminCode: true,
                        department: true,
                        accessLevel: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        occupation: true,
                        relationship: true,
                    },
                },
            },
        });

        return formatPaginationResult(users, totalItems, options);
    }

    /**
     * Get user by ID
     */
    async findById(id: string): Promise<any> {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                avatar: true,
                phone: true,
                dateOfBirth: true,
                gender: true,
                address: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                // Include role-specific profile data
                student: {
                    select: {
                        id: true,
                        rollNumber: true,
                        gradeLevel: true,
                        section: true,
                        stream: true,
                        admissionDate: true,
                    },
                },
                teacher: {
                    select: {
                        id: true,
                        employeeId: true,
                        department: true,
                        subjects: true,
                        qualification: true,
                        joinDate: true,
                    },
                },
                admin: {
                    select: {
                        id: true,
                        adminCode: true,
                        department: true,
                        accessLevel: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        occupation: true,
                        relationship: true,
                    },
                },
                // Include gamification data
                gamification: {
                    select: {
                        id: true,
                        points: true,
                        xp: true,
                        level: true,
                        xpToNextLevel: true,
                        streak: true,
                        longestStreak: true,
                        lastActiveDate: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    /**
     * Get user by email
     */
    async findByEmail(email: string): Promise<any> {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true, // Include for authentication
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                emailVerified: true,
                emailVerifyToken: true,
                emailVerifyExpiry: true,
                resetToken: true,
                resetTokenExpiry: true,
            },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    /**
     * Update user
     */
    async update(id: string, updateUserDto: UpdateUserDto): Promise<any> {
        // Check if user exists
        await this.findById(id);

        try {
            const user = await prisma.user.update({
                where: { id },
                data: updateUserDto,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    avatar: true,
                    phone: true,
                    dateOfBirth: true,
                    gender: true,
                    address: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return user;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Email already exists');
            }
            throw error;
        }
    }

    /**
     * Delete user
     */
    async delete(id: string): Promise<void> {
        // Check if user exists
        await this.findById(id);

        await prisma.user.delete({
            where: { id },
        });
    }

    /**
     * Verify user email
     */
    async verifyEmail(token: string): Promise<void> {
        const hashedToken = await hashData(token);

        const user = await prisma.user.findFirst({
            where: {
                emailVerifyToken: hashedToken,
                emailVerifyExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            throw new BadRequestError('Invalid or expired verification token');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerifyToken: null,
                emailVerifyExpiry: null,
                status: 'ACTIVE',
            },
        });
    }

    /**
     * Change user password
     */
    async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, password: true },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Verify current password
        const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new BadRequestError('Current password is incorrect');
        }

        // Validate new password strength
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
            throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id },
            data: { password: hashedNewPassword },
        });
    }

    /**
     * Get users by role
     */
    async findByRole(role: string, options: UserQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, role });
    }

    /**
     * Get active users count
     */
    async getActiveUsersCount(): Promise<number> {
        return prisma.user.count({
            where: { status: 'ACTIVE' },
        });
    }

    /**
     * Get users statistics
     */
    async getUsersStatistics(): Promise<any> {
        const [totalUsers, activeUsers, pendingUsers, students, teachers, parents, admins] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: 'ACTIVE' } }),
            prisma.user.count({ where: { status: 'PENDING_VERIFICATION' } }),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'TEACHER' } }),
            prisma.user.count({ where: { role: 'PARENT' } }),
            prisma.user.count({ where: { role: 'ADMIN' } }),
        ]);

        return {
            totalUsers,
            activeUsers,
            pendingUsers,
            roleDistribution: {
                students,
                teachers,
                parents,
                admins,
            },
        };
    }
}

// Export singleton instance
export const usersService = new UsersService();

export default usersService;
