import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const THROTTLE_MS = 400;

function throttle(callback, ms) {
  let last = 0;
  let timer = null;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      callback(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        last = Date.now();
        callback(...args);
      }, ms - (now - last));
    }
  };
}

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const listenersRef = useRef(new Map());
  const throttledRef = useRef(new Map());

  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('stock:quote', ({ symbol, quote }) => {
      const callback = listenersRef.current.get(symbol);
      if (!callback) return;
      let th = throttledRef.current.get(symbol);
      if (!th) {
        th = throttle(callback, THROTTLE_MS);
        throttledRef.current.set(symbol, th);
      }
      th(quote);
    });

    socket.on('market:update', (data) => {
      setMarketData(data);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      throttledRef.current.clear();
    };
  }, []);

  const subscribeStock = useCallback((symbol, callback) => {
    const sym = (symbol && symbol.toUpperCase()) || '';
    if (!sym) return () => {};
    listenersRef.current.set(sym, callback);
    socketRef.current?.emit('subscribe:stock', sym);
    return () => {
      listenersRef.current.delete(sym);
      throttledRef.current.delete(sym);
      socketRef.current?.emit('unsubscribe:stock', sym);
    };
  }, []);

  const subscribeWatchlist = useCallback((symbols) => {
    const list = Array.isArray(symbols)
      ? symbols.map((s) => (typeof s === 'string' ? s.toUpperCase() : s?.symbol?.toUpperCase())).filter(Boolean)
      : [];
    socketRef.current?.emit('subscribe:watchlist', list);
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
