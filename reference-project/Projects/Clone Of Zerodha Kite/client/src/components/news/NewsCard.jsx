import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { timeAgo } from '../../utils/constants';

const sentimentConfig = {
  positive: { badge: 'badge-positive', label: 'Positive' },
  negative: { badge: 'badge-negative', label: 'Negative' },
  neutral: { badge: 'badge-neutral', label: 'Neutral' },
};

export default function NewsCard({ article, index }) {
  const [expanded, setExpanded] = useState(false);

  const { sentiment } = article;
  const config = sentimentConfig[sentiment?.label] || sentimentConfig.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="glass-card-hover p-4 group"
    >
      <div className="flex items-start gap-3">
        {/* Sentiment indicator line */}
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
          sentiment?.label === 'positive' ? 'bg-kite-green' :
          sentiment?.label === 'negative' ? 'bg-kite-red' : 'bg-kite-yellow'
        }`} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h4
              className="text-sm font-medium leading-snug cursor-pointer hover:text-kite-blue transition-colors line-clamp-2"
              onClick={() => setExpanded(!expanded)}
            >
              {article.title}
            </h4>
            <span className={config.badge}>
              {config.label}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 text-xs text-kite-muted">
            <span className="font-medium text-kite-text/70">{article.source}</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(article.publishedAt)}
            </div>
            {article.provider && (
              <span className="px-1.5 py-0.5 rounded bg-kite-border/30 text-[10px]">
                {article.provider}
              </span>
            )}
          </div>

          {/* Expandable Summary */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-sm text-kite-muted mt-3 leading-relaxed">
                  {article.summary || 'No summary available.'}
                </p>

                {/* Sentiment Details */}
                {sentiment && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-kite-border/30 text-xs">
                    <span className="text-kite-muted">Confidence:</span>
                    <div className="flex-1 h-1.5 bg-kite-border/30 rounded-full overflow-hidden max-w-[100px]">
                      <div
                        className={`h-full rounded-full ${
                          sentiment.label === 'positive' ? 'bg-kite-green' :
                          sentiment.label === 'negative' ? 'bg-kite-red' : 'bg-kite-yellow'
                        }`}
                        style={{ width: `${(sentiment.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono">{Math.round((sentiment.confidence || 0) * 100)}%</span>
                  </div>
                )}

                {article.url && article.url !== '#' && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-xs text-kite-blue hover:text-blue-400 transition-colors"
                  >
                    Read full article <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-xs text-kite-muted hover:text-kite-text transition-colors"
          >
            {expanded ? (
              <>Show less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Show more <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
