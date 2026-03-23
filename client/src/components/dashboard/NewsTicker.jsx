import { useState, useEffect } from 'react';
import { newsAPI } from '../../services/api';

const DEFAULT_HEADLINES = [
  'Markets steady ahead of RBI policy decision',
  'IT stocks rally on strong Q3 earnings guidance',
  'Nifty 50 approaches key resistance level',
  'FIIs turn net buyers in Indian equities',
  'Oil prices decline, boosting airline and paint stocks',
  'Rupee strengthens against US dollar',
  'Top tech companies announce expansion plans',
  'Banking sector shows strong Q3 performance',
  'Pharma stocks surge on new approvals',
  'Commodity prices hit new highs',
  'Startup ecosystem attracts record investments',
  'Market sentiment remains bullish for 2026',
];

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState(DEFAULT_HEADLINES);

  useEffect(() => {
    async function fetchNews() {
      try {
        const { data } = await newsAPI.getMarketNews();
        const apiHeadlines = data.articles?.map((a) => a.title) || [];
        // Merge API results with defaults, ensuring minimum 8 headlines
        const merged = [...apiHeadlines, ...DEFAULT_HEADLINES].slice(0, 12);
        setHeadlines(merged.length >= 8 ? merged : DEFAULT_HEADLINES);
      } catch {
        setHeadlines(DEFAULT_HEADLINES);
      }
    }
    fetchNews();
    const interval = setInterval(fetchNews, 300_000);
    return () => clearInterval(interval);
  }, []);

  const tripled = [...headlines, ...headlines, ...headlines];

  return (
    <div className="bg-kite-surface/90 border-b border-kite-border/50 py-2 ticker-wrap backdrop-blur-sm">
      <div className="ticker-content">
        {tripled.map((h, i) => (
          <span key={i} className="inline-flex items-center px-6 text-xs text-kite-muted font-sans whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-kite-blue mr-2 flex-shrink-0" />
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}
