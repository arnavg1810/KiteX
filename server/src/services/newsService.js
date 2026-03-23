const axios = require('axios');

const newsCache = new Map();
const CACHE_TTL = 300_000; // 5 minutes

// NewsAPI configuration - supports free tier
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'demo_key';
const NEWS_API_BASE = 'https://newsapi.org/v2';

// Map of Indian stock symbols to company names for news search
const STOCK_TO_COMPANY = {
  'RELIANCE': 'Reliance Industries',
  'TCS': 'Tata Consultancy Services',
  'HDFCBANK': 'HDFC Bank',
  'INFY': 'Infosys',
  'ICICIBANK': 'ICICI Bank',
  'HINDUNILVR': 'Hindustan Unilever',
  'ITC': 'ITC Limited',
  'SBIN': 'State Bank of India',
  'BHARTIARTL': 'Bharti Airtel',
  'KOTAKBANK': 'Kotak Mahindra Bank',
  'LT': 'Larsen & Toubro',
  'AXISBANK': 'Axis Bank',
  'ASIANPAINT': 'Asian Paints',
  'MARUTI': 'Maruti Suzuki',
  'TITAN': 'Titan Company',
  'SUNPHARMA': 'Sun Pharmaceutical',
  'BAJFINANCE': 'Bajaj Finance',
  'WIPRO': 'Wipro',
  'HCLTECH': 'HCL Technologies',
  'TATAMOTORS': 'Tata Motors',
  'ULTRACEMCO': 'UltraTech Cement',
  'NESTLEIND': 'Nestle India',
  'NTPC': 'NTPC Limited',
  'POWERGRID': 'Power Grid Corporation',
  'ONGC': 'Oil and Natural Gas Corporation',
  'M&M': 'Mahindra & Mahindra',
  'TATASTEEL': 'Tata Steel',
  'JSWSTEEL': 'JSW Steel',
  'ADANIENT': 'Adani Enterprises',
  'ADANIPORTS': 'Adani Ports',
  'TECHM': 'Tech Mahindra',
  'BAJAJFINSV': 'Bajaj Finserv',
  'HDFCLIFE': 'HDFC Life',
  'SBILIFE': 'SBI Life',
  'DIVISLAB': 'Divi\'s Laboratories',
  'DRREDDY': 'Dr. Reddy\'s Laboratories',
  'CIPLA': 'Cipla',
  'APOLLOHOSP': 'Apollo Hospitals',
  'EICHERMOT': 'Eicher Motors',
  'GRASIM': 'Grasim Industries',
  'INDUSINDBK': 'IndusInd Bank',
  'BRITANNIA': 'Britannia Industries',
  'COALINDIA': 'Coal India',
  'BPCL': 'Bharat Petroleum',
  'TATACONSUM': 'Tata Consumer',
  'HEROMOTOCO': 'Hero MotoCorp',
  'HINDALCO': 'Hindalco Industries',
  'BAJAJ-AUTO': 'Bajaj Auto',
  'UPL': 'UPL Limited',
};

/**
 * Get cached news data
 */
