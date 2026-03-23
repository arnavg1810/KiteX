const axios = require('axios');

const newsCache = new Map();
const CACHE_TTL = 120_000; // 2 min

function getCached(key) {
  const entry = newsCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  newsCache.set(key, { data, ts: Date.now() });
}

async function getCompanyNews(symbol, companyName, fromDate, toDate) {
  const cacheKey = `news:${symbol}:${fromDate}:${toDate}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let articles = [];

  // Source 1: Finnhub
  try {
    const finnhubArticles = await fetchFinnhubNews(symbol, fromDate, toDate);
    articles.push(...finnhubArticles);
  } catch (e) {
    console.error('Finnhub news error:', e.message);
  }

  // Source 2: NewsAPI
  try {
    const newsApiArticles = await fetchNewsAPI(companyName, fromDate, toDate);
    articles.push(...newsApiArticles);
  } catch (e) {
    console.error('NewsAPI error:', e.message);
  }

  // Deduplicate by title similarity
  articles = deduplicateArticles(articles);
  articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // If no live data, generate simulated news
  if (articles.length === 0) {
    articles = generateSimulatedNews(symbol, companyName);
  }

  setCache(cacheKey, articles);
  return articles;
}

async function fetchFinnhubNews(symbol, from, to) {
  if (!process.env.FINNHUB_API_KEY) return [];

  const { data } = await axios.get('https://finnhub.io/api/v1/company-news', {
    params: {
      symbol: symbol,
      from,
      to,
      token: process.env.FINNHUB_API_KEY,
    },
  });

  return (data || []).slice(0, 50).map((a) => ({
    id: `fh-${a.id}`,
    title: a.headline,
    summary: a.summary,
    source: a.source,
    url: a.url,
    imageUrl: a.image,
    publishedAt: new Date(a.datetime * 1000).toISOString(),
    category: a.category,
    provider: 'Finnhub',
  }));
}

async function fetchNewsAPI(companyName, from, to) {
  if (!process.env.NEWSAPI_KEY) return [];

  const { data } = await axios.get('https://newsapi.org/v2/everything', {
    params: {
      q: `"${companyName}" AND (stock OR share OR market OR NSE)`,
      from,
      to,
      sortBy: 'publishedAt',
      language: 'en',
      pageSize: 30,
      apiKey: process.env.NEWSAPI_KEY,
    },
  });

  return (data.articles || []).map((a, i) => ({
    id: `na-${i}-${Date.now()}`,
    title: a.title,
    summary: a.description,
    source: a.source?.name || 'Unknown',
    url: a.url,
    imageUrl: a.urlToImage,
    publishedAt: a.publishedAt,
    author: a.author,
    provider: 'NewsAPI',
  }));
}

function deduplicateArticles(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    const key = a.title?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateSimulatedNews(symbol, companyName) {
  const templates = [
    { title: `${companyName} Reports Strong Quarterly Results, Beats Estimates`, sentiment: 'positive' },
    { title: `${companyName} (${symbol}) Stock Surges on Positive Analyst Upgrade`, sentiment: 'positive' },
    { title: `Global Headwinds May Impact ${companyName}'s Growth Outlook`, sentiment: 'negative' },
    { title: `${companyName} Announces Strategic Partnership to Drive Innovation`, sentiment: 'positive' },
    { title: `Market Analysts Remain Cautious on ${symbol} Amid Sector Volatility`, sentiment: 'negative' },
    { title: `${companyName} Board Approves Rs 5,000 Crore Expansion Plan`, sentiment: 'positive' },
    { title: `${symbol}: Technical Analysis Points to Key Support Levels`, sentiment: 'neutral' },
    { title: `FII Selling Pressure Weighs on ${companyName} Stock`, sentiment: 'negative' },
    { title: `${companyName} Leads Sector Rally as Market Sentiment Improves`, sentiment: 'positive' },
    { title: `Regulatory Concerns Cloud ${companyName}'s Near-Term Outlook`, sentiment: 'negative' },
    { title: `${symbol} Trades in Narrow Range; Breakout Expected`, sentiment: 'neutral' },
    { title: `${companyName} ESG Rating Upgraded by Leading Agency`, sentiment: 'positive' },
    { title: `Institutional Investors Increase Stake in ${companyName}`, sentiment: 'positive' },
    { title: `${companyName} Faces Supply Chain Challenges in Key Markets`, sentiment: 'negative' },
    { title: `${symbol} Dividend Announcement: What Investors Should Know`, sentiment: 'neutral' },
  ];

  const sources = ['Economic Times', 'Moneycontrol', 'Business Standard', 'LiveMint', 'NDTV Profit', 'Reuters India', 'Bloomberg Quint'];
  const now = Date.now();

  return templates.map((t, i) => ({
    id: `sim-${symbol}-${i}`,
    title: t.title,
    summary: `${t.title}. Market participants are closely watching developments around ${companyName} as the stock continues to attract attention from retail and institutional investors alike.`,
    source: sources[i % sources.length],
    url: '#',
    imageUrl: null,
    publishedAt: new Date(now - i * 3_600_000 * (1 + Math.random() * 3)).toISOString(),
    provider: 'Simulated',
    category: 'business',
    presetSentiment: t.sentiment,
  }));
}

async function getMarketNews() {
  const cacheKey = 'market-news';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    if (process.env.FINNHUB_API_KEY) {
      const { data } = await axios.get('https://finnhub.io/api/v1/news', {
        params: { category: 'general', token: process.env.FINNHUB_API_KEY },
      });

      const articles = (data || []).slice(0, 20).map((a) => ({
        id: `mkt-${a.id}`,
        title: a.headline,
        summary: a.summary,
        source: a.source,
        url: a.url,
        imageUrl: a.image,
        publishedAt: new Date(a.datetime * 1000).toISOString(),
        provider: 'Finnhub',
      }));

      setCache(cacheKey, articles);
      return articles;
    }
  } catch (e) {
    console.error('Market news error:', e.message);
  }

  // Fallback simulated market news
  const headlines = [
    'Nifty 50 Hits New All-Time High Amid Global Rally',
    'RBI Holds Interest Rates Steady in Monetary Policy Review',
    'IT Sector Leads Market Rally on Strong US Tech Earnings',
    'Banking Stocks Under Pressure on NPA Concerns',
    'FIIs Turn Net Buyers After Three Weeks of Selling',
    'Crude Oil Prices Decline, Positive for Indian Markets',
    'Indian Rupee Strengthens Against US Dollar',
    'GST Collections Hit Record High in Current Month',
    'Auto Sector Sees Robust Demand in Festive Season',
    'Metal Stocks Rally on China Stimulus Hopes',
  ];

  const news = headlines.map((h, i) => ({
    id: `mkt-sim-${i}`,
    title: h,
    summary: h + '. Markets continue to navigate global and domestic factors.',
    source: ['ET', 'Moneycontrol', 'LiveMint', 'Reuters'][i % 4],
    url: '#',
    publishedAt: new Date(Date.now() - i * 1_800_000).toISOString(),
    provider: 'Simulated',
  }));

  setCache(cacheKey, news);
  return news;
}

module.exports = { getCompanyNews, getMarketNews };
