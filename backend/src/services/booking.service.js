const { prisma } = require('../config/prisma');
const { AppError } = require('../utils/appError');
const { SocketEngine } = require('../socket/socket.server');

class BookingService {
  async reserveSeats(userId, eventId, seatIds) {
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      throw AppError.badRequest('At least one seat ID must be provided');
    }

    const HOLD_DURATION_MS = 10 * 60 * 1000; // 10 minutes hold
    const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);

    // PostgreSQL ACID Transaction with Row-Level Locking (Pessimistic FOR UPDATE)
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Lock candidate seat rows against all concurrent transactions
      const seats = await tx.$queryRaw`
        SELECT id, status, price, version
        FROM "Seat"
        WHERE id IN (${prisma.join(seatIds)}) AND "eventId" = ${eventId}
        FOR UPDATE
      `;

      if (seats.length !== seatIds.length) {
        throw AppError.badRequest('One or more seat IDs do not exist for this event');
      }

      // 2. Verify all locked rows are AVAILABLE
      for (const seat of seats) {
        if (seat.status !== 'AVAILABLE') {
          throw AppError.conflict(`Seat ${seat.id} is already reserved or booked by another buyer`);
        }
      }

      const totalAmount = seats.reduce((sum, s) => sum + Number(s.price), 0);

      // 3. Transition Seat Status to LOCKED
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { status: 'LOCKED' },
      });

      // 4. Create Pending Booking with booking items
      return tx.booking.create({
        data: {
          userId,
          eventId,
          totalAmount,
          status: 'PENDING',
          expiresAt,
          items: {
            create: seats.map((s) => ({
              seatId: s.id,
              price: s.price,
            })),
          },
        },
        include: {
          items: {
            include: { seat: true },
          },
        },
      });
    });

    // 5. Broadcast real-time status update to all event room clients
    const socketEngine = SocketEngine.getInstance();
    if (socketEngine) {
      socketEngine.broadcastSeatStatus(eventId, seatIds, 'LOCKED');
    }

    return booking;
  }

  async confirmBooking(bookingId, userId) {
    const { confirmed, seatIds, eventId } = await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { items: true },
      });

      if (!existing || existing.userId !== userId) {
        throw AppError.notFound('Booking not found');
      }

      if (existing.status !== 'PENDING') {
        throw AppError.badRequest(`Cannot confirm booking in '${existing.status}' status`);
      }

      if (new Date() > existing.expiresAt) {
        const expiredSeatIds = existing.items.map((i) => i.seatId);
        await tx.seat.updateMany({
          where: { id: { in: expiredSeatIds } },
          data: { status: 'AVAILABLE' },
        });
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'EXPIRED' },
        });
        throw AppError.badRequest('Booking reservation has expired');
      }

      const seatIds = existing.items.map((i) => i.seatId);

      // Permanently mark seats as BOOKED
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { status: 'BOOKED' },
      });

      // Update Booking status to CONFIRMED
      const confirmed = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
        include: { items: { include: { seat: true } } },
      });

      return { confirmed, seatIds, eventId: existing.eventId };
    });

    // Broadcast permanent BOOKED status
    const socketEngine = SocketEngine.getInstance();
    if (socketEngine) {
      socketEngine.broadcastSeatStatus(eventId, seatIds, 'BOOKED');
    }

    return confirmed;
  }

  async getUserBookings(userId) {
    return prisma.booking.findMany({
      where: { userId },
      include: {
        event: {
          include: { venue: true },
        },
        items: {
          include: { seat: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = { BookingService };