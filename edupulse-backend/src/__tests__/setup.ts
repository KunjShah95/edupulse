import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { vi, beforeEach } from 'vitest';

vi.mock('@prisma/client', () => ({
    __esModule: true,
    PrismaClient: vi.fn(() => prismaMock),
}));

export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

beforeEach(() => {
    mockReset(prismaMock);
});
