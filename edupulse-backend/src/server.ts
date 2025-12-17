import { buildApp } from './app.js';
import config, { validateConfig } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { initializeSentry, registerSentryHooks } from './services/sentry.service.js';

async function main(): Promise<void> {
    try {
        // Initialize Sentry error tracking
        initializeSentry();

        // Validate configuration
        validateConfig();

        // Connect to database
        await connectDatabase();

        // Build and start server
        const app = await buildApp();

        // Register Sentry hooks
        await registerSentryHooks(app);

        await app.listen({
            port: config.port,
            host: config.host,
        });

        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎓 EduPulse Backend Server                                  ║
║                                                               ║
║   Environment: ${config.env.padEnd(44)}║
║   Server:      http://${config.host}:${config.port}${' '.repeat(Math.max(0, 36 - `http://${config.host}:${config.port}`.length))}║
║   API Docs:    http://localhost:${config.port}/docs${' '.repeat(Math.max(0, 28 - String(config.port).length))}║
║   Health:      http://localhost:${config.port}/health${' '.repeat(Math.max(0, 26 - String(config.port).length))}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);

        // Graceful shutdown
        const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

        for (const signal of signals) {
            process.on(signal, async () => {
                console.log(`\n📤 Received ${signal}, shutting down gracefully...`);

                await app.close();

                console.log('✅ Server closed');
                process.exit(0);
            });
        }

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

main();
