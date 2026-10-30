const { PrismaClient } = require('@prisma/client');
const { logger } = require('./logger');
const { env } = require('./env');

const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

async function connectPrisma() {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL database connected via Prisma');
    return true;
  } catch (error) {
    logger.error({ err: error }, '❌ PostgreSQL database connection failed');
    return false;
  }
}

async function disconnectPrisma() {
  await prisma.$disconnect();
  logger.info('🔌 PostgreSQL database disconnected');
}

module.exports = {
  prisma,
  connectPrisma,
  disconnectPrisma,
};