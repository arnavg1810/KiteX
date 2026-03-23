const express = require('express');
const router = express.Router();
const { getCompanyNews, getMarketNews, getEventsAndNews } = require('../services/newsService');

/**
 * Get company-specific news articles
 */
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { from, to, sort } = req.query;

    const news = await getCompanyNews(symbol, from, to, sort || 'latest');
    res.json(news);
  } catch (error) {
    console.error('Error fetching company news:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get market-wide news
 */
router.get('/market', async (req, res) => {
  try {
    const news = await getMarketNews();
    res.json(news);
  } catch (error) {
    console.error('Error fetching market news:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get combined events and news for Key Events section
 */
router.get('/events-and-news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await getEventsAndNews(symbol);
    res.json(data);
  } catch (error) {
    console.error('Error fetching events and news:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
