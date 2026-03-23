/**
 * Key events & announcements service (earnings, dividends, corporate actions, regulatory, board meetings).
 * Returns simulated events when no external API is configured.
 */

const { NIFTY_50_STOCKS } = require('../config/nifty50');

const EVENT_TYPES = ['earnings', 'dividend', 'corporate_action', 'regulatory', 'board_meeting', 'news'];
const CACHE_TTL = 5 * 60_000; // 5 min
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

function randomDate(from, to) {
  const f = from.getTime();
  const t = to.getTime();
  return new Date(f + Math.random() * (t - f));
}

function generateEvents(symbol, typeFilter, from, to) {
  const stock = NIFTY_50_STOCKS.find((s) => s.symbol === symbol) || { name: symbol };
  const events = [];
  const types = typeFilter === 'all' ? EVENT_TYPES : [typeFilter];

  const templates = {
    earnings: [
      { title: 'Q3 FY25 Results', description: 'Quarterly earnings announcement' },
      { title: 'Earnings Call', description: 'Management to discuss quarterly performance' },
    ],
    dividend: [
      { title: 'Interim Dividend', description: 'Board declares interim dividend' },
      { title: 'Final Dividend', description: 'Final dividend for the financial year' },
    ],
    corporate_action: [
      { title: 'Bonus Issue', description: 'Bonus shares in ratio 1:2' },
      { title: 'Stock Split', description: 'Face value split proposal' },
    ],
    regulatory: [
      { title: 'SEBI Filing', description: 'Regulatory disclosure filed' },
      { title: 'Exchange Communication', description: 'Compliance filing with exchange' },
    ],
    board_meeting: [
      { title: 'Board Meeting', description: 'Board to consider financial results' },
      { title: 'AGM Notice', description: 'Annual general meeting schedule' },
    ],
    news: [
      { title: 'Major Development', description: 'Company announces strategic update' },
    ],
  };

  for (const type of types) {
    const list = templates[type] || [];
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const t = list[i % list.length] || { title: type, description: '' };
      events.push({
        type,
        title: t.title,
        description: t.description,
        date: randomDate(from, to).toISOString().split('T')[0],
        source: 'Simulated',
        symbol,
        companyName: stock.name,
      });
    }
  }

  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events;
}

async function getKeyEvents(symbol, type = 'all', fromQuery, toQuery) {
  const sym = symbol.toUpperCase();
  const cacheKey = `events:${sym}:${type}:${fromQuery || ''}:${toQuery || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const to = toQuery ? new Date(toQuery) : new Date();
  const from = fromQuery ? new Date(fromQuery) : new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);
  const events = generateEvents(sym, type, from, to);

  const data = { events };
  setCache(cacheKey, data);
  return data;
}

module.exports = { getKeyEvents, EVENT_TYPES };
