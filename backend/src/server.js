const http = require('http');
const { createApp } = require('./app');
const { env } = require('./config/env');
const { logger } = require('./config/logger');
const { connectPrisma, disconnectPrisma } = require('./config/prisma');
const { SocketEngine } = require('./socket/socket.server');

async function bootstrap() {
  logger.info('🚀 Starting Event Ticketing Engine (PostgreSQL Native Architecture)...');

  const dbConnected = await connectPrisma();
  if (!dbConnected) {
    logger.warn('⚠️ Server booting with DB disconnected. Background retries will continue.');
  }

  const app = createApp();
  const server = http.createServer(app);

  // Initialize Real-Time WebSockets Engine (In-Memory)
  new SocketEngine(server);

  server.listen(env.PORT, () => {
    logger.info(
      `🔥 [SERVER RUNNING] Environment: ${env.NODE_ENV} | Port: ${env.PORT} | API: ${env.API_PREFIX}`
    );
  });

  const shutdown = async (signal) => {
    logger.info(`🚨 Received ${signal}. Initiating graceful shutdown...`);

    server.close(async () => {
      logger.info('🔒 HTTP server closed.');

      try {
        await disconnectPrisma();
        logger.info('✅ Graceful shutdown completed.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, '❌ Error during shutdown cleanup');
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('⏰ Shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, '🔥 Unhandled Promise Rejection Detected');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, '🔥 Uncaught Exception Fatal Error');
    process.exit(1);
  });
}

bootstrap();