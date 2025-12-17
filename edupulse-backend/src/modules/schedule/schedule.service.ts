import { PrismaClient } from '@prisma/client';
import { 
    PaginationOptions, 
    PaginationResult, 
    sanitizePaginationOptions,
    formatPaginationResult,
    createSearchWhereClause
} from '../../utils/pagination.util.js';
import { 
    NotFoundError, 
    ConflictError, 
    BadRequestError,
    ValidationError 
} from '../../utils/error.util.js';

const prisma = new PrismaClient();

// DTOs
export interface CreateScheduleDto {
    courseId: string;
    dayOfWeek: number; // 0-6 (Sunday to Saturday)
    startTime: string; // "09:00"
    endTime: string; // "10:00"
    room?: string;
    isActive?: boolean;
}

export interface UpdateScheduleDto {
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    room?: string;
    isActive?: boolean;
}

export interface ScheduleQueryOptions extends PaginationOptions {
    courseId?: string;
    dayOfWeek?: number;
    room?: string;
    isActive?: boolean;
    search?: string;
}

// Service class
export class ScheduleService {
    /**
     * Create a new schedule
     */
    async create(createScheduleDto: CreateScheduleDto): Promise<any> {
        // Validate time format
        if (!this.isValidTimeFormat(createScheduleDto.startTime) || 
            !this.isValidTimeFormat(createScheduleDto.endTime)) {
            throw new ValidationError('Invalid time format. Use HH:MM format');
        }

        // Validate day of week
        if (createScheduleDto.dayOfWeek < 0 || createScheduleDto.dayOfWeek > 6) {
            throw new ValidationError('Day of week must be between 0 (Sunday) and 6 (Saturday)');
        }

        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: createScheduleDto.courseId },
            select: { id: true, name: true, code: true }
        });

        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Check for time conflicts
        const conflict = await this.checkTimeConflict(
            createScheduleDto.courseId,
            createScheduleDto.dayOfWeek,
            createScheduleDto.startTime,
            createScheduleDto.endTime
        );

        if (conflict) {
            throw new ConflictError('Schedule conflicts with existing schedule');
        }

        try {
            const schedule = await prisma.schedule.create({
                data: {
                    ...createScheduleDto,
                    isActive: createScheduleDto.isActive ?? true,
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            subject: true,
                            teacher: {
                                select: {
                                    user: {
                                        select: {
                                            firstName: true,
                                            lastName: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            return schedule;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Schedule already exists');
            }
            throw error;
        }
    }

    /**
     * Get all schedules with pagination and filtering
     */
    async findAll(options: ScheduleQueryOptions = {}): Promise<PaginationResult<any>> {
        const { page, limit, sortBy, sortOrder } = sanitizePaginationOptions(options);
        const { courseId, dayOfWeek, room, isActive, search } = options;

        // Build search and filter conditions
        const where = createSearchWhereClause({
            search,
            searchFields: ['room', 'course.name', 'course.code'],
            filters: {
                ...(courseId && { courseId }),
                ...(dayOfWeek !== undefined && { dayOfWeek }),
                ...(room && { room }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.schedule.count({ where });

        // Get schedules with pagination
        const schedules = await prisma.schedule.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        subject: true,
                        teacher: {
                            select: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return formatPaginationResult(schedules, totalItems, options);
    }

    /**
     * Get schedule by ID
     */
    async findById(id: string): Promise<any> {
        const schedule = await prisma.schedule.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        subject: true,
                        teacher: {
                            select: {
                                id: true,
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!schedule) {
            throw new NotFoundError('Schedule not found');
        }

        return schedule;
    }

    /**
     * Get schedules by course ID
     */
    async findByCourseId(courseId: string, options: ScheduleQueryOptions = {}): Promise<PaginationResult<any>> {
        const { page, limit, sortBy = 'dayOfWeek', sortOrder = 'asc' } = sanitizePaginationOptions(options);
        const { dayOfWeek, room, isActive } = options;

        const where: any = { courseId };
        if (dayOfWeek !== undefined) where.dayOfWeek = dayOfWeek;
        if (room) where.room = room;
        if (isActive !== undefined) where.isActive = isActive;

        const totalItems = await prisma.schedule.count({ where });

        const schedules = await prisma.schedule.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        subject: true,
                    },
                },
            },
        });

        return formatPaginationResult(schedules, totalItems, options);
    }

    /**
     * Get schedules by day of week
     */
    async findByDayOfWeek(dayOfWeek: number, options: ScheduleQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, dayOfWeek });
    }

    /**
     * Get schedules by room
     */
    async findByRoom(room: string, options: ScheduleQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, room });
    }

    /**
     * Update schedule
     */
    async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<any> {
        // Check if schedule exists
        const existingSchedule = await this.findById(id);

        // Validate time format if provided
        if (updateScheduleDto.startTime && !this.isValidTimeFormat(updateScheduleDto.startTime)) {
            throw new ValidationError('Invalid start time format. Use HH:MM format');
        }

        if (updateScheduleDto.endTime && !this.isValidTimeFormat(updateScheduleDto.endTime)) {
            throw new ValidationError('Invalid end time format. Use HH:MM format');
        }

        // Validate day of week if provided
        if (updateScheduleDto.dayOfWeek !== undefined && 
            (updateScheduleDto.dayOfWeek < 0 || updateScheduleDto.dayOfWeek > 6)) {
            throw new ValidationError('Day of week must be between 0 (Sunday) and 6 (Saturday)');
        }

        // Check for time conflicts if time or day is being updated
        if (updateScheduleDto.startTime || updateScheduleDto.endTime || updateScheduleDto.dayOfWeek) {
            const newStartTime = updateScheduleDto.startTime || existingSchedule.startTime;
            const newEndTime = updateScheduleDto.endTime || existingSchedule.endTime;
            const newDayOfWeek = updateScheduleDto.dayOfWeek !== undefined ? updateScheduleDto.dayOfWeek : existingSchedule.dayOfWeek;

            const conflict = await this.checkTimeConflict(
                existingSchedule.courseId,
                newDayOfWeek,
                newStartTime,
                newEndTime,
                id // Exclude current schedule from conflict check
            );

            if (conflict) {
                throw new ConflictError('Schedule conflicts with existing schedule');
            }
        }

        try {
            const schedule = await prisma.schedule.update({
                where: { id },
                data: updateScheduleDto,
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            subject: true,
                            teacher: {
                                select: {
                                    user: {
                                        select: {
                                            firstName: true,
                                            lastName: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            return schedule;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Schedule already exists');
            }
            throw error;
        }
    }

    /**
     * Delete schedule
     */
    async delete(id: string): Promise<void> {
        // Check if schedule exists
        await this.findById(id);

        await prisma.schedule.delete({
            where: { id },
        });
    }

    /**
     * Check room availability
     */
    async checkRoomAvailability(room: string, dayOfWeek: number, startTime: string, endTime: string, excludeId?: string): Promise<boolean> {
        const where: any = {
            room,
            dayOfWeek,
            isActive: true,
        };

        if (excludeId) {
            where.id = { not: excludeId };
        }

        const existingSchedules = await prisma.schedule.findMany({
            where,
            select: { startTime: true, endTime: true },
        });

        return !this.hasTimeConflict(existingSchedules, startTime, endTime);
    }

    /**
     * Get available rooms for a time slot
     */
    async getAvailableRooms(dayOfWeek: number, startTime: string, endTime: string): Promise<string[]> {
        const allRooms = await prisma.schedule.findMany({
            where: { 
                dayOfWeek, 
                isActive: true,
                room: { not: null }
            },
            select: { room: true, startTime: true, endTime: true },
        });

        const availableRooms = new Set<string>();
        
        // Get all unique rooms that don't have conflicts
        for (const room of new Set(allRooms.map(s => s.room).filter(Boolean))) {
            const roomSchedules = allRooms.filter(s => s.room === room);
            if (!this.hasTimeConflict(roomSchedules, startTime, endTime)) {
                availableRooms.add(room!);
            }
        }

        return Array.from(availableRooms);
    }

    /**
     * Get weekly schedule for a course
     */
    async getWeeklySchedule(courseId: string): Promise<any> {
        const schedules = await prisma.schedule.findMany({
            where: { 
                courseId, 
                isActive: true 
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ],
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        subject: true,
                        teacher: {
                            select: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Group by day of week
        const weeklySchedule: { [key: number]: any[] } = {};
        for (let i = 0; i < 7; i++) {
            weeklySchedule[i] = [];
        }

        schedules.forEach(schedule => {
            weeklySchedule[schedule.dayOfWeek].push(schedule);
        });

        return weeklySchedule;
    }

    /**
     * Get schedules statistics
     */
    async getSchedulesStatistics(): Promise<any> {
        const [totalSchedules, activeSchedules, schedulesByDay] = await Promise.all([
            prisma.schedule.count(),
            prisma.schedule.count({ where: { isActive: true } }),
            prisma.schedule.groupBy({
                by: ['dayOfWeek'],
                _count: {
                    id: true,
                },
            }),
        ]);

        const dayDistribution = schedulesByDay.map(item => ({
            dayOfWeek: item.dayOfWeek,
            count: item._count.id,
        }));

        // Get room utilization
        const roomStats = await prisma.schedule.groupBy({
            by: ['room'],
            _count: {
                id: true,
            },
            where: {
                room: { not: null },
            },
        });

        const roomUtilization = roomStats
            .filter(item => item.room)
            .map(item => ({
                room: item.room!,
                count: item._count.id,
            }));

        return {
            totalSchedules,
            activeSchedules,
            dayDistribution,
            roomUtilization,
        };
    }

    // Private helper methods

    private isValidTimeFormat(time: string): boolean {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    private async checkTimeConflict(
        courseId: string, 
        dayOfWeek: number, 
        startTime: string, 
        endTime: string, 
        excludeId?: string
    ): Promise<boolean> {
        const where: any = {
            courseId,
            dayOfWeek,
            isActive: true,
        };

        if (excludeId) {
            where.id = { not: excludeId };
        }

        const existingSchedules = await prisma.schedule.findMany({
            where,
            select: { startTime: true, endTime: true },
        });

        return this.hasTimeConflict(existingSchedules, startTime, endTime);
    }

    private hasTimeConflict(existingSchedules: { startTime: string; endTime: string }[], newStartTime: string, newEndTime: string): boolean {
        return existingSchedules.some(schedule => {
            return this.timesOverlap(
                schedule.startTime, 
                schedule.endTime, 
                newStartTime, 
                newEndTime
            );
        });
    }

    private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
        return start1 < end2 && start2 < end1;
    }
}

// Export singleton instance
export const scheduleService = new ScheduleService();

export default scheduleService;
