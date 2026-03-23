/**
 * F&O (Futures & Options) data service.
 * Returns simulated F&O metrics when no external API is configured.
 */

const { NIFTY_50_STOCKS } = require('../config/nifty50');

// Nifty 50 symbols that typically have F&O (subset for demo; expand as needed)
const FNO_SYMBOLS = new Set(
  NIFTY_50_STOCKS.slice(0, 45).map((s) => s.symbol)
);

const CACHE_TTL = 60_000; // 1 min
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

function getDateRange(range) {
  const to = new Date();
  let from;
  if (range === '1d') {
    from = new Date(to);
    from.setDate(from.getDate() - 1);
  } else if (range === '1w') {
    from = new Date(to);
    from.setDate(from.getDate() - 7);
  } else {
    // Default to 1 day if invalid range
    from = new Date(to);
    from.setDate(from.getDate() - 1);
  }
  return { from, to };
}

function generateTrendPoints(from, to, baseValue, volatility, count = 10) {
  const points = [];
  const span = to - from;
  let value = baseValue;
  for (let i = 0; i <= count; i++) {
    const d = new Date(from.getTime() + (span * i) / count);
    value += (Math.random() - 0.48) * volatility;
    points.push({ date: d.toISOString().split('T')[0], value: Math.round(value * 100) / 100 });
  }
  return points;
}

function detectBuildUp(priceChangePercent, oiChangePercent, deliveryChangePercent) {
  if (oiChangePercent > 1 && priceChangePercent > 0.5) return 'long_buildup';
  if (oiChangePercent > 1 && priceChangePercent < -0.5) return 'short_buildup';
  if (oiChangePercent < -1 && priceChangePercent > 0.5) return 'short_covering';
  if (oiChangePercent < -1 && priceChangePercent < -0.5) return 'long_unwinding';
  return 'none';
}

async function getFnoData(symbol, range = '1d') {
  const sym = symbol.toUpperCase();
  const cacheKey = `fno:${sym}:${range}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const available = FNO_SYMBOLS.has(sym);
  const { from, to } = getDateRange(range);

  const baseOI = 100000 + Math.abs(sym.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) * 100;
  const baseDelivery = 60 + (Math.random() * 30);
  const oiChange = (Math.random() - 0.4) * baseOI * 0.05;
  const deliveryChange = (Math.random() - 0.3) * 10;
  const priceChangePercent = (Math.random() - 0.5) * 4;
  const oiChangePercent = (Math.random() - 0.4) * 8;
  const deliveryChangePercent = (Math.random() - 0.4) * 15;

  const oiTrend = generateTrendPoints(from, to, baseOI, baseOI * 0.02);
  const deliveryTrend = generateTrendPoints(from, to, baseDelivery, 5).map((p) => ({
    ...p,
    value: Math.min(100, Math.max(0, p.value)),
  }));

  const buildUp = available
    ? detectBuildUp(priceChangePercent, oiChangePercent, deliveryChangePercent)
    : 'none';

  const data = {
    available,
    openInterest: Math.round(baseOI),
    oiChange: Math.round(oiChange),
    oiChangePercent: Math.round(oiChangePercent * 100) / 100,
    deliveryVolume: Math.round(baseDelivery * 100) / 100,
    deliveryPercent: Math.round(baseDelivery * 100) / 100,
    deliveryChange: Math.round(deliveryChange * 100) / 100,
    deliveryChangePercent: Math.round(deliveryChangePercent * 100) / 100,
    oiTrend,
    deliveryTrend,
    buildUp,
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };

  setCache(cacheKey, data);
  return data;
}

module.exports = { getFnoData, FNO_SYMBOLS };
