import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark, Plus, X, TrendingUp, TrendingDown, Search, RefreshCw, Newspaper,
  MoreVertical, Pencil, Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { watchlistAPI, stockAPI } from '../../services/api';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { formatCurrency, formatPercent } from '../../utils/constants';
import { SkeletonTable } from '../common/SkeletonLoader';
import Sparkline from './Sparkline';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const MAX_WATCHLISTS = 5;
const toastStyle = { style: { background: '#16213e', color: '#e0e0e0', border: '1px solid #233554' } };

function WatchlistRow({ stock, quote, onRemove, onOpenStock, sparklineData }) {
  const isPositive = (quote?.change || 0) >= 0;
  const sparkPoints = useMemo(() => {
    if (!quote) return null;
    const o = quote.open ?? quote.previousClose ?? quote.close;
    const c = quote.close;
    const h = quote.high ?? Math.max(o, c);
    const l = quote.low ?? Math.min(o, c);
    return [l, o, c, h];
  }, [quote]);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="border-t border-kite-border/20 hover:bg-kite-blue/5 transition-colors"
    >
      <td className="py-3 px-4 cursor-pointer" onClick={() => onOpenStock(stock.symbol)}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-8 rounded-full ${isPositive ? 'bg-kite-green' : 'bg-kite-red'}`} />
          <div>
            <div className="font-medium">{stock.symbol}</div>
            <div className="text-xs text-kite-muted truncate max-w-[120px]">{stock.name}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <Sparkline data={sparkPoints || sparklineData} positive={isPositive} width={56} height={22} />
      </td>
      <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrency(quote?.close)}</td>
      <td className={`py-3 px-4 text-right font-mono ${isPositive ? 'price-up' : 'price-down'}`}>
        <div className="flex items-center justify-end gap-1">
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(quote?.changePercent)}
        </div>
      </td>
      <td className="py-3 px-4 text-right font-mono text-kite-muted hidden sm:table-cell">
        {(quote?.volume || 0).toLocaleString('en-IN')}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => onOpenStock(stock.symbol)} className="p-1.5 rounded hover:bg-kite-blue/20" title="View"><Newspaper className="w-3.5 h-3.5 text-kite-blue" /></button>
          <button onClick={() => onRemove(stock.symbol)} className="p-1.5 rounded hover:bg-kite-red/20" title="Remove"><X className="w-3.5 h-3.5 text-kite-red" /></button>
        </div>
      </td>
    </motion.tr>
  );
}

const MemoRow = memo(WatchlistRow);

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { subscribeStock, subscribeWatchlist } = useWebSocket();
  const [watchlists, setWatchlists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const menuContainerRef = useRef(null);

  const fetchWatchlists = useCallback(async () => {
    try {
      const { data } = await watchlistAPI.get();
      const lists = data.watchlists || (data.watchlist ? [{ ...data.watchlist, _id: data.watchlist._id || 'default' }] : []);
      setWatchlists(lists);
      setActiveListId((current) => {
        if (lists.length === 0) return null;
        const stillExists = lists.some((w) => w._id === current);
        return stillExists ? current : lists[0]._id;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlists();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) setMenuOpen(null);
    };
    const t = setTimeout(() => document.addEventListener('click', onDocClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', onDocClick);
    };
  }, [menuOpen]);

  const activeList = useMemo(() => watchlists.find((w) => w._id === activeListId) || watchlists[0], [watchlists, activeListId]);
  const activeStocks = activeList?.stocks || [];

  const activeSymbols = useMemo(() => activeStocks.map((s) => s.symbol), [activeStocks]);
  useEffect(() => {
    if (!activeSymbols.length) return;
    subscribeWatchlist(activeSymbols);
    const unsubs = activeSymbols.map((sym) =>
      subscribeStock(sym, (quote) => {
        setLiveQuotes((prev) => ({ ...prev, [sym]: quote }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [activeSymbols.join(','), subscribeStock, subscribeWatchlist]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }
    stockAPI.search(debouncedSearch).then(({ data }) => setSearchResults(data.results || [])).catch(() => setSearchResults([]));
  }, [debouncedSearch]);

  const handleAdd = async (stock, listId = activeListId) => {
    try {
      if (listId && listId !== 'default') {
        await watchlistAPI.addToList(listId, stock.symbol, stock.name);
      } else {
        await watchlistAPI.add(stock.symbol, stock.name);
      }
      toast.success(`${stock.symbol} added`, toastStyle);
      setShowAdd(false);
      setSearchQuery('');
      fetchWatchlists();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to add', toastStyle);
    }
  };

  const handleRemove = async (symbol, listId = activeListId) => {
    try {
      if (listId && listId !== 'default') {
        await watchlistAPI.removeFromList(listId, symbol);
      } else {
        await watchlistAPI.remove(symbol);
      }
      toast.success(`${symbol} removed`, toastStyle);
      fetchWatchlists();
    } catch {
      toast.error('Failed to remove', toastStyle);
    }
  };

  const handleCreateList = async () => {
    const name = window.prompt('Watchlist name', 'New Watchlist');
    if (!name?.trim()) return;
    try {
      await watchlistAPI.create(name.trim());
      toast.success('Watchlist created', toastStyle);
      fetchWatchlists();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed', toastStyle);
    }
  };

  const handleRename = async (id) => {
    if (!renameValue.trim()) { setRenameId(null); return; }
    try {
      await watchlistAPI.update(id, { name: renameValue.trim() });
      toast.success('Renamed', toastStyle);
      setRenameId(null);
      setRenameValue('');
      fetchWatchlists();
    } catch (e) {
      toast.error('Failed to rename', toastStyle);
    }
  };

  const handleDeleteList = async (id) => {
    const list = watchlists.find((w) => w._id === id);
    const name = list?.name || 'this watchlist';
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setMenuOpen(null);
    try {
      await watchlistAPI.delete(id);
      toast.success('Watchlist deleted', toastStyle);
      await fetchWatchlists();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete', toastStyle);
    }
  };

  const handleReorder = async (listId, fromIndex, toIndex) => {
    const list = watchlists.find((w) => w._id === listId);
    if (!list || toIndex < 0 || toIndex >= list.stocks.length) return;
    const stocks = [...list.stocks];
    const [removed] = stocks.splice(fromIndex, 1);
    stocks.splice(toIndex, 0, removed);
    const reordered = stocks.map((s, i) => ({ symbol: s.symbol, name: s.name, sortOrder: i }));
    try {
      await watchlistAPI.update(listId, { stocks: reordered });
      fetchWatchlists();
    } catch {
      toast.error('Failed to reorder', toastStyle);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-kite-blue" />
          <h1 className="text-2xl font-display font-bold tracking-tight">Watchlist</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchWatchlists} className="p-2 rounded-lg hover:bg-kite-border/30 transition-colors">
            <RefreshCw className="w-4 h-4 text-kite-muted" />
          </button>
          {watchlists.length < MAX_WATCHLISTS && (
            <button onClick={handleCreateList} className="btn-primary text-xs flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> New list
            </button>
          )}
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-xs flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Stock
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      {watchlists.length > 0 && (
        <div className="flex gap-1 mb-4 flex-wrap">
          {watchlists.map((wl) => (
            <div key={wl._id} className="flex items-center gap-1 rounded-lg border border-kite-border/50 overflow-visible">
              {renameId === wl._id ? (
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRename(wl._id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(wl._id); }}
                  className="px-3 py-1.5 text-sm bg-kite-surface border-0 min-w-[100px]"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setActiveListId(wl._id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeListId === wl._id ? 'bg-kite-blue/20 text-kite-blue' : 'text-kite-muted hover:bg-kite-border/20'}`}
                >
                  {wl.name}
                </button>
              )}
              <div ref={menuOpen === wl._id ? menuContainerRef : undefined} className="relative">
                <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === wl._id ? null : wl._id); }} className="p-2 hover:bg-kite-border/30 rounded" title="List options">
                  <MoreVertical className="w-4 h-4 text-kite-muted" />
                </button>
                {menuOpen === wl._id && (
                  <div className="absolute right-0 top-full mt-1 py-1 glass-card rounded-lg shadow-xl border border-kite-border/50 bg-kite-surface min-w-[160px]" style={{ zIndex: 9999 }}>
                    <button type="button" onClick={() => { setRenameId(wl._id); setRenameValue(wl.name); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-kite-border/20 text-left text-kite-text">
                      <Pencil className="w-3.5 h-3.5 shrink-0" /> Rename
                    </button>
                    <button type="button" onClick={() => handleDeleteList(wl._id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kite-red hover:bg-kite-red/10 text-left">
                      <Trash2 className="w-3.5 h-3.5 shrink-0" /> Delete watchlist
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="glass-card p-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kite-muted" />
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks to add..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-kite-border/50 bg-kite-surface text-kite-text placeholder:text-kite-muted text-sm focus:outline-none focus:border-kite-blue/50"
              />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
              {searchResults.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleAdd(stock)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-kite-blue/10 text-left"
                >
                  <span className="text-sm font-medium">{stock.symbol}</span>
                  <span className="text-xs text-kite-muted">{stock.name}</span>
                  <Plus className="w-4 h-4 text-kite-blue" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {loading ? (
        <SkeletonTable rows={5} />
      ) : !activeList?.stocks?.length ? (
        <div className="text-center py-20">
          <Bookmark className="w-12 h-12 mx-auto mb-3 text-kite-muted/30" />
          <h3 className="font-medium text-lg mb-1">This watchlist is empty</h3>
          <p className="text-sm text-kite-muted">Add stocks to track prices and sparklines</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-kite-muted bg-kite-bg/50">
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 w-16">Chart</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Change</th>
                  <th className="py-3 px-4 text-right hidden sm:table-cell">Volume</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeList.stocks.map((stock, i) => (
                  <MemoRow
                    key={stock.symbol}
                    stock={stock}
                    quote={liveQuotes[stock.symbol] || stock.quote}
                    onRemove={(sym) => handleRemove(sym, activeListId)}
                    onOpenStock={(sym) => navigate(`/stocks?symbol=${sym}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}