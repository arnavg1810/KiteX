import { motion } from 'framer-motion';
import { ExternalLink, Calendar, AlertCircle, Link2 } from 'lucide-react';
import { timeAgo } from '../../utils/constants';

export default function NewsCard({ article, index = 0 }) {
  const { title, description, publishedAt, url, source, sentiment, analysis, imageUrl, isRealNews } = article || {};
  const sentimentColor = sentiment?.label === 'positive' ? 'text-emerald-400' : sentiment?.label === 'negative' ? 'text-red-400' : 'text-kite-muted';
  const sentimentBg = sentiment?.label === 'positive' ? 'bg-emerald-500/10 border border-emerald-500/20' : sentiment?.label === 'negative' ? 'bg-red-500/10 border border-red-500/20' : 'bg-kite-border/10';

  // Debug logging
  console.log(`Article: ${title.substring(0, 50)}... | URL: ${url}`);

  const handleOpenLink = () => {
    if (url && url !== '#') {
      console.log('Opening URL:', url);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const isValidUrl = url && url !== '#' && url.startsWith('http');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card p-4 hover:border-kite-blue/30 transition-all space-y-3 ${
        isValidUrl ? 'cursor-pointer hover:shadow-lg hover:shadow-kite-blue/20' : ''
      }`}
      onClick={() => isValidUrl && handleOpenLink()}
      role="button"
      tabIndex={isValidUrl ? 0 : -1}
      onKeyDown={(e) => isValidUrl && (e.key === 'Enter' || e.key === ' ') && handleOpenLink()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-white mb-1 line-clamp-2 hover:text-kite-blue transition-colors">
            {title}
          </h4>
          {description && <p className="text-xs text-kite-muted line-clamp-2 mb-2">{description}</p>}
          <div className="flex items-center gap-2 text-xs text-kite-muted flex-wrap">
            <Calendar className="w-3 h-3" />
            <span>{publishedAt ? timeAgo(publishedAt) : '—'}</span>
            {source?.name && <span>· {source.name}</span>}
            {sentiment?.label && <span className={sentimentColor}>· {sentiment.label.toUpperCase()}</span>}
            {isRealNews && <span className="text-kite-blue">· Real News</span>}
          </div>
        </div>
        {isValidUrl ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenLink();
            }}
            className="p-1.5 rounded hover:bg-kite-blue/20 transition-colors shrink-0 text-kite-blue"
            title="Read full article"
          >
            <Link2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="p-1.5 rounded shrink-0 opacity-50">
            <ExternalLink className="w-4 h-4 text-kite-muted" />
          </div>
        )}
      </div>

      {analysis && (
        <div className={`p-2.5 rounded text-xs leading-relaxed ${sentimentBg}`}>
          <div className="flex gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-kite-muted" />
            <p className="text-kite-text">{analysis}</p>
          </div>
        </div>
      )}

      {isValidUrl && (
        <div className="text-xs text-kite-muted pt-2 border-t border-kite-border/20 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Click to read full article
        </div>
      )}
    </motion.div>
  );
}
