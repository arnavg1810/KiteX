const { Server } = require('socket.io');
const stockService = require('../services/stockService');

let io;

const WS_QUOTE_INTERVAL_MS = 2500; // Throttle: 2.5s per cycle
const MAX_SYMBOLS_PER_SOCKET = 50;

function initWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    let priceInterval = null;
    const subscribedSymbols = new Set();

    socket.on('subscribe:stock', async (symbol) => {
      const sym = (symbol && symbol.toUpperCase()) || '';
      if (!sym) return;
      if (subscribedSymbols.size >= MAX_SYMBOLS_PER_SOCKET) return;
      subscribedSymbols.add(sym);

      try {
        const quote = await stockService.getQuote(sym);
        socket.emit('stock:quote', { symbol: sym, quote });
      } catch (e) {
        console.error('Initial quote error:', e.message);
      }
    });

    socket.on('unsubscribe:stock', (symbol) => {
      subscribedSymbols.delete((symbol && symbol.toUpperCase()) || '');
    });

    socket.on('subscribe:watchlist', (symbols) => {
      const list = Array.isArray(symbols) ? symbols : [];
      subscribedSymbols.clear();
      for (let i = 0; i < Math.min(list.length, MAX_SYMBOLS_PER_SOCKET); i++) {
        const s = list[i];
        if (s && typeof s === 'string') subscribedSymbols.add(s.toUpperCase());
      }
    });

    // Throttled price streaming
    priceInterval = setInterval(async () => {
      if (subscribedSymbols.size === 0) return;
      for (const symbol of subscribedSymbols) {
        try {
          const quote = await stockService.getQuote(symbol);
          socket.emit('stock:quote', { symbol, quote });
        } catch (e) {
          // Skip failed quotes silently
        }
      }
    }, WS_QUOTE_INTERVAL_MS);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (priceInterval) clearInterval(priceInterval);
      subscribedSymbols.clear();
    });
  });

  // Market-wide broadcasts every 30 seconds
  setInterval(async () => {
    try {
      const marketData = await getMarketSummary();
      io.emit('market:update', marketData);
    } catch (e) {
      // Skip silently
    }
  }, 30_000);

  console.log('WebSocket server initialized');
  return io;
}

async function getMarketSummary() {
  const topSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];
  const quotes = {};

  for (const s of topSymbols) {
    try {
      quotes[s] = await stockService.getQuote(s);
    } catch (e) {
      // Skip
    }
  }

  return {
    timestamp: new Date().toISOString(),
    isMarketOpen: stockService.isMarketHours(),
    topQuotes: quotes,
  };
}

function getIO() {
  return io;
}

module.exports = { initWebSocket, getIO };
