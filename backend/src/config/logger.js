const pino = require('pino');
const { env } = require('./env');

const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    env: env.NODE_ENV,
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

module.exports = { logger };