import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socket.on('stock:quote', ({ symbol, quote }) => {
      const callback = listenersRef.current.get(symbol);
      if (callback) callback(quote);
    });

    socket.on('market:update', (data) => {
      setMarketData(data);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribeStock = useCallback((symbol, callback) => {
    listenersRef.current.set(symbol, callback);
    socketRef.current?.emit('subscribe:stock', symbol);
    return () => {
      listenersRef.current.delete(symbol);
      socketRef.current?.emit('unsubscribe:stock', symbol);
    };
  }, []);

  const subscribeWatchlist = useCallback((symbols) => {
    socketRef.current?.emit('subscribe:watchlist', symbols);
  }, []);

  return (
    <WebSocketContext.Provider value={{ connected, marketData, subscribeStock, subscribeWatchlist }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
};
