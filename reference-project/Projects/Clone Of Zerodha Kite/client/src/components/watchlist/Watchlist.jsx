import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark, Plus, X, TrendingUp, TrendingDown, Search, RefreshCw, Newspaper,
} from 'lucide-react';
import { watchlistAPI, stockAPI } from '../../services/api';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { formatCurrency, formatPercent } from '../../utils/constants';
import { SkeletonTable } from '../common/SkeletonLoader';
import toast from 'react-hot-toast';

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { subscribeStock } = useWebSocket();
  const [watchlist, setWatchlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [liveQuotes, setLiveQuotes] = useState({});

  const fetchWatchlist = useCallback(async () => {
    try {
      const { data } = await watchlistAPI.get();
      setWatchlist(data.watchlist);

      // Update live quotes from response
      const quotes = {};
      for (const s of data.watchlist.stocks || []) {
        if (s.quote) quotes[s.symbol] = s.quote;
      }
      setLiveQuotes(quotes);
    } catch (error) {
      console.error('Watchlist error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!watchlist?.stocks?.length) return;

    const unsubscribers = watchlist.stocks.map((s) =>
      subscribeStock(s.symbol, (quote) => {
        setLiveQuotes((prev) => ({ ...prev, [s.symbol]: quote }));
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [watchlist?.stocks, subscribeStock]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const { data } = await stockAPI.search(q);
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    }
  };

  const handleAdd = async (stock) => {
    try {
      await watchlistAPI.add(stock.symbol, stock.name);
      toast.success(`${stock.symbol} added to watchlist`, {
        style: { background: '#16213e', color: '#e0e0e0', border: '1px solid #233554' },
      });
      setShowAdd(false);
      setSearchQuery('');
      fetchWatchlist();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add', {
        style: { background: '#16213e', color: '#e0e0e0', border: '1px solid #233554' },
      });
    }
  };

  const handleRemove = async (symbol) => {
    try {
      await watchlistAPI.remove(symbol);
      toast.success(`${symbol} removed`, {
        style: { background: '#16213e', color: '#e0e0e0', border: '1px solid #233554' },
      });
      fetchWatchlist();
    } catch (error) {
      toast.error('Failed to remove', {
        style: { background: '#16213e', color: '#e0e0e0', border: '1px solid #233554' },
      });
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-kite-blue" />
          <h1 className="text-2xl font-bold">Watchlist</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchWatchlist}
            className="p-2 rounded-lg hover:bg-kite-border/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-kite-muted" />
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn-primary text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stock
          </button>
        </div>
      </motion.div>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-card p-4 mb-4 overflow-hidden"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kite-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search stocks to add..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-kite-border/50 text-sm"
                autoFocus
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleAdd(stock)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-kite-blue/10 transition-colors text-left"
                  >
                    <div>
                      <span className="text-sm font-medium">{stock.symbol}</span>
                      <span className="text-xs text-kite-muted ml-2">{stock.name}</span>
                    </div>
                    <Plus className="w-4 h-4 text-kite-blue" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watchlist Table */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : !watchlist?.stocks?.length ? (
        <div className="text-center py-20">
          <Bookmark className="w-12 h-12 mx-auto mb-3 text-kite-muted/30" />
          <h3 className="font-medium text-lg mb-1">Your watchlist is empty</h3>
          <p className="text-sm text-kite-muted">Add stocks to track their prices and news</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-kite-muted bg-kite-bg/50">
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Change</th>
                  <th className="py-3 px-4 text-right hidden sm:table-cell">Volume</th>
                  <th className="py-3 px-4 text-right hidden md:table-cell">Open</th>
                  <th className="py-3 px-4 text-right hidden md:table-cell">High</th>
                  <th className="py-3 px-4 text-right hidden md:table-cell">Low</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.stocks.map((stock, i) => {
                  const quote = liveQuotes[stock.symbol] || stock.quote;
                  const isPositive = (quote?.change || 0) >= 0;

                  return (
                    <motion.tr
                      key={stock.symbol}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-t border-kite-border/20 hover:bg-kite-blue/5 transition-colors"
                    >
                      <td
                        className="py-3 px-4 cursor-pointer"
                        onClick={() => navigate(`/stocks?symbol=${stock.symbol}`)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-8 rounded-full ${isPositive ? 'bg-kite-green' : 'bg-kite-red'}`} />
                          <div>
                            <div className="font-medium">{stock.symbol}</div>
                            <div className="text-xs text-kite-muted truncate max-w-[120px]">{stock.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium">
                        {formatCurrency(quote?.close)}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono ${isPositive ? 'price-up' : 'price-down'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatPercent(quote?.changePercent)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-kite-muted hidden sm:table-cell">
                        {(quote?.volume || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-kite-muted hidden md:table-cell">
                        {formatCurrency(quote?.open)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-kite-muted hidden md:table-cell">
                        {formatCurrency(quote?.high)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-kite-muted hidden md:table-cell">
                        {formatCurrency(quote?.low)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/stocks?symbol=${stock.symbol}`)}
                            className="p-1.5 rounded hover:bg-kite-blue/20 transition-colors"
                            title="View news & details"
                          >
                            <Newspaper className="w-3.5 h-3.5 text-kite-blue" />
                          </button>
                          <button
                            onClick={() => handleRemove(stock.symbol)}
                            className="p-1.5 rounded hover:bg-kite-red/20 transition-colors"
                            title="Remove from watchlist"
                          >
                            <X className="w-3.5 h-3.5 text-kite-red" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
