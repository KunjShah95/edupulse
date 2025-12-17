import { z } from 'zod';

// Loan status enum (matching Prisma schema)
const loanStatusSchema = z.enum(['ACTIVE', 'RETURNED', 'OVERDUE']);

// Due date calculation (must be in future)
const dueDateSchema = z.string()
    .datetime()
    .refine((date) => new Date(date) > new Date(), 'Due date must be in the future');

// Create Loan DTO
export const createLoanSchema = z.object({
    bookId: z.string().min(1, 'Book ID is required'),
    borrowerId: z.string().min(1, 'Borrower ID is required'),
    borrowerType: z.enum(['student', 'teacher']),
    dueDate: dueDateSchema,
    notes: z.string().max(500, 'Notes too long').optional(),
});

export type CreateLoanDto = z.infer<typeof createLoanSchema>;

// Return Loan DTO
export const returnLoanSchema = z.object({
    returnDate: z.string().datetime().default(() => new Date().toISOString()),
    conditionNotes: z.string().max(500, 'Condition notes too long').optional(),
    fineAmount: z.number().min(0, 'Fine amount cannot be negative').default(0),
});

export type ReturnLoanDto = z.infer<typeof returnLoanSchema>;

// Extend Loan DTO
export const extendLoanSchema = z.object({
    newDueDate: dueDateSchema,
    extensionReason: z.string().max(200, 'Extension reason too long').optional(),
});

export type ExtendLoanDto = z.infer<typeof extendLoanSchema>;

// Update Loan DTO (for staff only)
export const updateLoanSchema = z.object({
    dueDate: dueDateSchema.optional(),
    status: loanStatusSchema.optional(),
    conditionNotes: z.string().max(500, 'Condition notes too long').optional(),
    fineAmount: z.number().min(0, 'Fine amount cannot be negative').optional(),
    notes: z.string().max(500, 'Notes too long').optional(),
});

export type UpdateLoanDto = z.infer<typeof updateLoanSchema>;

// Query Options DTO
export const loanQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['dueDate', 'loanDate', 'returnDate', 'status', 'createdAt']).default('dueDate'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    search: z.string().optional(),
    borrowerId: z.string().optional(),
    borrowerType: z.enum(['student', 'teacher']).optional(),
    bookId: z.string().optional(),
    status: loanStatusSchema.optional(),
    overdue: z.coerce.boolean().optional(),
    dueDateFrom: z.string().datetime().optional(),
    dueDateTo: z.string().datetime().optional(),
});

export type LoanQueryOptions = z.infer<typeof loanQuerySchema>;

// Response DTOs
export const loanResponseSchema = z.object({
    id: z.string(),
    bookId: z.string(),
    borrowerId: z.string(),
    borrowerType: z.enum(['student', 'teacher']),
    loanDate: z.date(),
    dueDate: z.date(),
    returnDate: z.date().nullable(),
    status: loanStatusSchema,
    fineAmount: z.number().default(0),
    conditionNotes: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    book: z.object({
        id: z.string(),
        title: z.string(),
        author: z.string(),
        isbn: z.string(),
        coverImage: z.string().nullable(),
    }),
    borrower: z.object({
        id: z.string(),
        user: z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string(),
        }),
    }),
});

export type LoanResponse = z.infer<typeof loanResponseSchema>;

export const loansListResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(loanResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }),
});

export type LoansListResponse = z.infer<typeof loansListResponseSchema>;

// Statistics DTO
export const loansStatisticsResponseSchema = z.object({
    totalLoans: z.number(),
    activeLoans: z.number(),
    overdueLoans: z.number(),
    returnedLoans: z.number(),
    totalFines: z.number(),
    loansByStatus: z.array(z.object({
        status: loanStatusSchema,
        count: z.number(),
    })),
    loansByBorrowerType: z.array(z.object({
        borrowerType: z.enum(['student', 'teacher']),
        count: z.number(),
    })),
    popularBooks: z.array(z.object({
        bookId: z.string(),
        title: z.string(),
        loanCount: z.number(),
    })),
});

export type LoansStatisticsResponse = z.infer<typeof loansStatisticsResponseSchema>;

// Overdue Loans DTO
export const overdueLoansResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(loanResponseSchema),
});

export type OverdueLoansResponse = z.infer<typeof overdueLoansResponseSchema>;

// User Loans DTO
export const userLoansResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
        active: z.array(loanResponseSchema),
        overdue: z.array(loanResponseSchema),
        history: z.array(loanResponseSchema),
        totalActive: z.number(),
        totalOverdue: z.number(),
        totalFines: z.number(),
    }),
});

export type UserLoansResponse = z.infer<typeof userLoansResponseSchema>;

// Bulk Operations DTO
export const bulkReturnSchema = z.object({
    loanIds: z.array(z.string().min(1)).min(1, 'At least one loan ID is required'),
    returnDate: z.string().datetime().default(() => new Date().toISOString()),
    conditionNotes: z.string().max(500, 'Condition notes too long').optional(),
    fineAmount: z.number().min(0, 'Fine amount cannot be negative').default(0),
});

export type BulkReturnDto = z.infer<typeof bulkReturnSchema>;

// Availability Check DTO
export const loanAvailabilityQuerySchema = z.object({
    bookId: z.string().min(1, 'Book ID is required'),
    borrowerId: z.string().min(1, 'Borrower ID is required'),
    borrowerType: z.enum(['student', 'teacher']),
});

export type LoanAvailabilityQuery = z.infer<typeof loanAvailabilityQuerySchema>;

export const loanAvailabilityResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
        available: z.boolean(),
        availableCopies: z.number(),
        waitingList: z.number(),
        nextAvailable: z.string().nullable(),
        reservationId: z.string().nullable(),
    }),
});

export type LoanAvailabilityResponse = z.infer<typeof loanAvailabilityResponseSchema>;
