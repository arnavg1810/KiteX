const express = require('express');
const { getCompanyNews, getMarketNews } = require('../services/newsService');
const { analyzeArticles, generateTradingSignal } = require('../services/sentimentService');
const stockService = require('../services/stockService');
const { NIFTY_50_STOCKS } = require('../config/nifty50');

const router = express.Router();

router.get('/company/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const { from, to, sort = 'latest' } = req.query;

    const stock = NIFTY_50_STOCKS.find((s) => s.symbol === symbol);
    const companyName = stock?.name || symbol;

    const toDate = to || new Date().toISOString().split('T')[0];
    const fromDate = from || new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0];

    const rawArticles = await getCompanyNews(symbol, companyName, fromDate, toDate);
    const { articles, overview, wordCloud } = analyzeArticles(rawArticles);

    let sortedArticles = [...articles];
    if (sort === 'relevance') {
      sortedArticles.sort((a, b) =>
        Math.abs(b.sentiment.comparative) - Math.abs(a.sentiment.comparative)
      );
    }

    // Get trading signal
    let quote;
    try {
      quote = await stockService.getQuote(symbol);
    } catch (e) {
      quote = null;
    }
    const tradingSignal = generateTradingSignal(overview, quote);

    res.json({
      symbol,
      companyName,
      dateRange: { from: fromDate, to: toDate },
      articles: sortedArticles,
      overview,
      wordCloud,
      tradingSignal,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/market', async (req, res) => {
  try {
    const rawArticles = await getMarketNews();
    const { articles, overview } = analyzeArticles(rawArticles);
    res.json({ articles, overview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
