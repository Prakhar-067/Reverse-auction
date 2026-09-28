const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');
const setupSocket = require('./sockets');
const { startAuctionTimerJob } = require('./jobs/auctionTimer');

const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocket(io);

const { ensureAdminUser } = require('./services/adminInitializer');

// Start server
const start = async () => {
  try {
    await connectDB();
    await ensureAdminUser();
    
    server.listen(config.port, () => {
      console.log(`\n🚀 Server running on port ${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API: http://localhost:${config.port}/api/health`);
      console.log(`🌐 Client: ${config.clientUrl}\n`);
    });

    // Start background jobs
    startAuctionTimerJob();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
