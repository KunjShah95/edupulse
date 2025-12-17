import { z } from 'zod';

// Create Lesson DTO
export const createLessonSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    content: z.string().optional(),
    order: z.number().int().positive('Order must be a positive integer'),
    duration: z.number().int().positive('Duration must be a positive integer').optional(),
    videoUrl: z.string().url('Must be a valid URL').optional(),
    attachments: z.array(z.string().url('Must be a valid URL')).optional(),
    isPublished: z.boolean().optional(),
});

export type CreateLessonDto = z.infer<typeof createLessonSchema>;

// Update Lesson DTO
export const updateLessonSchema = createLessonSchema.partial().omit({ courseId: true });

export type UpdateLessonDto = z.infer<typeof updateLessonSchema>;

// Query Options DTO
export const lessonQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['title', 'order', 'createdAt', 'updatedAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    courseId: z.string().optional(),
    isPublished: z.coerce.boolean().optional(),
    search: z.string().optional(),
});

export type LessonQueryOptions = z.infer<typeof lessonQuerySchema>;

// Reorder Lessons DTO
export const reorderLessonsSchema = z.object({
    lessonOrders: z.array(
        z.object({
            id: z.string().min(1, 'Lesson ID is required'),
            order: z.number().int().positive('Order must be a positive integer'),
        })
    ).min(1, 'At least one lesson order is required'),
});

export type ReorderLessonsDto = z.infer<typeof reorderLessonsSchema>;

// Response DTOs
export const lessonResponseSchema = z.object({
    id: z.string(),
    courseId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    content: z.string().nullable(),
    order: z.number(),
    duration: z.number().nullable(),
    videoUrl: z.string().nullable(),
    attachments: z.array(z.string()),
    isPublished: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    course: z.object({
        id: z.string(),
        name: z.string(),
        code: z.string(),
        subject: z.string(),
        teacher: z.object({
            user: z.object({
                firstName: z.string(),
                lastName: z.string(),
            }),
        }),
    }),
});

export type LessonResponse = z.infer<typeof lessonResponseSchema>;

export const lessonsListResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(lessonResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }),
});

export type LessonsListResponse = z.infer<typeof lessonsListResponseSchema>;
