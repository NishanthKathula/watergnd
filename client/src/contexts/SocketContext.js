import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Listen for real-time updates
      newSocket.on('new-reading', (data) => {
        console.log('New reading received:', data);
        // You can emit a custom event or update state here
        toast.success(`New reading from station: ${data.reading.waterLevel}m`);
      });

      newSocket.on('station-alert', (data) => {
        console.log('Station alert received:', data);
        toast.error(`Alert: ${data.message}`, {
          duration: 6000,
        });
      });

      newSocket.on('maintenance-alert', (data) => {
        console.log('Maintenance alert received:', data);
        toast(`Maintenance: ${data.message}`, {
          icon: '🔧',
          duration: 5000,
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Clean up socket if not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, token, socket]);

  const subscribeToStation = (stationId) => {
    if (socket && isConnected) {
      socket.emit('subscribe-station', stationId);
      console.log(`Subscribed to station: ${stationId}`);
    }
  };

  const unsubscribeFromStation = (stationId) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe-station', stationId);
      console.log(`Unsubscribed from station: ${stationId}`);
    }
  };

  const emitEvent = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const value = {
    socket,
    isConnected,
    subscribeToStation,
    unsubscribeFromStation,
    emitEvent
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
