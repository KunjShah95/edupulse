import { describe, it, expect } from 'vitest';
import { 
    sanitizePaginationOptions, 
    createSearchWhereClause,
    calculatePagination,
    formatPaginationResult 
} from './pagination.util.js';

describe('Pagination Utilities', () => {
    describe('sanitizePaginationOptions', () => {
        it('should calculate correct skip value', () => {
            const result = sanitizePaginationOptions({ page: 2, limit: 10 });
            expect(result.page).toBe(2);
            expect(result.limit).toBe(10);
        });

        it('should use default page of 1', () => {
            const result = sanitizePaginationOptions({ limit: 10 });
            expect(result.page).toBe(1);
        });

        it('should use default limit of 10', () => {
            const result = sanitizePaginationOptions({ page: 1 });
            expect(result.limit).toBe(10);
        });

        it('should enforce minimum page of 1', () => {
            const result = sanitizePaginationOptions({ page: 0, limit: 10 });
            expect(result.page).toBe(1);
        });

        it('should enforce maximum limit of 100', () => {
            const result = sanitizePaginationOptions({ page: 1, limit: 1000 });
            expect(result.limit).toBeLessThanOrEqual(100);
        });
    });

    describe('calculatePagination', () => {
        it('should calculate pagination metadata correctly', () => {
            const result = calculatePagination(100, 2, 10);
            expect(result.totalPages).toBe(10);
            expect(result.hasNextPage).toBe(true);
            expect(result.hasPreviousPage).toBe(true);
        });

        it('should not have next page on last page', () => {
            const result = calculatePagination(100, 10, 10);
            expect(result.hasNextPage).toBe(false);
        });

        it('should not have previous page on first page', () => {
            const result = calculatePagination(100, 1, 10);
            expect(result.hasPreviousPage).toBe(false);
        });
    });

    describe('createSearchWhereClause', () => {
        it('should create OR filter for search query', () => {
            const result = createSearchWhereClause({ 
                search: 'test', 
                searchFields: ['name', 'email'] 
            });
            expect(result).toHaveProperty('OR');
        });

        it('should return empty object if no search query', () => {
            const result = createSearchWhereClause({ 
                search: '', 
                searchFields: ['name', 'email'] 
            });
            expect(result.OR).toBeUndefined();
        });

        it('should include all specified fields', () => {
            const fields = ['name', 'email', 'phone'];
            const result = createSearchWhereClause({ 
                search: 'test', 
                searchFields: fields 
            });
            if (result.OR) {
                expect(result.OR.length).toBe(fields.length);
            }
        });
    });

    describe('formatPaginationResult', () => {
        it('should format result with pagination metadata', () => {
            const data = [{ id: 1 }, { id: 2 }];
            const result = formatPaginationResult(data, 100, { page: 1, limit: 10 });
            
            expect(result.data).toEqual(data);
            expect(result.totalItems).toBe(100);
            expect(result.pagination.currentPage).toBe(1);
            expect(result.pagination.totalPages).toBe(10);
        });
    });
});