function getCached(key) {
  const entry = newsCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

/**
 * Set news data in cache
 */
function setCache(key, data) {
  newsCache.set(key, { data, ts: Date.now() });
}

/**
 * Analyze sentiment from news title and description using keyword matching
 */
function analyzeSentiment(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  const positiveKeywords = [
    'surge', 'soar', 'gains', 'rally', 'strong', 'beat', 'bullish', 'record', 'growth',
    'upgrade', 'outperform', 'buy', 'positive', 'profit', 'earnings', 'dividend',
    'expansion', 'acquisition', 'partnership', 'innovation', 'success', 'momentum',
    'rally', 'jump', 'climbs', 'rises', 'upbeat', 'optimistic'
  ];
  
  const negativeKeywords = [
    'fall', 'crash', 'plunge', 'decline', 'loss', 'bearish', 'miss', 'weak',
    'loss', 'selloff', 'sell', 'concerns', 'risk', 'challenges', 'downturn',
    'negative', 'slump', 'tumble', 'drops', 'pessimistic', 'warning', 'volatile',
    'recession', 'slowdown', 'downgrade', 'struggles'
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveKeywords.forEach(keyword => {
    if (text.includes(keyword)) positiveCount++;
  });
  
  negativeKeywords.forEach(keyword => {
    if (text.includes(keyword)) negativeCount++;
  });
  
  if (positiveCount > negativeCount + 1) {
    return { label: 'positive', score: Math.min(0.95, 0.7 + (positiveCount * 0.05)) };
  } else if (negativeCount > positiveCount + 1) {
    return { label: 'negative', score: Math.min(0.95, 0.7 + (negativeCount * 0.05)) };
  } else {
    return { label: 'neutral', score: 0.5 };
  }
}

/**
 * Fetch real news from NewsAPI
 */
async function fetchRealNews(symbol, companyName) {
  try {
    if (NEWS_API_KEY === 'demo_key') {
      // Skip real API if no key, use simulated
      return null;
    }

    const searchQuery = companyName || symbol;
    const response = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: {
        q: searchQuery,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 10,
        apikey: NEWS_API_KEY,
      },
      timeout: 5000,
    });

    if (response.data.articles && response.data.articles.length > 0) {
      const articles = response.data.articles.map((article, index) => ({
        id: `${symbol}-real-${index}`,
        title: article.title,
        description: article.description || article.content || 'No description available',
        publishedAt: article.publishedAt,
        url: article.url || '#', // Ensure URL is always present
        source: {
          name: article.source?.name || 'News Source',
        },
        sentiment: analyzeSentiment(article.title, article.description || ''),
        newsType: 'market',
        analysis: article.description || '',
        imageUrl: article.urlToImage || `https://via.placeholder.com/300x200?text=${symbol}`,
        isRealNews: true,
      }));
      
      console.log(`Fetched ${articles.length} real articles for ${symbol} from NewsAPI`);
      return articles;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching real news for ${symbol}:`, error.message);
    return null;
  }
}

/**
 * Get a stock sentiment seed value based on stock symbol for consistent but unique distributions
 */
function getStockSentimentSeed(symbol) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Generate sentiment distribution for a stock based on its symbol
 */
function generateSentimentDistribution(symbol) {
  const seed = getStockSentimentSeed(symbol);
  
  // Create different distribution patterns based on seed
  if (seed < 20) {
    // Strongly bullish stocks
    return { positive: 60, neutral: 25, negative: 15 };
  } else if (seed < 35) {
    // Moderately bullish
    return { positive: 50, neutral: 30, negative: 20 };
  } else if (seed < 50) {
    // Mildly bullish
    return { positive: 45, neutral: 35, negative: 20 };
  } else if (seed < 65) {
    // Neutral/balanced
    return { positive: 35, neutral: 40, negative: 25 };
  } else if (seed < 80) {
    // Mildly bearish
    return { positive: 25, neutral: 35, negative: 40 };
  } else if (seed < 90) {
    // Moderately bearish
    return { positive: 20, neutral: 30, negative: 50 };
  } else {
    // Strongly bearish
    return { positive: 15, neutral: 25, negative: 60 };
  }
}

/**
 * Generate realistic simulated news articles for a stock
 */
function generateSimulatedNews(symbol, companyName) {
  // Get sentiment distribution for this specific stock
  const targetDistribution = generateSentimentDistribution(symbol);
  
  // News templates separated by sentiment
  const positiveTemplates = [
    {
      title: `${symbol} surges 3.5% on strong quarterly results`,
      description: 'Company reports better-than-expected earnings, beating analyst estimates by 12%. Revenue growth accelerates to 18% YoY.',
      sentiment: 'positive',
      newsType: 'earnings',
      analysis: 'Strong Q3 performance with robust revenue growth and margin expansion. Company guidance upgraded for FY25.'
    },
    {
      title: `${symbol} announces record-breaking order book`,
      description: 'Company secures mega contracts worth ₹5000 crore, highest in company history.',
      sentiment: 'positive',
      newsType: 'corporate',
      analysis: 'Significant growth catalyst with 3-4 year revenue visibility. Order execution to drive earnings inflection.'
    },
    {
      title: `Analyst upgrades ${symbol} to "BUY" with ₹2500 target`,
      description: 'Major brokerage firm raises price target by 18%, citing strong competitive advantages.',
      sentiment: 'positive',
      newsType: 'analyst',
      analysis: 'Positive catalyst expected from expansion into emerging markets. Valuation remains attractive compared to peers.'
    },
    {
      title: `${symbol} declares interim dividend of ₹15 per share`,
      description: 'Board declares interim dividend, reflecting strong cash generation and shareholder return focus.',
      sentiment: 'positive',
      newsType: 'dividend',
      analysis: 'Consistent dividend payouts demonstrate strong fundamentals. Dividend yield remains compelling.'
    },
    {
      title: `${symbol} opens new manufacturing facility in Gujarat`,
      description: 'Company inaugurates ₹800 crore capacity expansion, targeting 30% production increase.',
      sentiment: 'positive',
      newsType: 'corporate',
      analysis: 'Capacity addition supports long-term growth. Capex cycle nearing completion, future FCF expected to expand.'
    },
  ];

  const neutralTemplates = [
    {
      title: `Market update: ${symbol} trading range-bound`,
      description: 'Stock consolidates near recent highs on mixed global cues. Volumes remain moderate.',
      sentiment: 'neutral',
      newsType: 'market',
      analysis: 'Sideways movement suggests indecision. Awaiting fresh triggers to break out of current range.'
    },
    {
      title: `Regulatory filing: ${symbol} compliance update`,
      description: 'Company submits quarterly regulatory filings with market authorities. All norms met.',
      sentiment: 'neutral',
      newsType: 'regulatory',
      analysis: 'Routine compliance filing. No material issues or red flags detected in submissions.'
    },
    {
      title: `${symbol} earnings guidance: Steady growth expected`,
      description: 'Management maintains FY25 guidance for 8-10% growth amid macro uncertainties.',
      sentiment: 'neutral',
      newsType: 'earnings',
      analysis: 'Conservative guidance suggests caution on macro headwinds. Execution on plan critical for credibility.'
    },
    {
      title: `${symbol} stock consolidates after recent rally`,
      description: 'Stock stabilizes after 10% run-up. Analysts see it as healthy consolidation pattern.',
      sentiment: 'neutral',
      newsType: 'market',
      analysis: 'Technical consolidation phase. Support levels intact, upside potential remains intact.'
    },
  ];

  const negativeTemplates = [
    {
      title: `${symbol} faces headwinds from rising input costs`,
      description: 'Company concerns mount over raw material inflation impacting Q4 margins. Guidance under review.',
      sentiment: 'negative',
      newsType: 'corporate',
      analysis: 'Input cost pressures threaten profitability. Management action on pricing critical for margin defense.'
    },
    {
      title: `${symbol} workforce reduction announced`,
      description: 'Company announces restructuring with estimated 2000 job cuts to optimize costs.',
      sentiment: 'negative',
      newsType: 'corporate',
      analysis: 'Restructuring plan suggests management sees revenue/profit headwinds. Short-term impact on operations likely.'
    },
    {
      title: `${symbol} profit falls 15% YoY in Q2 results`,
      description: 'Company misses profit estimates as operational challenges weigh. Margins compress by 200 bps.',
      sentiment: 'negative',
      newsType: 'earnings',
      analysis: 'Weak profitability trends concerning. Recovery dependent on operational efficiency improvements.'
    },
    {
      title: `Analyst downgrades ${symbol}, raises concerns on competition`,
      description: 'Major brokerage cuts rating citing increased competitive pressures and margin erosion risks.',
      sentiment: 'negative',
      newsType: 'analyst',
      analysis: 'Competitive intensity increasing. Market share losses likely if company fails to innovate.'
    },
    {
      title: `${symbol} sales decline 8% in key markets`,
      description: 'Company reports weak demand in major segments. Retail segment particularly affected.',
      sentiment: 'negative',
      newsType: 'corporate',
      analysis: 'Demand slowdown concerning. Consumer spending weakness poses ongoing challenges for recovery.'
    },
  ];

  const articles = [];
  const now = Date.now();

  // Calculate how many articles we need of each sentiment
  // 9 total articles (3 recent + 3 week ago + 3 month ago)
  const positiveCount = Math.round(9 * targetDistribution.positive / 100);
  const neutralCount = Math.round(9 * targetDistribution.neutral / 100);
  const negativeCount = 9 - positiveCount - neutralCount;

  // Create a pool of articles with correct sentiment distribution
  const articlePool = [];
  
  // Add positive articles
  for (let i = 0; i < positiveCount; i++) {
    const template = positiveTemplates[i % positiveTemplates.length];
    articlePool.push({ ...template });
  }
  
  // Add neutral articles
  for (let i = 0; i < neutralCount; i++) {
    const template = neutralTemplates[i % neutralTemplates.length];
    articlePool.push({ ...template });
  }
  
  // Add negative articles
  for (let i = 0; i < negativeCount; i++) {
    const template = negativeTemplates[i % negativeTemplates.length];
    articlePool.push({ ...template });
  }

  // Shuffle the pool to randomize distribution across time periods
  for (let i = articlePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [articlePool[i], articlePool[j]] = [articlePool[j], articlePool[i]];
  }

  // Assign articles with timestamps
  const timeRanges = [
    { label: 'recent', daysAgo: (i) => (i + 1) * 12 + Math.random() * 8, hoursAgo: true },
    { label: 'week', daysAgo: (i) => 7 + Math.random() * 2, hoursAgo: false },
    { label: 'month', daysAgo: (i) => 30 + Math.random() * 5, hoursAgo: false },
  ];

  let articleIndex = 0;
  for (let rangeIndex = 0; rangeIndex < 3; rangeIndex++) {
    const range = timeRanges[rangeIndex];
    for (let i = 0; i < 3; i++) {
      if (articleIndex >= articlePool.length) break;
      
      const template = articlePool[articleIndex];
      const timeValue = range.daysAgo(i);
      const publishedAt = new Date(
        now - (range.hoursAgo ? timeValue * 3600000 : timeValue * 86400000)
      );

      articles.push({
        id: `${symbol}-${range.label}-${i}`,
        title: template.title,
        description: template.description,
        publishedAt: publishedAt.toISOString(),
        url: `#`,
        source: {
          name: ['Reuters', 'Bloomberg', 'CNBC', 'Moneycontrol', 'Economic Times', 'Financial Times'][articleIndex % 6]
        },
        sentiment: {
          label: template.sentiment,
          score: template.sentiment === 'positive' ? 0.75 + Math.random() * 0.25 : 
                 template.sentiment === 'negative' ? 0.15 + Math.random() * 0.25 : 
                 0.45 + Math.random() * 0.15
        },
        newsType: template.newsType,
        analysis: template.analysis,
        imageUrl: `https://via.placeholder.com/300x200?text=${symbol}`
      });
      
      articleIndex++;
    }
  }

  // Calculate actual sentiment overview from generated articles
  const positive = articles.filter(a => a.sentiment.label === 'positive').length;
  const neutral = articles.filter(a => a.sentiment.label === 'neutral').length;
  const negative = articles.filter(a => a.sentiment.label === 'negative').length;
  const total = articles.length;

  // Generate detailed sentiment analysis based on actual distribution
  const sentimentScore = (positive - negative) / total;
  let analysisText = '';
  let recommendation = '';

  if (sentimentScore > 0.4) {
    analysisText = `Strong positive sentiment with ${positive} out of ${total} articles showing bullish signals. 
Key strengths: Strong earnings performance, strategic expansions, and analyst upgrades. 
Forward-looking catalysts remain constructive.`;
    recommendation = 'BUY';
  } else if (sentimentScore > 0.1) {
    analysisText = `Moderately positive sentiment with ${positive} positive articles. Mixed signals from recent developments. 
Some positive catalysts, but execution risks remain. Suitable for selective accumulation on dips.`;
    recommendation = 'BUY';
  } else if (sentimentScore > -0.1) {
    analysisText = `Neutral sentiment with mixed news flow. ${positive} positive, ${neutral} neutral, ${negative} negative articles. 
Awaiting clarity on management actions. Better to wait for confirming signals before positioning.`;
    recommendation = 'HOLD';
  } else if (sentimentScore > -0.4) {
    analysisText = `Moderately negative sentiment with ${negative} concerning news items. 
Some headwinds visible but fundamentals intact. Wait for bottoming signals before entry.`;
    recommendation = 'HOLD';
  } else {
    analysisText = `Strong negative sentiment with significant concerns. ${negative} negative articles detected. 
Risk-reward unfavorable until sentiment turns positive. Recommend staying cautious.`;
    recommendation = 'SELL';
  }

  return {
    companyName: companyName || symbol,
    articles: articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    overview: {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100),
    },
    sentiment_analysis: {
      positive_count: positive,
      neutral_count: neutral,
      negative_count: negative,
      overall_analysis: analysisText
    },
    wordCloud: [
      { text: symbol, value: 15 },
      { text: 'earnings', value: 12 },
      { text: 'growth', value: 11 },
      { text: 'expansion', value: 9 },
      { text: 'positive', value: 8 },
      { text: 'analyst', value: 7 },
      { text: 'catalyst', value: 6 },
      { text: 'dividend', value: 5 },
    ],
    tradingSignal: {
      action: recommendation,
      confidence: Math.min(0.95, 0.65 + Math.abs(sentimentScore) * 0.3),
      summary: analysisText,
      sentimentScore: sentimentScore,
      rationale: recommendation === 'BUY' ? `Recent positive developments suggest upside potential. Multiple growth catalysts in pipeline.` :
                 recommendation === 'SELL' ? `Accumulation of negative catalysts suggests caution. Risk-reward appears unfavorable currently.` :
                 `Conflicting signals warrant a cautious stance. Accumulate on weakness or wait for clarity.`
    },
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Generate key events with news for a stock
 */
