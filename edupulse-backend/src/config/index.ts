import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
    // Server
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8000', 10),
    host: process.env.HOST || '0.0.0.0',
    apiVersion: process.env.API_VERSION || 'v1',
    logLevel: process.env.LOG_LEVEL || 'info',

    // Database
    databaseUrl: process.env.DATABASE_URL || '',

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    // JWT
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },

    // OAuth
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
    },

    // Email
    email: {
        resendApiKey: process.env.RESEND_API_KEY || '',
        from: process.env.EMAIL_FROM || 'noreply@edupulse.com',
    },

    // Storage
    storage: {
        endpoint: process.env.S3_ENDPOINT || '',
        bucket: process.env.S3_BUCKET || 'edupulse-files',
        accessKey: process.env.S3_ACCESS_KEY || '',
        secretKey: process.env.S3_SECRET_KEY || '',
        region: process.env.S3_REGION || 'auto',
    },

    // CORS
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),

    // Rate Limiting
    rateLimit: {
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    },

    // Password
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),

    // Sentry Error Tracking
    sentry: {
        dsn: process.env.SENTRY_DSN || '',
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    },
} as const;

// Validate required environment variables
export function validateConfig(): void {
    const required: (keyof typeof config)[] = ['databaseUrl'];

    for (const key of required) {
        if (!config[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
    }

    if (config.env === 'production') {
        if (config.jwt.accessSecret === 'default-access-secret') {
            throw new Error('JWT_ACCESS_SECRET must be set in production');
        }
        if (config.jwt.refreshSecret === 'default-refresh-secret') {
            throw new Error('JWT_REFRESH_SECRET must be set in production');
        }
    }
}

export default config;
