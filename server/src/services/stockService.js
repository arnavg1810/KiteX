const axios = require('axios');
const { NIFTY_50_STOCKS } = require('../config/nifty50');

const TWELVEDATA_BASE = 'https://api.twelvedata.com';
const stockCache = new Map();
const CACHE_TTL = 15_000;

function getCached(key) {
  const entry = stockCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  stockCache.set(key, { data, ts: Date.now() });
}

async function getQuote(symbol) {
  const cacheKey = `quote:${symbol}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!process.env.TWELVEDATA_API_KEY) {
    const quote = generateSimulatedQuote(symbol);
    setCache(cacheKey, quote);
    return quote;
  }

  try {
    const { data } = await axios.get(`${TWELVEDATA_BASE}/quote`, {
      params: {
        symbol: `${symbol}:NSE`,
        apikey: process.env.TWELVEDATA_API_KEY,
      },
      timeout: 4000,
    });
    if (data.code) throw new Error(data.message || 'API error');
    const quote = {
      symbol: data.symbol?.replace(':NSE', '') || symbol,
      name: data.name,
      exchange: data.exchange,
      open: parseFloat(data.open),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      close: parseFloat(data.close),
      previousClose: parseFloat(data.previous_close),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      volume: parseInt(data.volume) || 0,
      timestamp: data.datetime,
      isMarketOpen: data.is_market_open,
    };
    setCache(cacheKey, quote);
    return quote;
  } catch (error) {
    return generateSimulatedQuote(symbol);
  }
}

const TIMEFRAME_CONFIG = {
  // 1D: intraday 5min bars for a single trading day (9:15 AM - 3:30 PM IST = 75 candles)
  '1D': { interval: '5min', outputsize: 75 },
  // Higher timeframes: daily candles showing exactly the required time periods
  // Data displays from latest date (right) to oldest (left)
  '1M': { interval: '1day', outputsize: 22 },    // 22 daily candles = exactly 1 month of trading days
  '5M': { interval: '1day', outputsize: 110 },   // 110 daily candles = exactly 5 months of trading days
  '1Y': { interval: '1day', outputsize: 261 },   // 261 daily candles = exactly 1 full year (365 days accounting for weekends)
};

async function getTimeSeries(symbol, interval = '5min', outputsize = 78) {
  const cacheKey = `ts:${symbol}:${interval}:${outputsize}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${TWELVEDATA_BASE}/time_series`, {
      params: {
        symbol: `${symbol}:NSE`,
        interval,
        outputsize,
        apikey: process.env.TWELVEDATA_API_KEY,
      },
    });
    if (data.code) throw new Error(data.message || 'API error');
    const series = (data.values || []).map((v) => ({
      time: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume) || 0,
    })).reverse();
    setCache(cacheKey, series);
    return series;
  } catch (error) {
    return generateSimulatedTimeSeriesByTimeframe(symbol, null, outputsize);
  }
}

async function getTimeSeriesByTimeframe(symbol, timeframe = '1D') {
  const config = TIMEFRAME_CONFIG[timeframe] || TIMEFRAME_CONFIG['1D'];
  const cacheKey = `ts:${symbol}:${timeframe}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const series = await getTimeSeries(symbol, config.interval, config.outputsize);
  setCache(cacheKey, series);
  return series;
}

