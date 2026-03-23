import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper, Filter, SortAsc, Calendar, RefreshCw, ChevronDown,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useStock } from '../../contexts/StockContext';
import { NEWS_DURATION_OPTIONS, getDateRange } from '../../utils/constants';
import NewsCard from './NewsCard';
import SentimentMeter from './SentimentMeter';
import WordCloud from './WordCloud';
import TradingSignal from './TradingSignal';
import { SkeletonCard } from '../common/SkeletonLoader';

export default function NewsPanel({ symbol }) {
  const { newsData, loading, loadNews } = useStock();
  const [duration, setDuration] = useState('1w');
  const [sort, setSort] = useState('latest');
  const [customFrom, setCustomFrom] = useState(null);
  const [customTo, setCustomTo] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState('all');

  const fetchNews = useCallback(() => {
    if (!symbol) return;

    if (duration === 'custom' && customFrom && customTo) {
      loadNews(
        symbol,
        customFrom.toISOString().split('T')[0],
        customTo.toISOString().split('T')[0],
        sort
      );
    } else if (duration !== 'custom') {
      const opt = NEWS_DURATION_OPTIONS.find((o) => o.value === duration);
      const { from, to } = getDateRange(opt?.days || 7);
      loadNews(symbol, from, to, sort);
    }
  }, [symbol, duration, sort, customFrom, customTo, loadNews]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Auto-refresh every 3 minutes
  useEffect(() => {
    const interval = setInterval(fetchNews, 180_000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const filteredArticles = (newsData?.articles || []).filter((a) => {
    if (sentimentFilter === 'all') return true;
    return a.sentiment?.label === sentimentFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-kite-blue" />
            <h3 className="font-bold text-base">News & Sentiment</h3>
            {newsData?.companyName && (
              <span className="text-sm text-kite-muted">— {newsData.companyName}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:bg-kite-border/30 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={fetchNews}
              disabled={loading.news}
              className="p-1.5 rounded-lg hover:bg-kite-border/30 transition-colors"
              title="Refresh news"
            >
              <RefreshCw className={`w-4 h-4 text-kite-muted ${loading.news ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Duration Selector */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Calendar className="w-3.5 h-3.5 text-kite-muted" />
          {NEWS_DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setDuration(opt.value);
                setShowCustom(opt.value === 'custom');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                duration === opt.value
                  ? 'bg-kite-blue text-white'
                  : 'text-kite-muted hover:bg-kite-border/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {showCustom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="flex flex-wrap items-center gap-3 mb-3 p-3 rounded-lg bg-kite-bg/50"
          >
            <div>
              <label className="text-xs text-kite-muted block mb-1">From</label>
              <DatePicker
                selected={customFrom}
                onChange={setCustomFrom}
                maxDate={customTo || new Date()}
                className="px-3 py-1.5 rounded-lg text-xs bg-kite-surface border border-kite-border/50 w-32"
                placeholderText="Start date"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div>
              <label className="text-xs text-kite-muted block mb-1">To</label>
              <DatePicker
                selected={customTo}
                onChange={setCustomTo}
                minDate={customFrom}
                maxDate={new Date()}
                className="px-3 py-1.5 rounded-lg text-xs bg-kite-surface border border-kite-border/50 w-32"
                placeholderText="End date"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <button
              onClick={fetchNews}
              disabled={!customFrom || !customTo}
              className="btn-primary text-xs mt-4 disabled:opacity-50"
            >
              Apply
            </button>
          </motion.div>
        )}

        {/* Filters Row */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="flex flex-wrap items-center gap-3 pt-3 border-t border-kite-border/30"
          >
            {/* Sorting */}
            <div className="flex items-center gap-2">
              <SortAsc className="w-3.5 h-3.5 text-kite-muted" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-2 py-1 rounded-lg text-xs bg-kite-surface border border-kite-border/50"
              >
                <option value="latest">Latest</option>
                <option value="relevance">Most Relevant</option>
              </select>
            </div>

            {/* Sentiment Filter */}
            <div className="flex items-center gap-1">
              {['all', 'positive', 'neutral', 'negative'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSentimentFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-colors ${
                    sentimentFilter === f
                      ? f === 'positive' ? 'badge-positive' :
                        f === 'negative' ? 'badge-negative' :
                        f === 'neutral' ? 'badge-neutral' :
                        'bg-kite-blue/20 text-kite-blue'
                      : 'text-kite-muted hover:bg-kite-border/30'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Sentiment + Signal Panel */}
      {newsData && !loading.news && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <h4 className="text-xs font-medium text-kite-muted mb-3">Sentiment Analysis</h4>
            <SentimentMeter overview={newsData.overview} />
          </div>
          <div className="glass-card p-4">
            <h4 className="text-xs font-medium text-kite-muted mb-3">AI Trading Signal</h4>
            <TradingSignal signal={newsData.tradingSignal} />
          </div>
          <div className="glass-card p-4">
            <h4 className="text-xs font-medium text-kite-muted mb-3">Key Terms</h4>
            <WordCloud words={newsData.wordCloud} />
          </div>
        </div>
      )}

      {/* Articles List */}
      {loading.news ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="space-y-3">
          {filteredArticles.map((article, i) => (
            <NewsCard key={article.id} article={article} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-kite-muted">
          <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No news articles found for this period.</p>
        </div>
      )}
    </motion.div>
  );
}
