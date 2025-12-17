import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * Common test data for auth module tests
 */
export const testUserData = {
    valid: {
        email: 'student@test.com',
        password: 'Test@1234Password',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT',
        phone: '9876543210',
        rollNumber: 'ROLL001',
        gradeLevel: 10,
        section: 'A',
    },
    invalid: {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: '',
    },
    teacher: {
        email: 'teacher@test.com',
        password: 'Test@1234Password',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'TEACHER',
        employeeId: 'EMP001',
        department: 'Mathematics',
        subjects: ['Math', 'Algebra'],
    },
    admin: {
        email: 'admin@test.com',
        password: 'Test@1234Password',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        adminCode: 'ADMIN001',
    },
};

/**
 * Mock JWT payload
 */
export const createMockJwtPayload = (userId: string = 'test-user-id') => ({
    id: userId,
    email: 'test@example.com',
    role: 'STUDENT',
});

/**
 * Mock FastifyRequest with JWT
 */
export const createMockFastifyRequest = (overrides = {}) => ({
    user: createMockJwtPayload(),
    headers: {
        'x-correlation-id': 'test-correlation-id',
    },
    id: 'test-request-id',
    startTime: Date.now(),
    ...overrides,
});

/**
 * Mock FastifyReply
 */
export const createMockFastifyReply = () => {
    const headers: Record<string, any> = {};
    
    return {
        status: (code: number) => ({
            send: (payload: any) => Promise.resolve(),
        }),
        send: (payload: any) => Promise.resolve(),
        header: (name: string, value: any) => {
            headers[name] = value;
            return this;
        },
        addHook: () => {},
        getHeaders: () => headers,
    };
};

/**
 * Password validation test cases
 */
export const passwordTestCases = {
    valid: [
        'Test@1234Password',
        'SecurePass123!',
        'MyP@ssw0rd',
    ],
    invalid: [
        '123', // too short
        'password', // no uppercase or number
        'PASSWORD123', // no lowercase
        'password123', // no uppercase
        'Pass1', // too short
    ],
};

/**
 * Email validation test cases
 */
export const emailTestCases = {
    valid: [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.com',
    ],
    invalid: [
        'invalid-email',
        '@example.com',
        'test@',
        'test@@example.com',
        'test @example.com',
    ],
};

/**
 * Common test setup and teardown utilities
 */
export const testSetup = {
    /**
     * Setup before each test
     */
    beforeEach: () => {
        // Clear any mocks or setup state
    },

    /**
     * Cleanup after each test
     */
    afterEach: () => {
        // Cleanup state
    },
};

/**
 * Wait for async operations with timeout
 */
export const waitFor = async (
    condition: () => boolean | Promise<boolean>,
    timeout = 1000
): Promise<void> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('Condition not met within timeout');
};

/**
 * Create a delay for testing async operations
 */
export const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));
