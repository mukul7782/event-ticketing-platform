const { HealthService } = require('../services/health.service');
const { ResponseFormatter } = require('../utils/responseFormatter');
const { asyncHandler } = require('../utils/asyncHandler');

class HealthController {
  constructor() {
    this.healthService = new HealthService();
  }

  checkHealth = asyncHandler(async (_req, res) => {
    const health = await this.healthService.getHealth();
    const httpCode = health.status === 'UP' ? 200 : 503;

    return ResponseFormatter.success(
      res,
      health,
      `System status is ${health.status}`,
      httpCode
    );
  });
}

module.exports = { HealthController };