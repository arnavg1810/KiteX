import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp } from 'lucide-react';
import { stockAPI } from '../../services/api';

export default function StockSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await stockAPI.search(query);
        setResults(data.results || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (stock) => {
    onSelect(stock.symbol, stock.name);
    setQuery(stock.symbol);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kite-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search Nifty 50 stocks..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-kite-border/50 bg-kite-surface/80 
                     focus:border-kite-blue/50 focus:ring-1 focus:ring-kite-blue/20 outline-none 
                     text-sm transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-kite-muted hover:text-kite-text"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass-card shadow-2xl overflow-hidden z-50"
          >
            {results.map((stock, i) => (
              <motion.button
                key={stock.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i }}
                onClick={() => handleSelect(stock)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-kite-blue/10 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-kite-blue/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-kite-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{stock.symbol}</div>
                  <div className="text-xs text-kite-muted truncate">{stock.name}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-kite-border/30 text-kite-muted">
                  {stock.sector}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
