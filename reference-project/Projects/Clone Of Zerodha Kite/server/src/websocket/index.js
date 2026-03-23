const { Server } = require('socket.io');
const stockService = require('../services/stockService');

let io;

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
    let subscribedSymbols = new Set();

    socket.on('subscribe:stock', async (symbol) => {
      subscribedSymbols.add(symbol.toUpperCase());
      console.log(`${socket.id} subscribed to ${symbol}`);

      // Send initial quote immediately
      try {
        const quote = await stockService.getQuote(symbol.toUpperCase());
        socket.emit('stock:quote', { symbol: symbol.toUpperCase(), quote });
      } catch (e) {
        console.error('Initial quote error:', e.message);
      }
    });

    socket.on('unsubscribe:stock', (symbol) => {
      subscribedSymbols.delete(symbol.toUpperCase());
      console.log(`${socket.id} unsubscribed from ${symbol}`);
    });

    socket.on('subscribe:watchlist', async (symbols) => {
      for (const s of symbols) {
        subscribedSymbols.add(s.toUpperCase());
      }
    });

    // Price streaming — send updates every 5 seconds
    priceInterval = setInterval(async () => {
      for (const symbol of subscribedSymbols) {
        try {
          const quote = await stockService.getQuote(symbol);
          socket.emit('stock:quote', { symbol, quote });
        } catch (e) {
          // Skip failed quotes silently
        }
      }
    }, 5000);

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
