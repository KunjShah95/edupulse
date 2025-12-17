import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT';
    firstName: string;
    lastName: string;
    emailVerified: boolean;
}

export type AuthenticatedRequest = FastifyRequest & { user?: AuthenticatedUser };

/**
 * Enhanced authentication middleware with user verification
 */
export async function authenticate(
    request: AuthenticatedRequest,
    reply: FastifyReply,
    app: FastifyInstance
): Promise<void> {
    try {
        // Verify JWT token
        await request.jwtVerify();

        const { id } = request.user as any;

        // Fetch user from database to ensure they still exist and get full profile
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                emailVerified: true,
                createdAt: true,
            },
        });

        if (!user) {
            return reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'User not found or account deactivated',
            });
        }

        if (!user.emailVerified) {
            return reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Please verify your email address before accessing this resource',
            });
        }

        // Attach user to request
        request.user = user as unknown as AuthenticatedUser;
    } catch (err: any) {
        return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
}

/**
 * Role-based authorization middleware factory
 */
export function requireRole(allowedRoles: string[]) {
    return async (request: AuthenticatedRequest, reply: FastifyReply, app: FastifyInstance): Promise<void> => {
        if (!request.user) {
            return reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }

        if (!allowedRoles.includes(request.user.role)) {
            return reply.status(403).send({
                statusCode: 403,
                error: 'Forbidden',
                message: 'Insufficient permissions to access this resource',
            });
        }
    };
}

/**
 * Admin only middleware
 */
export function requireAdmin(request: AuthenticatedRequest, reply: FastifyReply, app: FastifyInstance): void {
    requireRole(['ADMIN'])(request, reply, app);
}

/**
 * Teacher or Admin middleware
 */
export function requireTeacherOrAdmin(request: AuthenticatedRequest, reply: FastifyReply, app: FastifyInstance): void {
    requireRole(['TEACHER', 'ADMIN'])(request, reply, app);
}

/**
 * Student only middleware
 */
export function requireStudent(request: AuthenticatedRequest, reply: FastifyReply, app: FastifyInstance): void {
    requireRole(['STUDENT'])(request, reply, app);
}

/**
 * Parent only middleware
 */
export function requireParent(request: AuthenticatedRequest, reply: FastifyReply, app: FastifyInstance): void {
    requireRole(['PARENT'])(request, reply, app);
}

/**
 * Teacher, Admin, or Student middleware
 */
export function requireTeacherStudentOrAdmin(request: AuthenticatedRequest, reply: FastifyReply, app: FastifyInstance): void {
    requireRole(['TEACHER', 'STUDENT', 'ADMIN'])(request, reply, app);
}

/**
 * Student or Parent middleware (for parent-child relationships)
 */
export function requireStudentOrParent(request: AuthenticatedRequest, reply: FastifyReply, app: FastifyInstance): void {
    requireRole(['STUDENT', 'PARENT'])(request, reply, app);
}

export default {
    authenticate,
    requireRole,
    requireAdmin,
    requireTeacherOrAdmin,
    requireStudent,
    requireParent,
    requireTeacherStudentOrAdmin,
    requireStudentOrParent,
};
