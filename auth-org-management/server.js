require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');
const config = require('./src/config');

const PORT = config.server.port;

// Start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your connection settings.');
            console.log('📝 Make sure to run the migration script: migrations/init.sql');
            process.exit(1);
        }

        // Start Express server
        app.listen(PORT, () => {
            console.log('🚀 ================================');
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🚀 Environment: ${config.server.nodeEnv}`);
            console.log('🚀 ================================');
            console.log('');
            console.log('📍 API Endpoints:');
            console.log(`   Health Check: http://localhost:${PORT}/health`);
            console.log(`   Auth:         http://localhost:${PORT}/api/auth`);
            console.log(`   Users:        http://localhost:${PORT}/api/users`);
            console.log(`   Roles:        http://localhost:${PORT}/api/roles`);
            console.log(`   Organizations: http://localhost:${PORT}/api/organizations`);
            console.log('');
            console.log('📝 Auth Endpoints:');
            console.log('   POST /api/auth/signup          - Register new user');
            console.log('   POST /api/auth/verify-otp      - Verify email OTP');
            console.log('   POST /api/auth/login           - Login with email/password');
            console.log('   GET  /api/auth/google          - Google OAuth login');
            console.log('   POST /api/auth/forgot-password - Request password reset');
            console.log('   POST /api/auth/reset-password  - Reset password with OTP');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer();
