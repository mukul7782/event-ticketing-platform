const { Router } = require('express');
const { HealthController } = require('../controllers/health.controller');

const router = Router();
const healthController = new HealthController();

router.get('/health', healthController.checkHealth);

module.exports = router;