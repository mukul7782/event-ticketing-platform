const { prisma } = require('../config/prisma');

class HealthService {
  async getHealth() {
    const memoryUsage = process.memoryUsage();

    let dbStatus = 'DOWN';
    let dbLatencyMs;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = 'UP';
    } catch {
      dbStatus = 'DOWN';
    }

    return {
      status: dbStatus === 'UP' ? 'UP' : 'DOWN',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        rssMb: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotalMb: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsedMb: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      },
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
    };
  }
}

module.exports = { HealthService };