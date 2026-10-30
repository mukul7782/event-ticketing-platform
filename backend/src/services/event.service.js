const { prisma } = require('../config/prisma');
const { AppError } = require('../utils/appError');

class EventService {
  async getAllEvents() {
    return prisma.event.findMany({
      include: {
        venue: {
          select: { name: true, location: true, capacity: true },
        },
        _count: {
          select: { seats: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getEventById(eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: true,
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!event) {
      throw AppError.notFound('Event not found');
    }

    return event;
  }

  async getEventSeats(eventId) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw AppError.notFound('Event not found');
    }

    return prisma.seat.findMany({
      where: { eventId },
      orderBy: [
        { section: 'asc' },
        { rowNumber: 'asc' },
        { seatNumber: 'asc' },
      ],
    });
  }
}

module.exports = { EventService };