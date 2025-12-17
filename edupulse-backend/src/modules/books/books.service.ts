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
export interface CreateBookDto {
    isbn: string;
    title: string;
    author: string;
    publisher?: string;
    publishYear?: number;
    edition?: string;
    category: string;
    description?: string;
    coverImage?: string;
    totalCopies?: number;
    location?: string;
}

export interface UpdateBookDto {
    title?: string;
    author?: string;
    publisher?: string;
    publishYear?: number;
    edition?: string;
    category?: string;
    description?: string;
    coverImage?: string;
    totalCopies?: number;
    availableCopies?: number;
    location?: string;
}

export interface BookQueryOptions extends PaginationOptions {
    search?: string;
    isbn?: string;
    author?: string;
    category?: string;
    status?: string;
    available?: boolean;
}

// Service class
export class BooksService {
    /**
     * Create a new book
     */
    async create(createBookDto: CreateBookDto): Promise<any> {
        // Check if ISBN already exists
        const existingBook = await prisma.book.findUnique({
            where: { isbn: createBookDto.isbn }
        });

        if (existingBook) {
            throw new ConflictError('Book with this ISBN already exists');
        }

        try {
            const totalCopies = createBookDto.totalCopies || 1;
            const book = await prisma.book.create({
                data: {
                    ...createBookDto,
                    totalCopies,
                    availableCopies: totalCopies,
                },
                include: {
                        _count: {
                            select: {
                                loans: true,
                                reservations: true,
                            }
                        }
                    },
            });

            return book;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Book already exists');
            }
            throw error;
        }
    }

    /**
     * Get all books with pagination and filtering
     */
    async findAll(options: BookQueryOptions = {}): Promise<PaginationResult<any>> {
        const { page, limit, sortBy, sortOrder } = sanitizePaginationOptions(options);
        const { search, isbn, author, category, status, available } = options;

        // Build search and filter conditions
        const where = createSearchWhereClause({
            search,
            searchFields: ['title', 'author', 'isbn', 'description'],
            filters: {
                ...(isbn && { isbn }),
                ...(author && { author: { contains: author, mode: 'insensitive' } }),
                ...(category && { category }),
                ...(status && { status: status as any }),
                ...(available !== undefined && { 
                    availableCopies: available ? { gt: 0 } : 0 
                }),
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.book.count({ where });

        // Get books with pagination
        const books = await prisma.book.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                _count: {
                    select: {
                        loans: true,
                        reservations: true,
                    }
                }
            },
        });

        return formatPaginationResult(books, totalItems, options);
    }

    /**
     * Get book by ID
     */
    async findById(id: string): Promise<any> {
        const book = await prisma.book.findUnique({
            where: { id },
                include: {
                    loans: {
                        where: { status: 'ACTIVE' },
                        include: {
                            student: {
                                include: {
                                    user: {
                                        select: {
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                        }
                                    }
                                }
                            }
                        }
                    },
                    reservations: {
                        where: { status: 'PENDING' },
                        select: {
                            id: true,
                            userId: true,
                            reservedAt: true,
                            expiresAt: true,
                            status: true,
                        }
                    },
                    _count: {
                        select: {
                            loans: true,
                            reservations: true,
                        }
                    }
                },
        });

        if (!book) {
            throw new NotFoundError('Book not found');
        }

        return book;
    }

    /**
     * Get book by ISBN
     */
    async findByIsbn(isbn: string): Promise<any> {
        const book = await prisma.book.findUnique({
            where: { isbn },
            include: {
                _count: {
                    select: {
                        loans: true,
                        reservations: true,
                    }
                }
            },
        });

        if (!book) {
            throw new NotFoundError('Book not found');
        }

        return book;
    }

    /**
     * Search books by title or author
     */
    async searchBooks(query: string, options: BookQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({
            ...options,
            search: query,
        });
    }

    /**
     * Get books by category
     */
    async findByCategory(category: string, options: BookQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({
            ...options,
            category,
        });
    }

    /**
     * Get available books
     */
    async findAvailableBooks(options: BookQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({
            ...options,
            available: true,
        });
    }

    /**
     * Update book
     */
    async update(id: string, updateBookDto: UpdateBookDto): Promise<any> {
        // Check if book exists
        await this.findById(id);

        // If ISBN is being updated, check for conflicts
        if (updateBookDto.title || updateBookDto.author) {
            // ISBN updates are not allowed to prevent conflicts
        }

        try {
            const book = await prisma.book.update({
                where: { id },
                data: updateBookDto,
                include: {
                    _count: {
                        select: {
                            loans: true,
                            reservations: true,
                        }
                    }
                },
            });

            return book;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Book with this ISBN already exists');
            }
            throw error;
        }
    }

    /**
     * Delete book
     */
    async delete(id: string): Promise<void> {
        // Check if book exists and has no active loans
        const book = await this.findById(id);

        if (book._count.loans > 0) {
            throw new BadRequestError('Cannot delete book with active loans');
        }

        await prisma.book.delete({
            where: { id },
        });
    }

    /**
     * Update book availability
     */
    async updateAvailability(id: string, borrowed: boolean = true): Promise<any> {
        const book = await this.findById(id);

        if (borrowed) {
            if (book.availableCopies <= 0) {
                throw new BadRequestError('No copies available');
            }
        } else {
            if (book.availableCopies >= book.totalCopies) {
                throw new BadRequestError('All copies are already available');
            }
        }

        const updatedBook = await prisma.book.update({
            where: { id },
            data: {
                availableCopies: borrowed 
                    ? book.availableCopies - 1 
                    : book.availableCopies + 1,
                status: borrowed 
                    ? (book.availableCopies - 1 > 0 ? 'AVAILABLE' : 'BORROWED')
                    : 'AVAILABLE'
            },
        });

        return updatedBook;
    }

    /**
     * Get books statistics
     */
    async getBooksStatistics(): Promise<any> {
        const [totalBooks, availableBooks, borrowedBooks, booksByCategory] = await Promise.all([
            prisma.book.count(),
            prisma.book.count({ where: { availableCopies: { gt: 0 } } }),
            prisma.book.count({ where: { availableCopies: 0 } }),
            prisma.book.groupBy({
                by: ['category'],
                _count: {
                    id: true,
                },
            }),
        ]);

        const categoryDistribution = booksByCategory.map(item => ({
            category: item.category,
            count: item._count.id,
        }));

        // Get total active loans
        const totalActiveLoans = await prisma.bookLoan.count({
            where: { status: 'ACTIVE' }
        });

        // Get total pending reservations
        const totalPendingReservations = await prisma.bookReservation.count({
            where: { status: 'PENDING' }
        });

        return {
            totalBooks,
            availableBooks,
            borrowedBooks,
            categoryDistribution,
            totalActiveLoans,
            totalPendingReservations,
        };
    }

    /**
     * Get popular books (most borrowed)
     */
    async getPopularBooks(limit: number = 10): Promise<any[]> {
        const popularBooks = await prisma.book.findMany({
            take: limit,
            orderBy: {
                loans: {
                    _count: 'desc'
                }
            },
            include: {
                _count: {
                    select: {
                        loans: true,
                    }
                }
            },
        });

        return popularBooks;
    }

    /**
     * Get books by author
     */
    async findByAuthor(author: string, options: BookQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({
            ...options,
            author,
        });
    }

    /**
     * Get recently added books
     */
    async getRecentBooks(limit: number = 10): Promise<any[]> {
        const recentBooks = await prisma.book.findMany({
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                _count: {
                    select: {
                        loans: true,
                    }
                }
            },
        });

        return recentBooks;
    }

    /**
     * Check book availability
     */
    async checkAvailability(id: string): Promise<any> {
        const book = await this.findById(id);

        return {
            bookId: book.id,
            title: book.title,
            totalCopies: book.totalCopies,
            availableCopies: book.availableCopies,
            isAvailable: book.availableCopies > 0,
            waitingList: book._count.reservations,
        };
    }
}

// Export singleton instance
export const booksService = new BooksService();

export default booksService;
