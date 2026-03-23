import { useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStock } from '../../contexts/StockContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import StockSearch from './StockSearch';
import StockDetails from './StockDetails';
import StockChart from './StockChart';
import OrderForm from './OrderForm';
import FnoPanel from './FnoPanel';
import ErrorBoundary from '../common/ErrorBoundary';

export default function StockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { selectedStock, stockQuote, timeSeries, loading, selectStock, updateQuote } = useStock();
  const { subscribeStock } = useWebSocket();

  const urlSymbol = searchParams.get('symbol') || new URLSearchParams(location.search || '').get('symbol') || undefined;

  useEffect(() => {
    const sym = (urlSymbol || '').trim().toUpperCase();
    if (!sym) return;
    if (!selectedStock || (selectedStock.symbol || '').toUpperCase() !== sym) {
      selectStock(sym, sym);
    }
  }, [urlSymbol, selectedStock, selectStock]);

  useEffect(() => {
    if (selectedStock?.symbol) {
      const unsubscribe = subscribeStock(selectedStock.symbol, (quote) => {
        updateQuote(selectedStock.symbol, quote);
      });
      return unsubscribe;
    }
  }, [selectedStock?.symbol, subscribeStock, updateQuote]);

  const handleSelectStock = (symbol, name) => {
    setSearchParams({ symbol });
    selectStock(symbol, name);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <StockSearch onSelect={handleSelectStock} />
      </motion.div>

      {urlSymbol && !selectedStock ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-10 h-10 border-2 border-kite-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-kite-text">Loading {urlSymbol}</h2>
          <p className="text-kite-muted text-sm">Fetching quote and chart…</p>
        </motion.div>
      ) : !selectedStock ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-xl font-bold mb-2 text-kite-text">Search a Stock</h2>
          <p className="text-kite-muted text-sm">
            Search any Nifty 50 stock to view real-time prices, charts, news, and sentiment analysis
          </p>
        </motion.div>
      ) : (
        <ErrorBoundary>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Stock Details + Order Form */}
            <div className="lg:col-span-3 space-y-4">
              <StockDetails quote={stockQuote} loading={loading.quote} />
              <OrderForm
                symbol={selectedStock.symbol}
                currentPrice={stockQuote?.close}
                name={selectedStock.name}
              />
            </div>

            {/* Chart + F&O */}
            <div className="lg:col-span-9 space-y-6">
              <StockChart
                symbol={selectedStock.symbol}
                timeSeries={timeSeries}
                loading={loading.chart}
                stockQuote={stockQuote}
              />
              <FnoPanel symbol={selectedStock.symbol} />
            </div>
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
}
