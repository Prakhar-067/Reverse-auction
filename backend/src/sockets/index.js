const jwt = require('jsonwebtoken');
const config = require('../config');
const NotificationService = require('../services/notificationService');

const setupSocket = (io) => {
  NotificationService.setIO(io);

  // Authentication middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
      } catch {
        next(new Error('Authentication error'));
      }
    } else {
      // Allow unauthenticated connections for public auction viewing
      socket.userId = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}, User: ${socket.userId || 'Guest'}`);

    // Join user-specific room for notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join auction room
    socket.on('auction:join', (auctionId) => {
      socket.join(`auction:${auctionId}`);
      console.log(`User ${socket.userId} joined auction room: ${auctionId}`);
      
      io.to(`auction:${auctionId}`).emit('auction:joined', {
        userId: socket.userId,
        auctionId,
        message: 'A participant joined the auction.',
      });
    });

    // Leave auction room
    socket.on('auction:leave', (auctionId) => {
      socket.leave(`auction:${auctionId}`);
      console.log(`User ${socket.userId} left auction room: ${auctionId}`);
    });

    // Request server time (for timer synchronization)
    socket.on('time:sync', (callback) => {
      if (typeof callback === 'function') {
        callback({ serverTime: new Date().toISOString() });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;
