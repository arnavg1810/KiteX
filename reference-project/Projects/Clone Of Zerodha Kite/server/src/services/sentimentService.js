const Sentiment = require('sentiment');
const analyzer = new Sentiment();

// Extended financial lexicon for better accuracy
const financialLexicon = {
  bullish: 3, bearish: -3, rally: 2, surge: 3, plunge: -3, crash: -4,
  upgrade: 2, downgrade: -2, outperform: 2, underperform: -2,
  profit: 2, loss: -2, growth: 2, decline: -2, revenue: 1,
  dividend: 1, acquisition: 1, merger: 1, layoff: -2, restructuring: -1,
  beat: 2, miss: -2, exceeded: 2, shortfall: -2, record: 2,
  expansion: 2, contraction: -2, innovation: 2, disruption: 1,
  bankruptcy: -5, default: -3, debt: -1, overvalued: -2, undervalued: 2,
  buy: 2, sell: -1, hold: 0, accumulate: 2, reduce: -1,
  'all-time high': 3, '52-week low': -2, 'market cap': 0,
  FII: 0, DII: 0, NPA: -2, NPL: -2,
  inflation: -1, deflation: -1, stimulus: 2, tightening: -1,
  robust: 2, weak: -2, strong: 2, sluggish: -2, volatile: -1,
};

function analyzeSentiment(text) {
  if (!text) return { score: 0, comparative: 0, label: 'neutral', confidence: 0 };

  const result = analyzer.analyze(text, { extras: financialLexicon });

  const score = result.score;
  const comparative = result.comparative;

  let label, confidence;

  if (comparative > 0.1) {
    label = 'positive';
    confidence = Math.min(comparative * 2, 1);
  } else if (comparative < -0.1) {
    label = 'negative';
    confidence = Math.min(Math.abs(comparative) * 2, 1);
  } else {
    label = 'neutral';
    confidence = 1 - Math.abs(comparative) * 5;
  }

  return {
    score,
    comparative: Math.round(comparative * 1000) / 1000,
    label,
    confidence: Math.round(Math.max(confidence, 0.1) * 100) / 100,
    positiveWords: result.positive,
    negativeWords: result.negative,
  };
}

function analyzeArticles(articles) {
  const analyzed = articles.map((article) => {
    const textToAnalyze = `${article.title || ''} ${article.summary || ''}`;
    const sentiment = article.presetSentiment
      ? getPresetSentiment(article.presetSentiment)
      : analyzeSentiment(textToAnalyze);

    return { ...article, sentiment };
  });

  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  let totalScore = 0;

  for (const a of analyzed) {
    sentimentCounts[a.sentiment.label]++;
    totalScore += a.sentiment.comparative;
  }

  const totalArticles = analyzed.length || 1;
  const avgScore = totalScore / totalArticles;

  let overallLabel;
  if (avgScore > 0.05) overallLabel = 'positive';
  else if (avgScore < -0.05) overallLabel = 'negative';
  else overallLabel = 'neutral';

  const overview = {
    totalArticles: analyzed.length,
    sentimentCounts,
    averageScore: Math.round(avgScore * 1000) / 1000,
    overallSentiment: overallLabel,
    sentimentRatio: {
      positive: Math.round((sentimentCounts.positive / totalArticles) * 100),
      negative: Math.round((sentimentCounts.negative / totalArticles) * 100),
      neutral: Math.round((sentimentCounts.neutral / totalArticles) * 100),
    },
  };

  // Extract frequent terms (word cloud data)
  const wordFreq = extractKeyTerms(analyzed);

  return { articles: analyzed, overview, wordCloud: wordFreq };
}

function getPresetSentiment(label) {
  const presets = {
    positive: { score: 3, comparative: 0.3, label: 'positive', confidence: 0.85, positiveWords: [], negativeWords: [] },
    negative: { score: -3, comparative: -0.3, label: 'negative', confidence: 0.85, positiveWords: [], negativeWords: [] },
    neutral: { score: 0, comparative: 0, label: 'neutral', confidence: 0.7, positiveWords: [], negativeWords: [] },
  };
  return presets[label] || presets.neutral;
}

function extractKeyTerms(articles) {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
    'he', 'she', 'his', 'her', 'we', 'our', 'you', 'your', 'i', 'my',
    'said', 'says', 'also', 'than', 'more', 'most', 'very', 'just',
    'about', 'over', 'such', 'only', 'other', 'new', 'some', 'time',
  ]);

  const freq = {};

  for (const article of articles) {
    const text = `${article.title || ''} ${article.summary || ''}`.toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];

    for (const word of words) {
      if (!stopWords.has(word)) {
        freq[word] = (freq[word] || 0) + 1;
      }
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([text, value]) => ({ text, value }));
}

function generateTradingSignal(sentimentOverview, priceData) {
  const { averageScore, sentimentRatio } = sentimentOverview;
  const priceChange = priceData?.changePercent || 0;

  let signal = 'HOLD';
  let strength = 0;
  let reasoning = [];

  if (averageScore > 0.15 && sentimentRatio.positive > 60) {
    signal = 'BUY';
    strength = Math.min(averageScore * 3, 1);
    reasoning.push('Strong positive news sentiment');
  } else if (averageScore < -0.15 && sentimentRatio.negative > 60) {
    signal = 'SELL';
    strength = Math.min(Math.abs(averageScore) * 3, 1);
    reasoning.push('Strong negative news sentiment');
  }

  // Cross-reference with price movement
  if (signal === 'BUY' && priceChange < -2) {
    reasoning.push('Price dip with positive sentiment — potential opportunity');
    strength = Math.min(strength + 0.2, 1);
  } else if (signal === 'SELL' && priceChange > 2) {
    reasoning.push('Price rise with negative sentiment — potential risk');
    strength = Math.min(strength + 0.2, 1);
  }

  if (signal === 'HOLD') {
    reasoning.push('Mixed or neutral sentiment — no clear directional signal');
  }

  return {
    signal,
    strength: Math.round(strength * 100) / 100,
    reasoning,
    disclaimer: 'This is an AI-generated suggestion for educational purposes only. Not financial advice.',
  };
}

module.exports = { analyzeSentiment, analyzeArticles, generateTradingSignal };
