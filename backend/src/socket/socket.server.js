const { Server } = require('socket.io');
const { env } = require('../config/env');
const { logger } = require('../config/logger');

let instance = null;

class SocketEngine {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
        methods: ['GET', 'POST'],
      },
    });

    this.setupListeners();
    instance = this;
    logger.info('✅ WebSocket Engine initialized (in-memory mode)');
  }

  setupListeners() {
    this.io.on('connection', (socket) => {
      logger.info(`🔌 Socket client connected: ${socket.id}`);

      socket.on('join_event_room', (eventId) => {
        socket.join(`event:${eventId}`);
        logger.info(`Socket ${socket.id} joined room event:${eventId}`);
      });

      socket.on('leave_event_room', (eventId) => {
        socket.leave(`event:${eventId}`);
        logger.info(`Socket ${socket.id} left room event:${eventId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`🔌 Socket client disconnected: ${socket.id}`);
      });
    });
  }

  broadcastSeatStatus(eventId, seatIds, status) {
    if (this.io) {
      this.io.to(`event:${eventId}`).emit('seat_status_changed', {
        eventId,
        seatIds,
        status,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static getInstance() {
    return instance;
  }
}

module.exports = { SocketEngine };