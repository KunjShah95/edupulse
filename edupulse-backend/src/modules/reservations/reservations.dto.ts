import { z } from 'zod';

// Reservation status enum
const reservationStatusSchema = z.enum(['PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED']);

// Create Reservation DTO
export const createReservationSchema = z.object({
    bookId: z.string().min(1, 'Book ID is required'),
    userId: z.string().min(1, 'User ID is required'),
    userType: z.enum(['student', 'teacher']),
    notes: z.string().max(500, 'Notes too long').optional(),
});

export type CreateReservationDto = z.infer<typeof createReservationSchema>;

// Cancel Reservation DTO
export const cancelReservationSchema = z.object({
    cancellationReason: z.string().max(200, 'Reason too long').optional(),
});

export type CancelReservationDto = z.infer<typeof cancelReservationSchema>;

// Update Reservation DTO (for staff only)
export const updateReservationSchema = z.object({
    status: reservationStatusSchema.optional(),
    notes: z.string().max(500, 'Notes too long').optional(),
});

export type UpdateReservationDto = z.infer<typeof updateReservationSchema>;

// Query Options DTO
export const reservationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['reservedAt', 'expiresAt', 'status', 'createdAt']).default('reservedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    search: z.string().optional(),
    userId: z.string().optional(),
    userType: z.enum(['student', 'teacher']).optional(),
    bookId: z.string().optional(),
    status: reservationStatusSchema.optional(),
    pending: z.coerce.boolean().optional(),
    expired: z.coerce.boolean().optional(),
    expiresFrom: z.string().datetime().optional(),
    expiresTo: z.string().datetime().optional(),
});

export type ReservationQueryOptions = z.infer<typeof reservationQuerySchema>;

// Response DTOs
export const reservationResponseSchema = z.object({
    id: z.string(),
    bookId: z.string(),
    userId: z.string(),
    reservedAt: z.date(),
    expiresAt: z.date(),
    status: reservationStatusSchema,
    notes: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    book: z.object({
        id: z.string(),
        title: z.string(),
        author: z.string(),
        isbn: z.string(),
        coverImage: z.string().nullable(),
        availableCopies: z.number(),
    }),
    user: z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        role: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'PARENT']),
    }),
});

export type ReservationResponse = z.infer<typeof reservationResponseSchema>;

export const reservationsListResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(reservationResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }),
});

export type ReservationsListResponse = z.infer<typeof reservationsListResponseSchema>;

// Statistics DTO
export const reservationsStatisticsResponseSchema = z.object({
    totalReservations: z.number(),
    pendingReservations: z.number(),
    fulfilledReservations: z.number(),
    cancelledReservations: z.number(),
    expiredReservations: z.number(),
    reservationsByStatus: z.array(z.object({
        status: reservationStatusSchema,
        count: z.number(),
    })),
    reservationsByUserType: z.array(z.object({
        userType: z.enum(['student', 'teacher']),
        count: z.number(),
    })),
    mostRequestedBooks: z.array(z.object({
        bookId: z.string(),
        title: z.string(),
        reservationCount: z.number(),
    })),
});

export type ReservationsStatisticsResponse = z.infer<typeof reservationsStatisticsResponseSchema>;

// User Reservations DTO
export const userReservationsResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
        active: z.array(reservationResponseSchema),
        pending: z.array(reservationResponseSchema),
        expired: z.array(reservationResponseSchema),
        history: z.array(reservationResponseSchema),
        totalActive: z.number(),
        totalPending: z.number(),
        totalExpired: z.number(),
    }),
});

export type UserReservationsResponse = z.infer<typeof userReservationsResponseSchema>;

// Bulk Operations DTO
export const bulkCancelReservationSchema = z.object({
    reservationIds: z.array(z.string().min(1)).min(1, 'At least one reservation ID is required'),
    cancellationReason: z.string().max(200, 'Reason too long').optional(),
});

export type BulkCancelReservationDto = z.infer<typeof bulkCancelReservationSchema>;

// Fulfill Reservation DTO
export const fulfillReservationSchema = z.object({
    loanDuration: z.coerce.number().int().positive().default(14), // days
    notes: z.string().max(500, 'Notes too long').optional(),
});

export type FulfillReservationDto = z.infer<typeof fulfillReservationSchema>;

// Reservation Availability Check DTO
export const reservationAvailabilityQuerySchema = z.object({
    bookId: z.string().min(1, 'Book ID is required'),
    userId: z.string().min(1, 'User ID is required'),
    userType: z.enum(['student', 'teacher']),
});

export type ReservationAvailabilityQuery = z.infer<typeof reservationAvailabilityQuerySchema>;

export const reservationAvailabilityResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
        canReserve: z.boolean(),
        currentPosition: z.number().nullable(),
        estimatedWaitTime: z.string().nullable(), // Human readable estimate
        activeReservations: z.number(),
        queuePosition: z.number(),
        existingReservation: z.object({
            id: z.string(),
            status: reservationStatusSchema,
            position: z.number(),
        }).nullable(),
    }),
});

export type ReservationAvailabilityResponse = z.infer<typeof reservationAvailabilityResponseSchema>;

// Notification DTO
export const reservationNotificationSchema = z.object({
    type: z.enum(['AVAILABLE', 'EXPIRING_SOON', 'FULFILLED', 'CANCELLED', 'EXPIRED']),
    reservationId: z.string(),
    userId: z.string(),
    message: z.string(),
    data: z.object({
        bookTitle: z.string().optional(),
        expiresAt: z.string().optional(),
        pickupDeadline: z.string().optional(),
    }).optional(),
});

export type ReservationNotificationDto = z.infer<typeof reservationNotificationSchema>;
