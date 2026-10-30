const { Router } = require('express');
const { EventController } = require('../controllers/event.controller');

const router = Router();
const eventController = new EventController();

router.get('/', eventController.getEvents);
router.get('/:eventId', eventController.getEventById);
router.get('/:eventId/seats', eventController.getEventSeats);

module.exports = router;