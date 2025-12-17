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
export interface CreateLoanDto {
    bookId: string;
    borrowerId: string;
    borrowerType: 'student' | 'teacher';
    dueDate: string;
    notes?: string;
}

export interface ReturnLoanDto {
    returnDate?: string;
    conditionNotes?: string;
    fineAmount?: number;
}

export interface ExtendLoanDto {
    newDueDate: string;
    extensionReason?: string;
}

export interface UpdateLoanDto {
    dueDate?: string;
    status?: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
    conditionNotes?: string;
    fineAmount?: number;
    notes?: string;
}

export interface LoanQueryOptions extends PaginationOptions {
    borrowerId?: string;
    borrowerType?: 'student' | 'teacher';
    bookId?: string;
    status?: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
    overdue?: boolean;
    dueDateFrom?: string;
    dueDateTo?: string;
    search?: string;
}

// Service class
export class LoansService {
    private readonly LOAN_DURATION_DAYS = 14; // Default loan duration
    private readonly MAX_LOANS_PER_USER = 5; // Maximum books per user

    /**
     * Get active loans count for a user
     */
    private async getActiveLoansCount(borrowerId: string): Promise<number> {
        return await prisma.bookLoan.count({
            where: {
                studentId: borrowerId,
                status: { in: ['ACTIVE', 'OVERDUE'] }
            }
        });
    }

