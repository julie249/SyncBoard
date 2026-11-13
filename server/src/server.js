import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocketServer } from './sockets/socketHandler.js';
import { ENV } from './config/env.js';

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = http.createServer(app);
    initSocketServer(httpServer);

    httpServer.listen(ENV.PORT, '0.0.0.0', () => {
      console.log(`[SyncBoard Server] Listening on port ${ENV.PORT} on 0.0.0.0 in ${ENV.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error(`Failed to start server:`, error);
    process.exit(1);
  }
};

startServer();