async function getTimeSeriesCustom(symbol, fromStr, toStr) {
  const cacheKey = `ts:${symbol}:custom:${fromStr}:${toStr}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return getTimeSeriesByTimeframe(symbol, '1D');
  }
  const days = Math.ceil((to - from) / (24 * 60 * 60 * 1000)) + 1;
  const outputsize = Math.min(Math.max(days, 1), 365);
  const interval = days <= 1 ? '5min' : '1day';
  const size = days <= 1 ? 75 : outputsize;
  const series = await getTimeSeries(symbol, interval, size);
  setCache(cacheKey, series);
  return series;
}

async function getMultipleQuotes(symbols) {
  const pairs = await Promise.all(
    symbols.map(async (s) => {
      try {
        const quote = await getQuote(s);
        return [s, quote];
      } catch (e) {
        return [s, generateSimulatedQuote(s)];
      }
    })
  );
  return Object.fromEntries(pairs);
}

function searchStocks(query) {
  const q = query.toLowerCase();
  return NIFTY_50_STOCKS.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  ).slice(0, 10);
}

function getBasePrice(symbol) {
  const priceMap = {
    RELIANCE: 2950, TCS: 3800, HDFCBANK: 1650, INFY: 1480, ICICIBANK: 1100,
    HINDUNILVR: 2400, ITC: 440, SBIN: 780, BHARTIARTL: 1550, KOTAKBANK: 1780,
    LT: 3500, AXISBANK: 1150, ASIANPAINT: 2850, MARUTI: 12500, TITAN: 3600,
    SUNPHARMA: 1650, BAJFINANCE: 7200, WIPRO: 480, HCLTECH: 1550, TATAMOTORS: 950,
    ULTRACEMCO: 9800, NESTLEIND: 2450, NTPC: 350, POWERGRID: 280, ONGC: 260,
    'M&M': 2050, TATASTEEL: 155, JSWSTEEL: 850, ADANIENT: 3100, ADANIPORTS: 1300,
    TECHM: 1280, BAJAJFINSV: 1600, HDFCLIFE: 640, SBILIFE: 1500, DIVISLAB: 3800,
    DRREDDY: 6200, CIPLA: 1500, APOLLOHOSP: 6500, EICHERMOT: 4600, GRASIM: 2350,
    INDUSINDBK: 1450, BRITANNIA: 5200, COALINDIA: 430, BPCL: 600, TATACONSUM: 1100,
    HEROMOTOCO: 4800, HINDALCO: 580, 'BAJAJ-AUTO': 8900, UPL: 520,
  };
  return priceMap[symbol] || 1000 + Math.random() * 2000;
}

function isMarketHours() {
  const now = new Date();
  const hours = now.getUTCHours() + 5.5;
  const day = now.getDay();
  return day >= 1 && day <= 5 && hours >= 9.25 && hours <= 15.5;
}

function generateSimulatedQuote(symbol) {
  const stock = NIFTY_50_STOCKS.find((s) => s.symbol === symbol) || { name: symbol };
  const basePrice = getBasePrice(symbol);
  const change = (Math.random() - 0.48) * basePrice * 0.03;
  const close = basePrice + change;
  return {
    symbol,
    name: stock.name,
    exchange: 'NSE',
    open: basePrice + (Math.random() - 0.5) * basePrice * 0.01,
    high: close + Math.random() * basePrice * 0.015,
    low: close - Math.random() * basePrice * 0.015,
    close,
    previousClose: basePrice,
    change,
    changePercent: (change / basePrice) * 100,
    volume: Math.floor(Math.random() * 5_000_000) + 500_000,
    timestamp: new Date().toISOString(),
    isMarketOpen: isMarketHours(),
    simulated: true,
  };
}

/** NSE/BSE market hours: 9:15–15:30 IST. For 5min bars, 75 bars = 9:15 to 15:30. */
function getMarketOpenCloseTodayIST() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const date = now.getUTCDate();
  const open = new Date(Date.UTC(year, month, date, 3, 45));   // 9:15 IST = 03:45 UTC
  const close = new Date(Date.UTC(year, month, date, 10, 0));  // 15:30 IST = 10:00 UTC
  return { open, close };
}

function generateSimulatedTimeSeriesByTimeframe(symbol, timeframe, countOverride) {
  const basePrice = getBasePrice(symbol);
  const count = countOverride || 78;
  const series = [];
  let price = basePrice;
  const isIntraday = count <= 78 && count >= 75;
  
  if (isIntraday) {
    // 1D: Generate 5-min bars from today's market open (9:15 AM IST) to close (3:30 PM IST)
    const { open } = getMarketOpenCloseTodayIST();
    const msPerBar = 5 * 60 * 1000;
    for (let i = 0; i < count; i++) {
      const time = new Date(open.getTime() + i * msPerBar);
      const volatility = basePrice * 0.002;
      const change = (Math.random() - 0.5) * volatility;
      price += change;
      series.push({
        time: time.toISOString(),
        open: price - change,
        high: price + Math.random() * volatility,
        low: price - Math.random() * volatility,
        close: price,
        volume: Math.floor(Math.random() * 100_000) + 10_000,
      });
    }
  } else {
    // Higher timeframes: Generate daily bars going back from today, skipping weekends
    const now = new Date();
    let currentDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 10, 0, 0, 0));
    
    // Generate candles going backward from today
    const candles = [];
    let barsGenerated = 0;
    while (barsGenerated < count) {
      const dayOfWeek = currentDate.getUTCDay();
      // Skip Saturdays (6) and Sundays (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const volatility = basePrice * 0.008;
        const change = (Math.random() - 0.5) * volatility;
        price += change;
        candles.push({
          time: currentDate.toISOString(),
          open: price - change,
          high: price + Math.random() * volatility,
          low: price - Math.random() * volatility,
          close: price,
          volume: Math.floor(Math.random() * 2_000_000) + 500_000,
        });
        barsGenerated++;
      }
      // Move back one day
      currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    }
    // Reverse to get oldest first (chronological order)
    series.push(...candles.reverse());
  }
  
  return series;
}

module.exports = {
  getQuote,
  getTimeSeries,
  getTimeSeriesByTimeframe,
  getTimeSeriesCustom,
  getMultipleQuotes,
  searchStocks,
  generateSimulatedQuote,
  generateSimulatedTimeSeriesByTimeframe,
  isMarketHours,
};
