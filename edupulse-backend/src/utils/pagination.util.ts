// ========================================
// PAGINATION UTILITIES
// ========================================

export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
    // Top-level convenience fields used by route handlers
    page: number;
    limit: number;
    totalItems: number;
    data: T[];
    // Full pagination metadata
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startIndex?: number;
        endIndex?: number;
    };
    filters?: Record<string, any>;
}

// Default pagination options
const DEFAULT_PAGINATION = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
};

// Sanitize pagination options
export const sanitizePaginationOptions = (options: PaginationOptions = {}): Required<PaginationOptions> => {
    const page = Math.max(1, Number(options.page) || DEFAULT_PAGINATION.page);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || DEFAULT_PAGINATION.limit));
    const sortBy = options.sortBy || DEFAULT_PAGINATION.sortBy;
    const sortOrder = options.sortOrder || DEFAULT_PAGINATION.sortOrder;

    return { page, limit, sortBy, sortOrder };
};

// Calculate pagination metadata
export const calculatePagination = (totalItems: number, page: number, limit: number) => {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit - 1, totalItems - 1);

    return {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage,
        startIndex,
        endIndex,
    };
};

// Create Prisma findMany arguments with pagination
export const createPrismaPaginationArgs = (options: PaginationOptions = {}) => {
    const { page, limit, sortBy, sortOrder } = sanitizePaginationOptions(options);
    const skip = (page - 1) * limit;

    return {
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
    };
};

// Format pagination result
export const formatPaginationResult = <T>(
    data: T[],
    totalItems: number,
    options: PaginationOptions = {}
): PaginationResult<T> => {
    const { page, limit } = sanitizePaginationOptions(options);
    const pagination = calculatePagination(totalItems, page, limit);

    return {
        page,
        limit,
        totalItems,
        data,
        pagination,
    };
};

// Search and filter utilities
export interface SearchOptions {
    search?: string;
    searchFields?: string[];
    filters?: Record<string, any>;
}

export const createSearchWhereClause = (options: SearchOptions) => {
    const { search, searchFields = [], filters = {} } = options;
    const where: any = { ...filters };

    // Add search functionality
    if (search && searchFields.length > 0) {
        where.OR = searchFields.map(field => ({
            [field]: {
                contains: search,
                mode: 'insensitive',
            },
        }));
    }

    return where;
};

// Simple pagination for basic use cases
export const simplePaginate = <T>(array: T[], page: number = 1, limit: number = 10): PaginationResult<T> => {
    const totalItems = array.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = array.slice(startIndex, endIndex);

    const pagination = calculatePagination(totalItems, page, limit);

    return {
        page,
        limit,
        totalItems,
        data: paginatedData,
        pagination,
    };
};
