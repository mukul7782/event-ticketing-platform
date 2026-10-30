const Redis = require('ioredis');
const { env } = require('./env');
const { logger } = require('./logger');

const redis = new Redis({
  
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 2000);
    logger.warn({ retry: times, delayMs: delay }, 'Redis reconnecting...');
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('✅ Redis client connected successfully');
});

redis.on('error', (err) => {
  logger.error({ err }, '❌ Redis Client Error');
});

async function connectRedis() {
  try {
    await redis.connect();
    return true;
  } catch (error) {
    logger.error({ err: error }, '❌ Redis initial connection failed');
    return false;
  }
}

async function disconnectRedis() {
  if (redis.status === 'ready' || redis.status === 'connecting') {
    await redis.quit();
    logger.info('🔌 Redis disconnected');
  }
}

module.exports = {
  redis,
  connectRedis,
  disconnectRedis,
};