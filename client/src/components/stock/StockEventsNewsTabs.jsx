import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Newspaper } from 'lucide-react';
import KeyEventsPanel from './KeyEventsPanel';
import NewsPanel from '../news/NewsPanel';

const TABS = [
  { id: 'events', label: 'Key Events', icon: Calendar },
  { id: 'news', label: 'News', icon: Newspaper },
];

export default function StockEventsNewsTabs({ symbol }) {
  const [activeTab, setActiveTab] = useState('events');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden flex flex-col h-full min-h-[400px]"
    >
      {/* Tabs header */}
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

      {/* Tab content */}
      <div className="flex-1 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-auto p-4"
            >
              <KeyEventsPanel symbol={symbol} />
            </motion.div>
          )}
          {activeTab === 'news' && (
            <motion.div
              key="news"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-auto p-4"
            >
              <NewsPanel symbol={symbol} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
