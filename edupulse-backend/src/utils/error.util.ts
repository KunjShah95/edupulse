// ========================================
// ERROR HANDLING UTILITIES
// ========================================

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;

    constructor(
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true,
        code?: string
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Custom error classes
export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed') {
        super(message, 400, true, 'VALIDATION_ERROR');
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, true, 'AUTHENTICATION_ERROR');
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Insufficient permissions') {
        super(message, 403, true, 'AUTHORIZATION_ERROR');
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404, true, 'NOT_FOUND_ERROR');
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource conflict') {
        super(message, 409, true, 'CONFLICT_ERROR');
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request') {
        super(message, 400, true, 'BAD_REQUEST_ERROR');
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error') {
        super(message, 500, true, 'INTERNAL_SERVER_ERROR');
    }
}

// Error handler utility
export const handleError = (error: any): AppError => {
    // If it's already an AppError, return it as is
    if (error instanceof AppError) {
        return error;
    }

    // Prisma errors
    if (error.code === 'P2002') {
        return new ConflictError(
            `Duplicate entry: ${error.meta?.target?.join(', ')} already exists`
        );
    }

    if (error.code === 'P2025') {
        return new NotFoundError('Record not found');
    }

    if (error.code?.startsWith('P2')) {
        return new BadRequestError('Database constraint violation');
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return new AuthenticationError('Invalid token');
    }

    if (error.name === 'TokenExpiredError') {
        return new AuthenticationError('Token expired');
    }

    // Validation errors (Zod)
    if (error.name === 'ZodError') {
        return new ValidationError(
            error.errors?.[0]?.message || 'Validation failed'
        );
    }

    // Default to internal server error
    return new InternalServerError(
        process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    );
};

// Success response utility
export const successResponse = <T = any>(
    data: T,
    message: string = 'Success',
    statusCode: number = 200
) => {
    return {
        success: true,
        message,
        data,
        statusCode,
        timestamp: new Date().toISOString(),
    };
};

// Error response utility
export const errorResponse = (error: any) => {
    const appError = handleError(error);

    return {
        success: false,
        error: {
            message: appError.message,
            code: appError.code,
            statusCode: appError.statusCode,
        },
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
            stack: appError.stack,
        }),
    };
};
