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
} from '../../utils/error.util.js';

const prisma = new PrismaClient();

// DTOs
export interface CreateReservationDto {
    bookId: string;
    userId: string;
    userType: 'student' | 'teacher';
}

export interface CancelReservationDto {
    cancellationReason?: string;
}

export interface UpdateReservationDto {
    status?: 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
}

export interface ReservationQueryOptions extends PaginationOptions {
    userId?: string;
    userType?: 'student' | 'teacher';
    bookId?: string;
    status?: 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
    pending?: boolean;
    expired?: boolean;
    expiresFrom?: string;
    expiresTo?: string;
    search?: string;
}

export interface FulfillReservationDto {
    loanDuration?: number;
}

export interface ReservationAvailabilityQuery {
    bookId: string;
    userId: string;
    userType: 'student' | 'teacher';
}

export interface ReservationAvailabilityResult {
    canReserve: boolean;
    currentPosition: number | null;
    estimatedWaitTime: string | null;
    activeReservations: number;
    queuePosition: number;
    existingReservation: {
        id: string;
        status: 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
        position: number;
    } | null;
}

// Service class
export class ReservationsService {
    private readonly RESERVATION_DURATION_DAYS = 7; // Default reservation duration
    private readonly MAX_RESERVATIONS_PER_USER = 3; // Maximum reservations per user
    private readonly RESERVATION_NOTIFICATION_DAYS = 1; // Days before expiry to notify

    /**
     * Get active reservations count for a user
     */
    private async getActiveReservationsCount(userId: string): Promise<number> {
        return await prisma.bookReservation.count({
            where: {
                userId: userId,
                status: { in: ['PENDING'] }
            }
        });
    }

    /**
     * Get user's position in the reservation queue for a book
     */
    private async getQueuePosition(bookId: string, userId: string): Promise<number> {
        const reservations = await prisma.bookReservation.findMany({
            where: {
                bookId: bookId,
                status: 'PENDING'
            },
            orderBy: {
                reservedAt: 'asc'
            }
        });

        return reservations.findIndex((r: any) => r.userId === userId) + 1;
    }

    /**
     * Check if user can make a reservation
     */
    async checkAvailability(query: ReservationAvailabilityQuery): Promise<ReservationAvailabilityResult> {
        const { bookId, userId } = query;

        // Check if book exists and is available
        const book = await prisma.book.findUnique({
            where: { id: bookId },
            select: { 
                id: true, 
                title: true, 
                totalCopies: true, 
                availableCopies: true,
                status: true 
            }
        });

        if (!book) {
            throw new NotFoundError('Book not found');
        }

        // Check if user already has an active reservation for this book
        const existingReservation = await prisma.bookReservation.findFirst({
            where: {
                bookId: bookId,
                userId: userId,
                status: { in: ['PENDING', 'FULFILLED'] }
            }
        });

        if (existingReservation) {
            const position = await this.getQueuePosition(bookId, userId);
            return {
                canReserve: false,
                currentPosition: position,
                estimatedWaitTime: null,
                activeReservations: await prisma.bookReservation.count({
                    where: { bookId, status: 'PENDING' }
                }),
                queuePosition: position,
                existingReservation: {
                    id: existingReservation.id,
                    status: existingReservation.status as any,
                    position: position
                }
            };
        }

        // Check if user has reached reservation limit
        const activeReservationsCount = await this.getActiveReservationsCount(userId);
        if (activeReservationsCount >= this.MAX_RESERVATIONS_PER_USER) {
            return {
                canReserve: false,
                currentPosition: null,
                estimatedWaitTime: null,
                activeReservations: 0,
                queuePosition: 0,
                existingReservation: null
            };
        }

        // Calculate queue position and estimated wait time
        const activeReservations = await prisma.bookReservation.count({
            where: { 
                bookId, 
                status: 'PENDING',
                expiresAt: { gt: new Date() }
            }
        });

        const queuePosition = activeReservations + 1;
        const estimatedWaitTime = book.availableCopies > 0 ? 
            'Available now' : 
            `${queuePosition - book.availableCopies} people ahead`;

        return {
            canReserve: true,
            currentPosition: queuePosition,
            estimatedWaitTime: estimatedWaitTime,
            activeReservations,
            queuePosition,
            existingReservation: null
        };
    }