function generateKeyEventsWithNews(symbol) {
  const events = [];
  const now = Date.now();

  // Key corporate events
  const eventTemplates = [
    {
      date: new Date(now - 7 * 24 * 3600000).toISOString().split('T')[0],
      title: 'Bonus Issue',
      type: 'corporate_action',
      description: 'Bonus shares in ratio 1:2'
    },
    {
      date: new Date(now - 14 * 24 * 3600000).toISOString().split('T')[0],
      title: 'Earnings Call',
      type: 'earnings',
      description: 'Management to discuss quarterly performance'
    },
    {
      date: new Date(now - 3 * 24 * 3600000).toISOString().split('T')[0],
      title: 'Major Development',
      type: 'news',
      description: 'Company announces strategic initiative'
    },
    {
      date: new Date(now - 1 * 24 * 3600000).toISOString().split('T')[0],
      title: 'SEBI Filing',
      type: 'regulatory',
      description: 'Regulatory compliance filing submitted'
    },
    {
      date: new Date(now + 5 * 24 * 3600000).toISOString().split('T')[0],
      title: 'Dividend Payment',
      type: 'dividend',
      description: 'Dividend payout to shareholders'
    },
    {
      date: new Date(now + 10 * 24 * 3600000).toISOString().split('T')[0],
      title: 'Board Meeting',
      type: 'board_meeting',
      description: 'Board of directors meeting scheduled'
    },
  ];

  return eventTemplates.map((e, i) => ({
    ...e,
    id: `event-${symbol}-${i}`
  }));
}

