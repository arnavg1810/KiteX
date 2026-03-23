const express = require('express');
const stockService = require('../services/stockService');
const fnoService = require('../services/fnoService');
const eventsService = require('../services/eventsService');
const { NIFTY_50_STOCKS } = require('../config/nifty50');

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) {
      return res.json({ results: [] });
    }
    const results = stockService.searchStocks(q);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/quote/:symbol', async (req, res) => {
  try {
    const quote = await stockService.getQuote(req.params.symbol.toUpperCase());
    res.json({ quote });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/timeseries/:symbol', async (req, res) => {
  try {
    const { interval, outputsize, timeframe, from, to } = req.query;
    const symbol = req.params.symbol.toUpperCase();
    let data;
    if (timeframe === 'custom' && from && to) {
      data = await stockService.getTimeSeriesCustom(symbol, from, to);
    } else if (timeframe && ['1D', '1W', '1M', '5M', '1Y'].includes(timeframe)) {
      data = await stockService.getTimeSeriesByTimeframe(symbol, timeframe);
    } else {
      data = await stockService.getTimeSeries(
        symbol,
        interval || '5min',
        outputsize ? parseInt(outputsize) : 78
      );
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const NIFTY50_TIMEOUT_MS = 3500;

function buildNifty50Response(quotesMap) {
  const stocks = NIFTY_50_STOCKS.map((s) => ({
    ...s,
    quote: quotesMap[s.symbol] || stockService.generateSimulatedQuote(s.symbol),
  }));
  const seen = new Set();
  const unique = stocks.filter((s) => {
    if (seen.has(s.symbol)) return false;
    seen.add(s.symbol);
    return true;
  });
  const gainers = [...unique].sort((a, b) => (b.quote?.changePercent ?? 0) - (a.quote?.changePercent ?? 0)).slice(0, 5);
  const losers = [...unique].sort((a, b) => (a.quote?.changePercent ?? 0) - (b.quote?.changePercent ?? 0)).slice(0, 5);
  const totalChange = unique.reduce((sum, s) => sum + (s.quote?.changePercent ?? 0), 0);
  const avgChange = unique.length ? totalChange / unique.length : 0;
  return {
    stocks: unique,
    gainers,
    losers,
    index: {
      name: 'NIFTY 50',
      change: Math.round(avgChange * 100) / 100,
      advancers: unique.filter((s) => (s.quote?.change ?? 0) > 0).length,
      decliners: unique.filter((s) => (s.quote?.change ?? 0) < 0).length,
      unchanged: unique.filter((s) => (s.quote?.change ?? 0) === 0).length,
    },
  };
}

router.get('/nifty50', async (req, res) => {
  try {
    const symbols = NIFTY_50_STOCKS.map((s) => s.symbol);
    const uniqueSymbols = [...new Set(symbols)];

    let quotes = {};
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('nifty50_timeout')), NIFTY50_TIMEOUT_MS)
    );
    try {
      quotes = await Promise.race([
        stockService.getMultipleQuotes(uniqueSymbols),
        timeoutPromise,
      ]);
    } catch (e) {
      quotes = {};
      for (const sym of uniqueSymbols) {
        quotes[sym] = stockService.generateSimulatedQuote(sym);
      }
    }

    res.json(buildNifty50Response(quotes));
  } catch (error) {
    console.error('nifty50 error:', error);
    const fallbackQuotes = {};
    for (const s of NIFTY_50_STOCKS) {
      fallbackQuotes[s.symbol] = stockService.generateSimulatedQuote(s.symbol);
    }
    res.json(buildNifty50Response(fallbackQuotes));
  }
});

router.get('/list', (req, res) => {
  res.json({ stocks: NIFTY_50_STOCKS });
});

// F&O data: range = 1d | 1w | custom; for custom pass from, to (YYYY-MM-DD)
router.get('/fno/:symbol', async (req, res) => {
  try {
    const { range } = req.query;
    const data = await fnoService.getFnoData(
      req.params.symbol.toUpperCase(),
      range || '1d'
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Key events: type = earnings | dividend | corporate_action | regulatory | board_meeting | news | all
router.get('/events/:symbol', async (req, res) => {
  try {
    const { type, from, to } = req.query;
    const data = await eventsService.getKeyEvents(
      req.params.symbol.toUpperCase(),
      type || 'all',
      from,
      to
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
