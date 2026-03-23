import { useState, useEffect } from 'react';
import { newsAPI } from '../../services/api';

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    async function fetchNews() {
      try {
        const { data } = await newsAPI.getMarketNews();
        setHeadlines(data.articles?.map((a) => a.title) || []);
      } catch {
        setHeadlines([
          'Markets steady ahead of RBI policy decision',
          'IT stocks rally on strong Q3 earnings guidance',
          'Nifty 50 approaches key resistance level',
          'FIIs turn net buyers in Indian equities',
          'Oil prices decline, boosting airline and paint stocks',
        ]);
      }
    }
    fetchNews();
    const interval = setInterval(fetchNews, 300_000);
    return () => clearInterval(interval);
  }, []);

  if (!headlines.length) return null;

  const doubled = [...headlines, ...headlines];

  return (
    <div className="bg-kite-surface/80 border-b border-kite-border/50 py-1.5 ticker-wrap">
      <div className="ticker-content">
        {doubled.map((h, i) => (
          <span key={i} className="inline-flex items-center px-6 text-xs text-kite-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-kite-blue mr-2 flex-shrink-0" />
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}
