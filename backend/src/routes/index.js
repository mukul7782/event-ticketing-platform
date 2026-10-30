const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const bookingRoutes = require('./booking.routes');

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/bookings', bookingRoutes);

module.exports = router;