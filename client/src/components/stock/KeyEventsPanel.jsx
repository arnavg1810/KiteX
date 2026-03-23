import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter, Briefcase, FileText, DollarSign, Megaphone, Building2, RefreshCw, Newspaper, TrendingUp, TrendingDown } from 'lucide-react';
import { newsAPI } from '../../services/api';
import { SkeletonCard } from '../common/SkeletonLoader';

const EVENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All', icon: Filter },
  { value: 'earnings', label: 'Earnings', icon: DollarSign },
  { value: 'corporate_action', label: 'Corporate action', icon: Briefcase },
  { value: 'regulatory', label: 'Regulatory', icon: FileText },
  { value: 'dividend', label: 'Dividend', icon: DollarSign },
  { value: 'board_meeting', label: 'Board meeting', icon: Building2 },
  { value: 'news', label: 'News', icon: Megaphone },
];

function KeyEventsPanelInner({ symbol }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchEventsAndNews = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const res = await newsAPI.getEventsAndNews(symbol);
      let combined = res.data?.combined || [];
      
      // Apply filter
      if (filter !== 'all') {
        combined = combined.filter(item => item.type === filter);
      }
      
      setItems(combined);
    } catch (error) {
      console.error('Error fetching events and news:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [symbol, filter]);

  useEffect(() => {
    fetchEventsAndNews();
  }, [fetchEventsAndNews]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEventsAndNews();
    }, 300_000);
    return () => clearInterval(interval);
  }, [fetchEventsAndNews]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEventsAndNews();
    setRefreshing(false);
  };

  if (!symbol) return null;
  if (loading && items.length === 0) return <SkeletonCard lines={5} className="min-h-[200px]" />;

  const getSentimentIcon = (sentiment) => {
    if (!sentiment) return null;
    if (sentiment.label === 'positive') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (sentiment.label === 'negative') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'text-kite-muted';
    if (sentiment.label === 'positive') return 'text-green-500';
    if (sentiment.label === 'negative') return 'text-red-500';
    return 'text-kite-muted';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 space-y-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-kite-yellow" />
          <h3 className="font-bold text-sm">Key Events & Announcements</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded hover:bg-kite-border/30 transition-colors"
            title="Refresh events and news"
          >
            <RefreshCw className={`w-4 h-4 text-kite-muted ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex flex-wrap gap-1">
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filter === opt.value ? 'bg-kite-yellow/20 text-kite-yellow' : 'text-kite-muted hover:bg-kite-border/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-0 divide-y divide-kite-border/20 max-h-[420px] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-kite-muted py-4">No events or news in this period.</p>
        ) : (
          items.map((item, i) => (
            <motion.div
              key={`${item.date}-${item.title}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="py-3 first:pt-0 hover:bg-kite-border/10 px-2 -mx-2 rounded transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-xs font-mono text-kite-muted shrink-0 w-20">{item.date}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-kite-border/30 text-kite-muted capitalize">
                      {(item.type || 'event').replace(/_/g, ' ')}
                    </span>
                    {item.newsItem && (
                      <>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 flex items-center gap-1">
                          <Newspaper className="w-3 h-3" />
                          News
                        </span>
                        {getSentimentIcon(item.sentiment) && (
                          <span className={`text-xs flex items-center gap-1 ${getSentimentColor(item.sentiment)}`}>
                            {getSentimentIcon(item.sentiment)}
                            {item.sentiment?.label || ''}
                          </span>
                        )}
                      </>
                    )}
                    {item.source && (
                      <span className="text-xs text-kite-muted italic ml-auto">{item.source}</span>
                    )}
                  </div>
                  <h4 className="font-medium text-sm">{item.title || '—'}</h4>
                  {item.description && (
                    <p className="text-xs text-kite-muted mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="text-xs text-kite-muted text-center pt-2 border-t border-kite-border/20">
          Showing {items.length} events and news • Auto-refresh every 5 minutes
        </div>
      )}
    </motion.div>
  );
}

export default memo(KeyEventsPanelInner);
