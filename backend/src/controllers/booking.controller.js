const { BookingService } = require('../services/booking.service');
const { ResponseFormatter } = require('../utils/responseFormatter');
const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../utils/appError');

class BookingController {
  constructor() {
    this.bookingService = new BookingService();
  }

  reserve = asyncHandler(async (req, res) => {
    const { eventId, seatIds } = req.body;
    if (!eventId || !seatIds) {
      throw AppError.badRequest('eventId and seatIds are required');
    }

    const booking = await this.bookingService.reserveSeats(req.user.id, eventId, seatIds);
    return ResponseFormatter.success(res, booking, 'Seats reserved successfully. Please complete payment within 10 minutes.', 201);
  });

  confirm = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    if (!bookingId) {
      throw AppError.badRequest('bookingId parameter is required');
    }

    const booking = await this.bookingService.confirmBooking(bookingId, req.user.id);
    return ResponseFormatter.success(res, booking, 'Booking confirmed successfully', 200);
  });

  getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await this.bookingService.getUserBookings(req.user.id);
    return ResponseFormatter.success(res, bookings, 'User bookings retrieved successfully', 200);
  });
}

module.exports = { BookingController };