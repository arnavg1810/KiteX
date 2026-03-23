const express = require('express');
const stockService = require('../services/stockService');
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
    const { interval = '5min', outputsize = 78 } = req.query;
    const data = await stockService.getTimeSeries(
      req.params.symbol.toUpperCase(),
      interval,
      parseInt(outputsize)
    );
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/nifty50', async (req, res) => {
  try {
    const symbols = NIFTY_50_STOCKS.map((s) => s.symbol);
    const uniqueSymbols = [...new Set(symbols)];
    const quotes = await stockService.getMultipleQuotes(uniqueSymbols.slice(0, 30));

    const stocks = NIFTY_50_STOCKS.map((s) => ({
      ...s,
      quote: quotes[s.symbol] || stockService.generateSimulatedQuote(s.symbol),
    }));

    // Deduplicate by symbol
    const seen = new Set();
    const unique = stocks.filter((s) => {
      if (seen.has(s.symbol)) return false;
      seen.add(s.symbol);
      return true;
    });

    // Compute index-level stats
    const gainers = [...unique].sort((a, b) => b.quote.changePercent - a.quote.changePercent).slice(0, 5);
    const losers = [...unique].sort((a, b) => a.quote.changePercent - b.quote.changePercent).slice(0, 5);

    const totalChange = unique.reduce((sum, s) => sum + s.quote.changePercent, 0);
    const avgChange = totalChange / unique.length;

    res.json({
      stocks: unique,
      gainers,
      losers,
      index: {
        name: 'NIFTY 50',
        change: Math.round(avgChange * 100) / 100,
        advancers: unique.filter((s) => s.quote.change > 0).length,
        decliners: unique.filter((s) => s.quote.change < 0).length,
        unchanged: unique.filter((s) => s.quote.change === 0).length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/list', (req, res) => {
  res.json({ stocks: NIFTY_50_STOCKS });
});

module.exports = router;
