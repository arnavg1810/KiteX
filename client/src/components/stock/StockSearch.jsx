import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp } from 'lucide-react';
import { stockAPI } from '../../services/api';

export default function StockSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
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
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kite-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search stocks (e.g. RELIANCE, TCS)..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-kite-surface border border-kite-border/50 text-sm focus:border-kite-blue outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-kite-border/30"
          >
            <X className="w-4 h-4 text-kite-muted" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-1 py-2 glass-card rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto"
          >
            {results.map((stock) => (
              <button
                key={stock.symbol}
                type="button"
                onClick={() => handleSelect(stock)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-kite-blue/10 text-left transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-kite-blue shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{stock.symbol}</div>
                  <div className="text-xs text-kite-muted truncate">{stock.name}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
