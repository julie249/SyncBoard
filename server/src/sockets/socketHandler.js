import { Server } from 'socket.io';
import { verifyToken } from '../utils/tokens.js';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Board } from '../models/Board.js';
import { ENV } from '../config/env.js';

let ioInstance = null;

export const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ENV.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = verifyToken(token);
      if (!decoded || !decoded.id) {
        return next(new Error('Invalid authentication token'));
      }

      const user = await User.findById(decoded.id).select('name email avatar');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    // Automatically join private user channel for direct notifications
    socket.join(`user:${userId}`);

    // Join workspace room after verifying membership
    socket.on('workspace:join', async ({ workspaceId }) => {
      try {
        if (!workspaceId) return;
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return;

        const isMember =
          workspace.owner.toString() === userId ||
          workspace.members.some(
            (m) => (m.user?._id ? m.user._id.toString() : m.user.toString()) === userId
          );

        if (isMember) {
          socket.join(`workspace:${workspaceId}`);
        }
      } catch (error) {
        console.error('Error joining workspace room:', error);
      }
    });

    socket.on('workspace:leave', ({ workspaceId }) => {
      if (workspaceId) {
        socket.leave(`workspace:${workspaceId}`);
      }
    });

    // Join board room after verifying board exists & user belongs to its workspace
    socket.on('board:join', async ({ boardId }) => {
      try {
        if (!boardId) return;
        const board = await Board.findById(boardId);
        if (!board) return;

        const workspace = await Workspace.findById(board.workspace);
        if (!workspace) return;

        const isMember =
          workspace.owner.toString() === userId ||
          workspace.members.some(
            (m) => (m.user?._id ? m.user._id.toString() : m.user.toString()) === userId
          );

        if (isMember) {
          socket.join(`board:${boardId}`);
        }
      } catch (error) {
        console.error('Error joining board room:', error);
      }
    });

    socket.on('board:leave', ({ boardId }) => {
      if (boardId) {
        socket.leave(`board:${boardId}`);
      }
    });

    socket.on('disconnect', () => {
      // Cleaned up automatically by Socket.IO
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => ioInstance;
