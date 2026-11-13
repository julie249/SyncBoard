import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : window.location.origin;

    const s = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      console.log('[Socket] Connected to server, ID:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isAuthenticated, token]);

  const joinBoard = (boardId) => {
    if (socketRef.current && isConnected && boardId) {
      socketRef.current.emit('board:join', { boardId });
    }
  };

  const leaveBoard = (boardId) => {
    if (socketRef.current && boardId) {
      socketRef.current.emit('board:leave', { boardId });
    }
  };

  const joinWorkspace = (workspaceId) => {
    if (socketRef.current && isConnected && workspaceId) {
      socketRef.current.emit('workspace:join', { workspaceId });
    }
  };

  const leaveWorkspace = (workspaceId) => {
    if (socketRef.current && workspaceId) {
      socketRef.current.emit('workspace:leave', { workspaceId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinBoard,
        leaveBoard,
        joinWorkspace,
        leaveWorkspace
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