/**
 * Get company news for a specific stock
 */
async function getCompanyNews(symbol, fromDate, toDate, sort = 'latest') {
  try {
    const cacheKey = `news:${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Try to fetch real news first
    const companyName = STOCK_TO_COMPANY[symbol];
    let realArticles = await fetchRealNews(symbol, companyName);
    
    let news;
    if (realArticles && realArticles.length > 0) {
      // Use real news articles with sentiment analysis
      const positive = realArticles.filter(a => a.sentiment.label === 'positive').length;
      const neutral = realArticles.filter(a => a.sentiment.label === 'neutral').length;
      const negative = realArticles.filter(a => a.sentiment.label === 'negative').length;
      const total = realArticles.length;

      const sentimentScore = (positive - negative) / total;
      let analysisText = '';
      let recommendation = '';

      if (sentimentScore > 0.4) {
        analysisText = `Strong positive sentiment with ${positive} out of ${total} real news articles showing bullish signals.`;
        recommendation = 'BUY';
      } else if (sentimentScore > 0.1) {
        analysisText = `Moderately positive sentiment with ${positive} positive articles from real news sources.`;
        recommendation = 'BUY';
      } else if (sentimentScore > -0.1) {
        analysisText = `Neutral sentiment. ${positive} positive, ${neutral} neutral, ${negative} negative real news articles.`;
        recommendation = 'HOLD';
      } else if (sentimentScore > -0.4) {
        analysisText = `Moderately negative sentiment with ${negative} concerning news items.`;
        recommendation = 'HOLD';
      } else {
        analysisText = `Strong negative sentiment with significant concerns detected in news.`;
        recommendation = 'SELL';
      }

      news = {
        companyName: companyName || symbol,
        articles: realArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
        overview: {
          positive: Math.round((positive / total) * 100),
          neutral: Math.round((neutral / total) * 100),
          negative: Math.round((negative / total) * 100),
        },
        sentiment_analysis: {
          positive_count: positive,
          neutral_count: neutral,
          negative_count: negative,
          overall_analysis: analysisText
        },
        tradingSignal: {
          action: recommendation,
          confidence: Math.min(0.95, 0.65 + Math.abs(sentimentScore) * 0.3),
          summary: analysisText,
          sentimentScore: sentimentScore,
          rationale: recommendation === 'BUY' ? `Real news sources show positive momentum.` :
                     recommendation === 'SELL' ? `Negative sentiment in real news suggests caution.` :
                     `Mixed signals in recent news flow.`
        },
        isRealNews: true,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Fallback to simulated news if real news fetch fails
      news = generateSimulatedNews(symbol);
    }
    
    // Filter by date range if provided
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      news.articles = news.articles.filter(a => {
        const pubDate = new Date(a.publishedAt);
        return pubDate >= from && pubDate <= to;
      });
    }

    // Sort articles
    if (sort === 'oldest') {
      news.articles.reverse();
    }

    setCache(cacheKey, news);
    return news;
  } catch (error) {
    console.error('Error fetching news:', error.message);
    return generateSimulatedNews(symbol);
  }
}

/**
 * Get market news (general market updates)
 */
async function getMarketNews() {
  try {
    const cacheKey = 'news:market';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const marketNews = {
      articles: [
        {
          id: 'm1',
          title: 'Market opens higher on global cues',
          description: 'Sensex and Nifty gain in early morning trade amid strong global sentiment.',
          publishedAt: new Date().toISOString(),
          url: '#',
          source: { name: 'Reuters' },
          sentiment: { label: 'positive', score: 0.75 }
        },
        {
          id: 'm2',
          title: 'RBI signals stable monetary policy',
          description: 'Central bank maintains status quo, indicating confidence in inflation control.',
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          url: '#',
          source: { name: 'Bloomberg' },
          sentiment: { label: 'positive', score: 0.7 }
        },
        {
          id: 'm3',
          title: 'Rupee steady against US dollar',
          description: 'Indian currency remains resilient amid broader market movements.',
          publishedAt: new Date(Date.now() - 7200000).toISOString(),
          url: '#',
          source: { name: 'CNBC' },
          sentiment: { label: 'neutral', score: 0.5 }
        },
      ]
    };

    setCache(cacheKey, marketNews);
    return marketNews;
  } catch (error) {
    console.error('Error fetching market news:', error.message);
    return { articles: [] };
  }
}

/**
 * Get combined events and news for a stock (for Key Events section)
 */
async function getEventsAndNews(symbol) {
  try {
    const cacheKey = `events-news:${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const events = generateKeyEventsWithNews(symbol);
    const newsData = await getCompanyNews(symbol);
    
    // Combine events and news items, limit to recent items
    const combined = [
      ...events,
      ...newsData.articles.slice(0, 3).map(article => ({
        id: article.id,
        date: new Date(article.publishedAt).toISOString().split('T')[0],
        title: article.title,
        type: 'news',
        description: article.description,
        sentiment: article.sentiment,
        source: article.source?.name,
        newsItem: true
      }))
    ];

    // Sort by date (most recent first)
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    const result = {
      symbol,
      events,
      newsItems: newsData.articles.slice(0, 5),
      combined: combined.slice(0, 10),
      lastUpdated: new Date().toISOString()
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error getting events and news:', error.message);
    throw error;
  }
}

module.exports = {
  getCompanyNews,
  getMarketNews,
  getEventsAndNews,
  generateSimulatedNews,
  generateKeyEventsWithNews,
};
