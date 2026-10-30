const { Router } = require('express');
const { BookingController } = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/authenticate');

const router = Router();
const bookingController = new BookingController();

router.use(authenticate);

router.post('/reserve', bookingController.reserve);
router.post('/:bookingId/confirm', bookingController.confirm);
router.get('/my', bookingController.getMyBookings);

module.exports = router;