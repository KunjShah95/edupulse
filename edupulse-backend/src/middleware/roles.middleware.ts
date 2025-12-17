// ========================================
// ROLE GUARDS MIDDLEWARE
// ========================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import { AuthorizationError, AuthenticationError } from '../utils/error.util.js';

export interface RoleGuardOptions {
  roles?: UserRole[];
  permissions?: string[];
  resource?: {
    type: string;
    idParam?: string;
    ownership?: boolean;
  };
  customCheck?: (request: FastifyRequest, user: any) => Promise<boolean> | boolean;
}

export type AuthenticatedRequest = FastifyRequest & {
  user: {
    id: string;
    email: string;
    role: UserRole | string;
    [key: string]: any;
  };
};

/**
 * Role-based access control middleware
 */
export const requireRole = (roles: UserRole[]) => {
  return async (request: AuthenticatedRequest, _reply: FastifyReply): Promise<void> => {
    const user = request.user;

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    const role = user.role as UserRole;
    if (!roles.includes(role)) {
      throw new AuthorizationError(`Access denied. Required roles: ${roles.join(', ')}`);
    }
  };
};

/**
 * Permission-based access control middleware
 */
export const requirePermission = (permissions: string[]) => {
  return async (request: AuthenticatedRequest, _reply: FastifyReply): Promise<void> => {
    const user = request.user;

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    // TODO: Replace with real permission system once available
    const role = user.role as UserRole;
    const rolePermissions = getRolePermissions(role);
    const hasPermission = permissions.some((permission) => rolePermissions.includes(permission));

    if (!hasPermission) {
      throw new AuthorizationError(`Access denied. Required permissions: ${permissions.join(', ')}`);
    }
  };
};

/**
 * Resource ownership middleware
 */
export const requireOwnership = (resourceType: string, userIdParam: string = 'userId') => {
  return async (request: AuthenticatedRequest, _reply: FastifyReply): Promise<void> => {
    const user = request.user;
    const resourceId = (request.params as any)?.[userIdParam];

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    // Admin users can access all resources
    if ((user.role as UserRole) === UserRole.ADMIN) {
      return;
    }

    // Simple ownership check: compare authenticated user id to requested resource id
    if (user.id !== resourceId) {
      throw new AuthorizationError('Access denied. You can only access your own resources.');
    }
  };
};

/**
 * Combined role and permission guard
 */
export const requireAuth = (options: RoleGuardOptions = {}) => {
  return async (request: AuthenticatedRequest, _reply: FastifyReply): Promise<void> => {
    const user = request.user;

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    // Role check
    if (options.roles) {
      const role = user.role as UserRole;
      if (!options.roles.includes(role)) {
        throw new AuthorizationError(`Access denied. Required roles: ${options.roles.join(', ')}`);
      }
    }

    // Permission check
    if (options.permissions) {
      const role = user.role as UserRole;
      const rolePermissions = getRolePermissions(role);
      const hasPermission = options.permissions.some((permission) => rolePermissions.includes(permission));

      if (!hasPermission) {
        throw new AuthorizationError(`Access denied. Required permissions: ${options.permissions.join(', ')}`);
      }
    }

    // Resource ownership check
    if (options.resource) {
      const { idParam = 'userId', ownership } = options.resource;

      if (ownership && user.role !== UserRole.ADMIN) {
        const resourceId = (request.params as any)?.[idParam];
        if (resourceId && resourceId !== user.id) {
          throw new AuthorizationError('Access denied. You can only access your own resources.');
        }
      }
    }

    // Custom check
    if (options.customCheck) {
      const customCheckResult = await options.customCheck(request, user);
      if (!customCheckResult) {
        throw new AuthorizationError('Access denied by custom permission check');
      }
    }
  };
};

/**
 * Student/Teacher/Admin/Parent specific guards
 */
export const requireStudent = requireRole([UserRole.STUDENT]);
export const requireTeacher = requireRole([UserRole.TEACHER]);
export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireParent = requireRole([UserRole.PARENT]);

/**
 * Admin or Teacher access
 */
export const requireAdminOrTeacher = requireRole([UserRole.ADMIN, UserRole.TEACHER]);

/**
 * Teacher or Student access
 */
export const requireTeacherOrStudent = requireRole([UserRole.TEACHER, UserRole.STUDENT]);

/**
 * Get permissions for a specific role
 */
function getRolePermissions(role: UserRole): string[] {
  const permissions: Record<UserRole, string[]> = {
    [UserRole.STUDENT]: [
      'read:own_profile',
      'update:own_profile',
      'read:own_grades',
      'read:own_attendance',
      'read:own_courses',
      'read:own_messages',
      'create:message',
      'read:notifications',
      'read:books',
      'create:book_reservation',
      'create:quiz_attempt',
      'read:own_gamification',
    ],
    [UserRole.TEACHER]: [
      'read:own_profile',
      'update:own_profile',
      'read:own_courses',
      'create:course',
      'update:course',
      'delete:course',
      'read:enrolled_students',
      'mark:attendance',
      'create:grade',
      'update:grade',
      'read:course_analytics',
      'create:lesson',
      'update:lesson',
      'create:quiz',
      'update:quiz',
      'read:messages',
      'create:message',
      'read:notifications',
    ],
    [UserRole.ADMIN]: [
      'read:all_profiles',
      'update:all_profiles',
      'delete:all_profiles',
      'read:all_courses',
      'create:all_courses',
      'update:all_courses',
      'delete:all_courses',
      'read:all_grades',
      'read:all_attendance',
      'read:analytics',
      'manage:system_settings',
      'read:audit_logs',
      'manage:users',
      'read:all_messages',
      'create:notification',
      'read:notifications',
    ],
    [UserRole.PARENT]: [
      'read:children_profile',
      'read:children_grades',
      'read:children_attendance',
      'read:children_courses',
      'read:children_messages',
      'create:message',
      'read:notifications',
      'read:children_gamification',
    ],
  };

  return permissions[role] || [];
}

/**
 * Optional authentication middleware (doesn't throw error if not authenticated)
 */
export const optionalAuth = async (_request: AuthenticatedRequest, _reply: FastifyReply): Promise<void> => {
  // No-op: actual auth handled elsewhere. This hook can be used to attach optional user info if available.
};

/**
 * Development-only guard (throws error in production)
 */
export const requireDevelopment = async (_request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    throw new AuthorizationError('This endpoint is only available in development mode');
  }
};

/**
 * Rate limiting by user role
 */
export const roleBasedRateLimit: Record<UserRole, { requests: number; window: number }> = {
  [UserRole.STUDENT]: { requests: 100, window: 3600 }, // 100 requests per hour
  [UserRole.TEACHER]: { requests: 200, window: 3600 }, // 200 requests per hour
  [UserRole.ADMIN]: { requests: 500, window: 3600 }, // 500 requests per hour
  [UserRole.PARENT]: { requests: 150, window: 3600 }, // 150 requests per hour
};

export default {
  requireRole,
  requirePermission,
  requireOwnership,
  requireAuth,
  requireStudent,
  requireTeacher,
  requireAdmin,
  requireParent,
  requireAdminOrTeacher,
  requireTeacherOrStudent,
  optionalAuth,
  requireDevelopment,
  getRolePermissions,
};
