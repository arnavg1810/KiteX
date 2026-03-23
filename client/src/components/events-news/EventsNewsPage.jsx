import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Newspaper } from 'lucide-react';
import StockSearch from '../stock/StockSearch';
import KeyEventsPanel from '../stock/KeyEventsPanel';
import NewsPanel from '../news/NewsPanel';
import { useStock } from '../../contexts/StockContext';
import { getDateRange } from '../../utils/constants';

const TABS = [
  { id: 'events', label: 'Key Events', icon: Calendar },
  { id: 'news', label: 'News', icon: Newspaper },
];

export default function EventsNewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { loadNews } = useStock();
  const urlSymbol = searchParams.get('symbol') || '';
  const [selectedSymbol, setSelectedSymbol] = useState(urlSymbol.toUpperCase() || null);
  const [activeTab, setActiveTab] = useState('events');

  useEffect(() => {
    if (urlSymbol && urlSymbol.toUpperCase() !== selectedSymbol) {
      setSelectedSymbol(urlSymbol.toUpperCase());
    }
  }, [urlSymbol]);

  useEffect(() => {
    if (selectedSymbol && urlSymbol.toUpperCase() !== selectedSymbol) {
      setSearchParams({ symbol: selectedSymbol }, { replace: true });
    }
  }, [selectedSymbol, urlSymbol, setSearchParams]);

  useEffect(() => {
    if (!selectedSymbol) return;
    const { from, to } = getDateRange(7);
    loadNews(selectedSymbol, from, to, 'latest');
  }, [selectedSymbol, loadNews]);

  const handleSelectStock = (symbol, name) => {
    const sym = (symbol || '').trim().toUpperCase();
    setSelectedSymbol(sym || null);
    setSearchParams(sym ? { symbol: sym } : {}, { replace: true });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-display font-bold tracking-tight mb-1">
          Key events and news
        </h1>
        <p className="text-sm text-kite-muted mb-4">
          View key events and news for any Nifty 50 stock. Select a stock below.
        </p>
        <div className="max-w-md">
          <StockSearch onSelect={handleSelectStock} />
        </div>
        {selectedSymbol && (
          <p className="mt-2 text-sm text-kite-muted">
            Showing events and news for <span className="font-medium text-kite-text">{selectedSymbol}</span>
          </p>
        )}
      </motion.div>

      {!selectedSymbol ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 glass-card rounded-xl"
        >
          <Calendar className="w-14 h-14 text-kite-muted mx-auto mb-4 opacity-60" />
          <h2 className="text-xl font-bold mb-2 text-kite-text">Select a stock</h2>
          <p className="text-kite-muted text-sm max-w-md mx-auto">
            Use the search above to choose a stock. Key events and news will appear here.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden flex flex-col min-h-[500px]"
        >
          <div className="flex border-b border-kite-border/30 bg-kite-bg/30">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-kite-yellow border-b-2 border-kite-yellow bg-kite-yellow/5'
                    : 'text-kite-muted hover:text-kite-text hover:bg-kite-border/10'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden min-h-[450px]">
            <AnimatePresence mode="wait">
              {activeTab === 'events' && (
                <motion.div
                  key="events"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-auto p-6"
                >
                  <KeyEventsPanel symbol={selectedSymbol} />
                </motion.div>
              )}
              {activeTab === 'news' && (
                <motion.div
                  key="news"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-auto p-6"
                >
                  <NewsPanel symbol={selectedSymbol} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