    /**
     * Create a new reservation
     */
    async create(createReservationDto: CreateReservationDto): Promise<any> {
        // Check availability first
        const availability = await this.checkAvailability({
            bookId: createReservationDto.bookId,
            userId: createReservationDto.userId,
            userType: createReservationDto.userType
        });

        if (!availability.canReserve) {
            if (availability.existingReservation) {
                throw new ConflictError('You already have a reservation for this book');
            } else {
                throw new BadRequestError(`You have reached the maximum reservation limit of ${this.MAX_RESERVATIONS_PER_USER} books`);
            }
        }

        // Validate book exists
        const book = await prisma.book.findUnique({
            where: { id: createReservationDto.bookId },
            select: { 
                id: true, 
                title: true, 
                totalCopies: true, 
                availableCopies: true,
                status: true 
            }
        });

        if (!book) {
            throw new NotFoundError('Book not found');
        }

        // Check if book is available now (no need to reserve)
        if (book.availableCopies > 0 && book.status === 'AVAILABLE') {
            throw new BadRequestError('Book is currently available - no need to reserve');
        }

        // Calculate expiry date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.RESERVATION_DURATION_DAYS);

        try {
            // Create reservation and update book status in transaction
            const result = await prisma.$transaction(async (tx: any) => {
                // Create the reservation
                const reservation = await tx.bookReservation.create({
                    data: {
                        bookId: createReservationDto.bookId,
                        userId: createReservationDto.userId,
                        reservedAt: new Date(),
                        expiresAt: expiresAt,
                        status: 'PENDING',
                    },
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                                author: true,
                                isbn: true,
                                coverImage: true,
                                availableCopies: true,
                            },
                        },
                    },
                });

                // Update book status to RESERVED if no copies are available
                if (book.availableCopies <= 0 && book.status === 'AVAILABLE') {
                    await tx.book.update({
                        where: { id: createReservationDto.bookId },
                        data: { status: 'RESERVED' },
                    });
                }

                return reservation;
            });

            return result;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Reservation already exists');
            }
            throw error;
        }
    }

    /**
     * Get all reservations with pagination and filtering
     */
    async findAll(options: ReservationQueryOptions = {}): Promise<PaginationResult<any>> {
        const { page, limit, sortBy, sortOrder } = sanitizePaginationOptions(options);
        const { userId, bookId, status, pending, expired, expiresFrom, expiresTo, search } = options;

        // Build search and filter conditions
        const where = createSearchWhereClause({
            search,
            searchFields: ['book.title', 'book.author'],
            filters: {
                ...(userId && { userId }),
                ...(bookId && { bookId }),
                ...(status && { status }),
                ...(pending && { status: 'PENDING' }),
                ...(expired && { 
                    status: 'PENDING',
                    expiresAt: { lt: new Date() }
                }),
                ...(expiresFrom && expiresTo && {
                    expiresAt: {
                        gte: new Date(expiresFrom),
                        lte: new Date(expiresTo)
                    }
                }),
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.bookReservation.count({ where });

        // Get reservations with pagination
        const reservations = await prisma.bookReservation.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        isbn: true,
                        coverImage: true,
                        availableCopies: true,
                    },
                },
            },
        });

        return formatPaginationResult(reservations, totalItems, options);
    }

    /**
     * Get reservation by ID
     */
    async findById(id: string): Promise<any> {
        const reservation = await prisma.bookReservation.findUnique({
            where: { id },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        isbn: true,
                        coverImage: true,
                        availableCopies: true,
                    },
                },
            },
        });

        if (!reservation) {
            throw new NotFoundError('Reservation not found');
        }

        return reservation;
    }

    /**
     * Get reservations by user ID
     */
    async findByUserId(userId: string, options: ReservationQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, userId });
    }

    /**
     * Get reservations by book ID
     */
    async findByBookId(bookId: string, options: ReservationQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, bookId });
    }

    /**
     * Cancel a reservation
     */
    async cancel(id: string, _cancelReservationDto: CancelReservationDto): Promise<any> {
        const reservation = await this.findById(id);

        if (reservation.status !== 'PENDING') {
            throw new BadRequestError('Only pending reservations can be cancelled');
        }

        try {
            const updatedReservation = await prisma.bookReservation.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                },
                include: {
                    book: {
                        select: {
                            id: true,
                            title: true,
                            author: true,
                            isbn: true,
                            coverImage: true,
                            availableCopies: true,
                        },
                    },
                },
            });

            // Check if we need to update book status
            await this.updateBookStatusAfterReservationChange(reservation.bookId);

            return updatedReservation;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Fulfill a reservation (convert to loan)
     */
    async fulfill(id: string, fulfillReservationDto: FulfillReservationDto): Promise<any> {
        const reservation = await this.findById(id);

        if (reservation.status !== 'PENDING') {
            throw new BadRequestError('Only pending reservations can be fulfilled');
        }

        if (reservation.expiresAt < new Date()) {
            throw new BadRequestError('Cannot fulfill expired reservation');
        }

        // Check if book is available
        const book = await prisma.book.findUnique({
            where: { id: reservation.bookId },
            select: { availableCopies: true, status: true }
        });

        if (!book || book.availableCopies <= 0) {
            throw new BadRequestError('Book is not available for fulfillment');
        }

        const loanDuration = fulfillReservationDto.loanDuration || this.RESERVATION_DURATION_DAYS;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + loanDuration);

        try {
            const result = await prisma.$transaction(async (tx: any) => {
                // Create loan
                const loan = await tx.bookLoan.create({
                    data: {
                        bookId: reservation.bookId,
                        studentId: reservation.userId,
                        borrowedAt: new Date(),
                        dueDate: dueDate,
                        status: 'ACTIVE',
                    },
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                                author: true,
                                isbn: true,
                                coverImage: true,
                            },
                        },
                        student: {
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
                });

                // Update reservation status
                const updatedReservation = await tx.bookReservation.update({
                    where: { id },
                    data: {
                        status: 'FULFILLED',
                    },
                });

                // Update book availability
                await tx.book.update({
                    where: { id: reservation.bookId },
                    data: { 
                        availableCopies: book.availableCopies - 1
                    },
                });

                return { reservation: updatedReservation, loan };
            });

            return result;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Update reservation (for staff only)
     */
    async update(id: string, updateReservationDto: UpdateReservationDto): Promise<any> {
        // Check if reservation exists
        await this.findById(id);

        try {
            const updatedReservation = await prisma.bookReservation.update({
                where: { id },
                data: {
                    ...(updateReservationDto.status && { status: updateReservationDto.status }),
                },
                include: {
                    book: {
                        select: {
                            id: true,
                            title: true,
                            author: true,
                            isbn: true,
                            coverImage: true,
                            availableCopies: true,
                        },
                    },
                },
            });

            // Check if we need to update book status
            if (updateReservationDto.status) {
                await this.updateBookStatusAfterReservationChange(updatedReservation.bookId);
            }

            return updatedReservation;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Delete reservation
     */
    async delete(id: string): Promise<void> {
        // Check if reservation exists
        await this.findById(id);

        await prisma.bookReservation.delete({
            where: { id },
        });
    }

    /**
     * Get user's reservations summary
     */
    async getUserReservationsSummary(userId: string): Promise<any> {
        const [activeReservations, pendingReservations, expiredReservations, fulfilledReservations] = await Promise.all([
            prisma.bookReservation.findMany({
                where: { 
                    userId: userId, 
                    status: 'PENDING',
                    expiresAt: { gte: new Date() }
                },
                include: {
                    book: {
                        select: {
                            id: true,
                            title: true,
                            author: true,
                            isbn: true,
                            coverImage: true,
                        },
                    },
                },
                orderBy: { expiresAt: 'asc' },
            }),
            prisma.bookReservation.findMany({
                where: { 
                    userId: userId, 
                    status: 'PENDING',
                    expiresAt: { gte: new Date() }
                },
                include: {
                    book: {
                        select: {
                            id: true,
                            title: true,
                            author: true,
                            isbn: true,
                            coverImage: true,
                        },
                    },
                },
                orderBy: { reservedAt: 'desc' },
            }),
            prisma.bookReservation.findMany({
                where: { 
                    userId: userId, 
                    status: 'PENDING',
                    expiresAt: { lt: new Date() }
                },
                include: {
                    book: {
                        select: {
                            id: true,
                            title: true,
                            author: true,
                            isbn: true,
                            coverImage: true,
                        },
                    },
                },
                orderBy: { expiresAt: 'desc' },
            }),
            prisma.bookReservation.findMany({
                where: { 
                    userId: userId,
                    status: 'FULFILLED'
                },
                include: {  
                    book: {
                        select: {
                            id: true,
                            title: true,
                            author: true,
                            isbn: true,
                            coverImage: true,
                        },
                    },
                },
                orderBy: { reservedAt: 'desc' },
            }),
        ]);

        return {
            activeReservations,
            pendingReservations,    
            expiredReservations,
            fulfilledReservations,
        };
    }

    /**
     * Get reservations statistics
     */
    async getReservationsStatistics(): Promise<any> {
        const [
            totalReservations,
            pendingReservations,
            fulfilledReservations,
            cancelledReservations,
            expiredReservations,
            reservationsByStatus,
            mostRequestedBooks
        ] = await Promise.all([
            prisma.bookReservation.count(),
            prisma.bookReservation.count({ where: { status: 'PENDING' } }),
            prisma.bookReservation.count({ where: { status: 'FULFILLED' } }),
            prisma.bookReservation.count({ where: { status: 'CANCELLED' } }),
            prisma.bookReservation.count({ 
                where: { 
                    status: 'PENDING',
                    expiresAt: { lt: new Date() }
                } 
            }),
            prisma.bookReservation.groupBy({
                by: ['status'],
                _count: { id: true },
            }),
            prisma.bookReservation.groupBy({
                by: ['bookId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
        ]);

        // Get book titles for most requested books
        const mostRequestedBooksWithTitles = await Promise.all(
            mostRequestedBooks.map(async (item: any) => {
                const book = await prisma.book.findUnique({
                    where: { id: item.bookId },
                    select: { title: true },
                });
                return {
                    bookId: item.bookId,
                    title: book?.title || 'Unknown',
                    reservationCount: item._count.id,
                };
            })
        );

        return {
            totalReservations,
            pendingReservations,
            fulfilledReservations,
            cancelledReservations,
            expiredReservations,
            reservationsByStatus: reservationsByStatus.map((item: any) => ({
                status: item.status,
                count: item._count.id,
            })),
            mostRequestedBooks: mostRequestedBooksWithTitles,
        };
    }

    /**
     * Process expired reservations
     */
    async processExpiredReservations(): Promise<any> {
        const expiredReservations = await prisma.bookReservation.findMany({
            where: {
                status: 'PENDING',
                expiresAt: { lt: new Date() }
            }
        });

        if (expiredReservations.length === 0) {
            return { processed: 0, message: 'No expired reservations found' };
        }

        // Mark expired reservations
        await prisma.bookReservation.updateMany({
            where: {
                status: 'PENDING',
                expiresAt: { lt: new Date() }
            },
            data: {
                status: 'EXPIRED'
            }
        });

        // Update book statuses for books that had expired reservations
        const bookIdsWithExpiredReservations = [...new Set(expiredReservations.map((r: any) => r.bookId))];
        
        for (const bookId of bookIdsWithExpiredReservations) {
            await this.updateBookStatusAfterReservationChange(bookId as string);
        }

        return { 
            processed: expiredReservations.length, 
            message: `Processed ${expiredReservations.length} expired reservations` 
        };
    }

    /**
     * Bulk cancel reservations
     */
    async bulkCancel(reservationIds: string[], _cancellationReason?: string): Promise<any> {
        const existingReservations = await prisma.bookReservation.findMany({
            where: {
                id: { in: reservationIds },
                status: 'PENDING'
            }
        });

        if (existingReservations.length !== reservationIds.length) {
            throw new BadRequestError('Some reservations not found or not in PENDING status');
        }

        await prisma.bookReservation.updateMany({
            where: {
                id: { in: reservationIds }
            },
            data: {
                status: 'CANCELLED',
            }
        });

        // Update book statuses
        const bookIds = [...new Set(existingReservations.map((r: any) => r.bookId))];
        for (const bookId of bookIds) {
            await this.updateBookStatusAfterReservationChange(bookId as string);
        }

        return { 
            cancelled: existingReservations.length,
            message: `Cancelled ${existingReservations.length} reservations` 
        };
    }

    /**
     * Notify users about reservations (expiry, availability, etc.)
     */
    async sendReservationNotifications(): Promise<any> {
        const expiringSoonReservations = await prisma.bookReservation.findMany({
            where: {
                status: 'PENDING',
                expiresAt: {
                    gte: new Date(),
                    lte: new Date(Date.now() + this.RESERVATION_NOTIFICATION_DAYS * 24 * 60 * 60 * 1000)
                }
            },
            include: {
                book: {
                    select: {
                        title: true,
                        author: true,
                    },
                },
            },
        });

        // This is where you would send actual notifications
        // For now, we'll just return the count
        return {
            notificationsSent: expiringSoonReservations.length,
            reservations: expiringSoonReservations.map((r: any) => ({
                reservationId: r.id,
                userId: r.userId,
                bookTitle: r.book.title,
                expiresAt: r.expiresAt,
                notificationType: 'EXPIRING_SOON'
            }))
        };
    }

    /**
     * Update book status after reservation change
     */
    private async updateBookStatusAfterReservationChange(bookId: string): Promise<void> {
        const book = await prisma.book.findUnique({
            where: { id: bookId },
            select: {
                availableCopies: true,
                totalCopies: true,
                status: true
            }
        });

        if (!book) return;

        const activeReservations = await prisma.bookReservation.count({
            where: {
                bookId: bookId,
                status: 'PENDING',
                expiresAt: { gt: new Date() }
            }
        });

        const newStatus = book.availableCopies > 0 ? 'AVAILABLE' : 
                         activeReservations > 0 ? 'RESERVED' : 'AVAILABLE';

        if (newStatus !== book.status) {
            await prisma.book.update({
                where: { id: bookId },
                data: { status: newStatus as any }
            });
        }
    }

    /**
     * Get overdue (expired) reservations
     */
    async getExpiredReservations(options: ReservationQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, expired: true });
    }

    /**
     * Get pending reservations
     */
    async getPendingReservations(options: ReservationQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, pending: true });
    }
}
