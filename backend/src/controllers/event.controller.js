const { EventService } = require('../services/event.service');
const { ResponseFormatter } = require('../utils/responseFormatter');
const { asyncHandler } = require('../utils/asyncHandler');

class EventController {
  constructor() {
    this.eventService = new EventService();
  }

  getEvents = asyncHandler(async (_req, res) => {
    const events = await this.eventService.getAllEvents();
    return ResponseFormatter.success(res, events, 'Events retrieved successfully');
  });

  getEventById = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const event = await this.eventService.getEventById(eventId);
    return ResponseFormatter.success(res, event, 'Event details retrieved successfully');
  });

  getEventSeats = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const seats = await this.eventService.getEventSeats(eventId);
    return ResponseFormatter.success(res, seats, 'Seats retrieved successfully');
  });
}

module.exports = { EventController };