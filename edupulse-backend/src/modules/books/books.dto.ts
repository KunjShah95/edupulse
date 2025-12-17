import { z } from 'zod';

// Create Book DTO
export const createBookSchema = z.object({
    isbn: z.string().min(1, 'ISBN is required'),
    title: z.string().min(1, 'Title is required').max(255),
    author: z.string().min(1, 'Author is required').max(255),
    publisher: z.string().max(255).optional(),
    publishYear: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
    edition: z.string().max(100).optional(),
    category: z.string().min(1, 'Category is required').max(100),
    description: z.string().optional(),
    coverImage: z.string().url('Must be a valid URL').optional(),
    totalCopies: z.number().int().positive('Total copies must be positive').default(1),
    location: z.string().max(100).optional(),
});

export type CreateBookDto = z.infer<typeof createBookSchema>;

// Update Book DTO
export const updateBookSchema = createBookSchema.partial().omit({ isbn: true });

export type UpdateBookDto = z.infer<typeof updateBookSchema>;

// Query Options DTO
export const bookQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['title', 'author', 'isbn', 'category', 'createdAt', 'updatedAt']).default('title'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    search: z.string().optional(),
    isbn: z.string().optional(),
    author: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    available: z.coerce.boolean().optional(),
});

export type BookQueryOptions = z.infer<typeof bookQuerySchema>;

// Response DTOs
export const bookResponseSchema = z.object({
    id: z.string(),
    isbn: z.string(),
    title: z.string(),
    author: z.string(),
    publisher: z.string().nullable(),
    publishYear: z.number().nullable(),
    edition: z.string().nullable(),
    category: z.string(),
    description: z.string().nullable(),
    coverImage: z.string().nullable(),
    totalCopies: z.number(),
    availableCopies: z.number(),
    status: z.string(),
    location: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type BookResponse = z.infer<typeof bookResponseSchema>;

export const booksListResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(bookResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }),
});

export type BooksListResponse = z.infer<typeof booksListResponseSchema>;

// Availability Check DTO
export const availabilityResponseSchema = z.object({
    bookId: z.string(),
    title: z.string(),
    totalCopies: z.number(),
    availableCopies: z.number(),
    isAvailable: z.boolean(),
    waitingList: z.number(),
});

export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>;

// Statistics DTO
export const booksStatisticsResponseSchema = z.object({
    totalBooks: z.number(),
    availableBooks: z.number(),
    borrowedBooks: z.number(),
    categoryDistribution: z.array(z.object({
        category: z.string(),
        count: z.number(),
    })),
    totalActiveLoans: z.number(),
    totalPendingReservations: z.number(),
});

export type BooksStatisticsResponse = z.infer<typeof booksStatisticsResponseSchema>;
