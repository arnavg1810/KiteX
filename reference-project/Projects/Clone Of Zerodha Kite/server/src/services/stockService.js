const axios = require('axios');
const { NIFTY_50_STOCKS } = require('../config/nifty50');

const TWELVEDATA_BASE = 'https://api.twelvedata.com';

const stockCache = new Map();
const CACHE_TTL = 15_000; // 15s for real-time data

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

  try {
    const { data } = await axios.get(`${TWELVEDATA_BASE}/quote`, {
      params: {
        symbol: `${symbol}:NSE`,
        apikey: process.env.TWELVEDATA_API_KEY,
      },
    });

    if (data.code) throw new Error(data.message || 'API error');

    const quote = {
      symbol: data.symbol,
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
    console.error(`Quote fetch error for ${symbol}:`, error.message);
    return generateSimulatedQuote(symbol);
  }
}

async function getTimeSeries(symbol, interval = '5min', outputsize = 78) {
  const cacheKey = `ts:${symbol}:${interval}`;
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
    console.error(`Time series error for ${symbol}:`, error.message);
    return generateSimulatedTimeSeries(symbol, outputsize);
  }
}

async function getMultipleQuotes(symbols) {
  const results = {};
  const batches = [];

  for (let i = 0; i < symbols.length; i += 8) {
    batches.push(symbols.slice(i, i + 8));
  }

  for (const batch of batches) {
    const promises = batch.map((s) => getQuote(s).then((q) => ({ symbol: s, quote: q })));
    const resolved = await Promise.allSettled(promises);
    for (const r of resolved) {
      if (r.status === 'fulfilled') {
        results[r.value.symbol] = r.value.quote;
      }
    }
  }

  return results;
}

function searchStocks(query) {
  const q = query.toLowerCase();
  return NIFTY_50_STOCKS.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  ).slice(0, 10);
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

function generateSimulatedTimeSeries(symbol, count = 78) {
  const basePrice = getBasePrice(symbol);
  const series = [];
  let price = basePrice;
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60_000);
    const volatility = basePrice * 0.002;
    const change = (Math.random() - 0.5) * volatility;
    price += change;

    const high = price + Math.random() * volatility;
    const low = price - Math.random() * volatility;

    series.push({
      time: time.toISOString(),
      open: price - change * 0.5,
      high: Math.max(price, high),
      low: Math.min(price, low),
      close: price,
      volume: Math.floor(Math.random() * 100_000) + 10_000,
    });
  }

  return series;
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

module.exports = {
  getQuote,
  getTimeSeries,
  getMultipleQuotes,
  searchStocks,
  generateSimulatedQuote,
  generateSimulatedTimeSeries,
  isMarketHours,
};
