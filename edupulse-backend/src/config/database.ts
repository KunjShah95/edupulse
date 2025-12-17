import { PrismaClient } from '@prisma/client';
import config from './index.js';

// Prevent multiple instances in development (hot reloading)
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: config.env === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
        errorFormat: config.env === 'development' ? 'pretty' : 'minimal',
    });

if (config.env !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Connection handling
export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}

export async function disconnectDatabase(): Promise<void> {
    await prisma.$disconnect();
    console.log('📤 Database disconnected');
}

export default prisma;
