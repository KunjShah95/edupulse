import { z } from 'zod';

// Day of week validation (0-6, Sunday to Saturday)
const dayOfWeekSchema = z.number()
    .int()
    .min(0, 'Day of week must be between 0 (Sunday) and 6 (Saturday)')
    .max(6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)');

// Time format validation (HH:MM)
const timeSchema = z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format');

// Create Schedule DTO
export const createScheduleSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    dayOfWeek: dayOfWeekSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    room: z.string().max(100, 'Room name too long').optional(),
    isActive: z.boolean().default(true),
});

export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;

// Update Schedule DTO
export const updateScheduleSchema = createScheduleSchema.partial().omit({
    courseId: true, // Course ID cannot be updated
});

export type UpdateScheduleDto = z.infer<typeof updateScheduleSchema>;

// Query Options DTO
export const scheduleQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['dayOfWeek', 'startTime', 'endTime', 'room', 'createdAt', 'updatedAt']).default('dayOfWeek'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    search: z.string().optional(),
    courseId: z.string().optional(),
    dayOfWeek: dayOfWeekSchema.optional(),
    room: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
});

export type ScheduleQueryOptions = z.infer<typeof scheduleQuerySchema>;

// Response DTOs
export const scheduleResponseSchema = z.object({
    id: z.string(),
    courseId: z.string(),
    dayOfWeek: z.number(),
    startTime: z.string(),
    endTime: z.string(),
    room: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    course: z.object({
        id: z.string(),
        name: z.string(),
        code: z.string(),
        subject: z.string().nullable(),
        teacher: z.object({
            user: z.object({
                firstName: z.string(),
                lastName: z.string(),
                email: z.string().optional(),
            }),
        }),
    }),
});

export type ScheduleResponse = z.infer<typeof scheduleResponseSchema>;

export const schedulesListResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(scheduleResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }),
});

export type SchedulesListResponse = z.infer<typeof schedulesListResponseSchema>;

// Weekly Schedule Response DTO
export const weeklyScheduleResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.record(z.array(scheduleResponseSchema)),
});

export type WeeklyScheduleResponse = z.infer<typeof weeklyScheduleResponseSchema>;

// Statistics DTO
export const schedulesStatisticsResponseSchema = z.object({
    totalSchedules: z.number(),
    activeSchedules: z.number(),
    dayDistribution: z.array(z.object({
        dayOfWeek: z.number(),
        count: z.number(),
    })),
    roomUtilization: z.array(z.object({
        room: z.string(),
        count: z.number(),
    })),
});

export type SchedulesStatisticsResponse = z.infer<typeof schedulesStatisticsResponseSchema>;

// Available Rooms DTO
export const availableRoomsResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(z.string()),
});

export type AvailableRoomsResponse = z.infer<typeof availableRoomsResponseSchema>;

// Room Availability Check DTO
export const roomAvailabilityQuerySchema = z.object({
    dayOfWeek: dayOfWeekSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    excludeId: z.string().optional(),
});

export type RoomAvailabilityQuery = z.infer<typeof roomAvailabilityQuerySchema>;