    /**
     * Validate borrower exists
     */
    private async validateBorrower(borrowerId: string, borrowerType: 'student' | 'teacher'): Promise<any> {
        if (borrowerType === 'student') {
            return await prisma.student.findUnique({
                where: { id: borrowerId },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
        } else if (borrowerType === 'teacher') {
            return await prisma.teacher.findUnique({
                where: { id: borrowerId },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
        }
        return null;
    }

    /**
     * Create a new loan
     */
    async create(createLoanDto: CreateLoanDto): Promise<any> {
        // Validate book availability
        const book = await prisma.book.findUnique({
            where: { id: createLoanDto.bookId },
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

        if (book.status !== 'AVAILABLE') {
            throw new BadRequestError('Book is not available for loan');
        }

        if (book.availableCopies <= 0) {
            throw new ConflictError('No copies of this book are currently available');
        }

        // Check if user has reached loan limit
        const activeLoansCount = await this.getActiveLoansCount(createLoanDto.borrowerId);
        if (activeLoansCount >= this.MAX_LOANS_PER_USER) {
            throw new BadRequestError(`You have reached the maximum loan limit of ${this.MAX_LOANS_PER_USER} books`);
        }

        // Check if user already has this book on loan
        const existingLoan = await prisma.bookLoan.findFirst({
            where: {
                bookId: createLoanDto.bookId,
                studentId: createLoanDto.borrowerId,
                status: { in: ['ACTIVE', 'OVERDUE'] }
            }
        });

        if (existingLoan) {
            throw new ConflictError('You already have this book on loan');
        }

        // Validate borrower exists
        const borrower = await this.validateBorrower(createLoanDto.borrowerId, createLoanDto.borrowerType);
        if (!borrower) {
            throw new NotFoundError(`${createLoanDto.borrowerType} not found`);
        }

        // Validate due date
        const dueDate = new Date(createLoanDto.dueDate);
        const now = new Date();
        if (dueDate <= now) {
            throw new ValidationError('Due date must be in the future');
        }

        try {
            // Create loan and update book availability in transaction
            const result = await prisma.$transaction(async (tx) => {
                // Create the loan
                const loan = await tx.bookLoan.create({
                    data: {
                        bookId: createLoanDto.bookId,
                        studentId: createLoanDto.borrowerId,
                        borrowedAt: now,
                        dueDate: dueDate,
                        status: 'ACTIVE',
                        notes: createLoanDto.notes,
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

                // Update book availability
                await tx.book.update({
                    where: { id: createLoanDto.bookId },
                    data: { availableCopies: book.availableCopies - 1 },
                });

                return loan;
            });

            return result;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictError('Loan already exists');
            }
            throw error;
        }
    }

    /**
     * Get all loans with pagination and filtering
     */
    async findAll(options: LoanQueryOptions = {}): Promise<PaginationResult<any>> {
        const { page, limit, sortBy, sortOrder } = sanitizePaginationOptions(options);
        const { borrowerId, borrowerType, bookId, status, overdue, dueDateFrom, dueDateTo, search } = options;

        // Build search and filter conditions
        const where = createSearchWhereClause({
            search,
            searchFields: ['book.title', 'book.author', 'student.user.firstName', 'student.user.lastName', 'notes'],
            filters: {
                ...(borrowerId && { studentId: borrowerId }),
                ...(bookId && { bookId }),
                ...(status && { status }),
                ...(overdue && { 
                    status: 'ACTIVE',
                    dueDate: { lt: new Date() }
                }),
                ...(dueDateFrom && dueDateTo && {
                    dueDate: {
                        gte: new Date(dueDateFrom),
                        lte: new Date(dueDateTo)
                    }
                }),
            },
        });

        // Get total count for pagination
        const totalItems = await prisma.bookLoan.count({ where });

        // Get loans with pagination
        const loans = await prisma.bookLoan.findMany({
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

        return formatPaginationResult(loans, totalItems, options);
    }

    /**
     * Get loan by ID
     */
    async findById(id: string): Promise<any> {
        const loan = await prisma.bookLoan.findUnique({
            where: { id },
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

        if (!loan) {
            throw new NotFoundError('Loan not found');
        }

        return loan;
    }

    /**
     * Get loans by borrower ID
     */
    async findByBorrowerId(borrowerId: string, options: LoanQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, borrowerId });
    }

    /**
     * Get loans by book ID
     */
    async findByBookId(bookId: string, options: LoanQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, bookId });
    }

    /**
     * Return a book
     */
    async returnBook(id: string, returnLoanDto: ReturnLoanDto): Promise<any> {
        const loan = await this.findById(id);

        if (loan.status === 'RETURNED') {
            throw new BadRequestError('Book has already been returned');
        }

        const returnDate = returnLoanDto.returnDate ? new Date(returnLoanDto.returnDate) : new Date();
        const conditionNotes = returnLoanDto.conditionNotes;
        const fineAmount = returnLoanDto.fineAmount || 0;

        try {
            // Update loan and book availability in transaction
            const result = await prisma.$transaction(async (tx) => {
                // Update loan status
                const updatedLoan = await tx.bookLoan.update({
                    where: { id },
                    data: {
                        status: 'RETURNED',
                        returnedAt: returnDate,
                        fineAmount: fineAmount,
                        finePaid: fineAmount > 0 ? false : true,
                        notes: conditionNotes ? `${loan.notes || ''}\nReturn notes: ${conditionNotes}`.trim() : loan.notes,
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

                // Update book availability
                await tx.book.update({
                    where: { id: loan.bookId },
                    data: { 
                        availableCopies: {
                            increment: 1
                        }
                    },
                });

                return updatedLoan;
            });

            return result;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Extend loan due date
     */
    async extendLoan(id: string, extendLoanDto: ExtendLoanDto): Promise<any> {
        const loan = await this.findById(id);

        if (loan.status !== 'ACTIVE') {
            throw new BadRequestError('Only active loans can be extended');
        }

        const newDueDate = new Date(extendLoanDto.newDueDate);
        const now = new Date();

        if (newDueDate <= now) {
            throw new ValidationError('New due date must be in the future');
        }

        if (newDueDate <= loan.dueDate) {
            throw new ValidationError('New due date must be later than current due date');
        }

        // Check if loan is overdue
        if (loan.dueDate < now) {
            throw new BadRequestError('Cannot extend overdue loans');
        }

        try {
            const updatedLoan = await prisma.bookLoan.update({
                where: { id },
                data: {
                    dueDate: newDueDate,
                    notes: extendLoanDto.extensionReason 
                        ? `${loan.notes || ''}\nExtension: ${extendLoanDto.extensionReason}`.trim()
                        : loan.notes,
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

            return updatedLoan;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Update loan (for staff only)
     */
    async update(id: string, updateLoanDto: UpdateLoanDto): Promise<any> {
        // Check if loan exists
        await this.findById(id);

        try {
            const updatedLoan = await prisma.bookLoan.update({
                where: { id },
                data: {
                    ...(updateLoanDto.dueDate && { dueDate: new Date(updateLoanDto.dueDate) }),
                    ...(updateLoanDto.status && { status: updateLoanDto.status }),
                    ...(updateLoanDto.fineAmount !== undefined && { fineAmount: updateLoanDto.fineAmount }),
                    ...(updateLoanDto.notes !== undefined && { notes: updateLoanDto.notes }),
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

            return updatedLoan;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Delete loan
     */
    async delete(id: string): Promise<void> {
        // Check if loan exists
        await this.findById(id);

        await prisma.bookLoan.delete({
            where: { id },
        });
    }

    /**
     * Get overdue loans
     */
    async getOverdueLoans(options: LoanQueryOptions = {}): Promise<PaginationResult<any>> {
        return this.findAll({ ...options, overdue: true });
    }

    /**
     * Get loans statistics
     */
    async getLoansStatistics(): Promise<any> {
        const [
            totalLoans,
            activeLoans,
            overdueLoans,
            returnedLoans,
            totalFines,
            loansByStatus,
            popularBooks
        ] = await Promise.all([
            prisma.bookLoan.count(),
            prisma.bookLoan.count({ where: { status: 'ACTIVE' } }),
            prisma.bookLoan.count({ 
                where: { 
                    status: 'ACTIVE',
                    dueDate: { lt: new Date() }
                } 
            }),
            prisma.bookLoan.count({ where: { status: 'RETURNED' } }),
            prisma.bookLoan.aggregate({
                _sum: { fineAmount: true },
                where: { status: 'RETURNED' }
            }),
            prisma.bookLoan.groupBy({
                by: ['status'],
                _count: { id: true },
            }),
            prisma.bookLoan.groupBy({
                by: ['bookId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
        ]);

        // Get book titles for popular books
        const popularBooksWithTitles = await Promise.all(
            popularBooks.map(async (item: any) => {
                const book = await prisma.book.findUnique({
                    where: { id: item.bookId },
                    select: { title: true },
                });
                return {
                    bookId: item.bookId,
                    title: book?.title || 'Unknown',
                    loanCount: item._count.id,
                };
            })
        );

        return {
            totalLoans,
            activeLoans,
            overdueLoans,
            returnedLoans,
            totalFines: totalFines._sum.fineAmount || 0,
            loansByStatus: loansByStatus.map((item: any) => ({
                status: item.status,
                count: item._count.id,
            })),
            popularBooks: popularBooksWithTitles,
        };
    }

    /**
     * Get user's loans summary
     */
    async getUserLoansSummary(borrowerId: string): Promise<any> {
        const [activeLoans, overdueLoans, returnedLoans] = await Promise.all([
            prisma.bookLoan.findMany({
                where: { 
                    studentId: borrowerId, 
                    status: 'ACTIVE',
                    dueDate: { gte: new Date() }
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
                orderBy: { dueDate: 'asc' },
            }),
            prisma.bookLoan.findMany({
                where: { 
                    studentId: borrowerId, 
                    status: 'ACTIVE',
                    dueDate: { lt: new Date() }
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
                orderBy: { dueDate: 'asc' },
            }),
            prisma.bookLoan.findMany({
                where: { 
                    studentId: borrowerId, 
                    status: 'RETURNED'
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
                orderBy: { returnedAt: 'desc' },
            }),
        ]);

        return {
            activeLoans,
            overdueLoans,
            returnedLoans,
            counts: {
                active: activeLoans.length,
                overdue: overdueLoans.length,
                returned: returnedLoans.length,
            },
        };
    }
}
