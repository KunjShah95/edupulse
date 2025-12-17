import { FastifyInstance } from 'fastify';

async function healthRoutes(app: FastifyInstance): Promise<void> {
    // Basic health check
    app.get('/', {
        schema: {
            tags: ['Health'],
            summary: 'Health check',
            description: 'Returns server health status',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        uptime: { type: 'number' },
                        version: { type: 'string' },
                    },
                },
            },
        },
    }, async () => {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
        };
    });

    // Detailed health check
    app.get('/detailed', {
        schema: {
            tags: ['Health'],
            summary: 'Detailed health check',
            description: 'Returns detailed server health including database status',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        uptime: { type: 'number' },
                        version: { type: 'string' },
                        memory: { type: 'object' },
                        database: { type: 'object' },
                    },
                },
            },
        },
    }, async () => {
        const memoryUsage = process.memoryUsage();

        // Check database connection
        let dbStatus = 'healthy';
        let dbLatency = 0;

        try {
            const start = Date.now();
            const { prisma } = await import('../../config/database.js');
            await prisma.$queryRaw`SELECT 1`;
            dbLatency = Date.now() - start;
        } catch {
            dbStatus = 'unhealthy';
        }

        return {
            status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
            },
            database: {
                status: dbStatus,
                latency: dbLatency + 'ms',
            },
        };
    });
}

export default healthRoutes;
