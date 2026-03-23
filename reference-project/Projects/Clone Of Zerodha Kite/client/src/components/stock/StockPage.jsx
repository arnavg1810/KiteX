import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStock } from '../../contexts/StockContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import StockSearch from './StockSearch';
import StockDetails from './StockDetails';
import StockChart from './StockChart';
import OrderForm from './OrderForm';
import NewsPanel from '../news/NewsPanel';
import { getDateRange } from '../../utils/constants';

export default function StockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedStock, stockQuote, timeSeries, loading, selectStock, loadNews, updateQuote } = useStock();
  const { subscribeStock } = useWebSocket();

  const urlSymbol = searchParams.get('symbol');

  useEffect(() => {
    if (urlSymbol && (!selectedStock || selectedStock.symbol !== urlSymbol)) {
      selectStock(urlSymbol, urlSymbol);
    }
  }, [urlSymbol, selectedStock, selectStock]);

  useEffect(() => {
    if (selectedStock?.symbol) {
      const unsubscribe = subscribeStock(selectedStock.symbol, (quote) => {
        updateQuote(selectedStock.symbol, quote);
      });

      const { from, to } = getDateRange(7);
      loadNews(selectedStock.symbol, from, to);

      return unsubscribe;
    }
  }, [selectedStock?.symbol, subscribeStock, updateQuote, loadNews]);

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

      {!selectedStock ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-xl font-bold mb-2">Search a Stock</h2>
          <p className="text-kite-muted text-sm">
            Search any Nifty 50 stock to view real-time prices, charts, news, and sentiment analysis
          </p>
        </motion.div>
      ) : (
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

          {/* Center Column: Chart + News */}
          <div className="lg:col-span-9 space-y-6">
            <StockChart
              symbol={selectedStock.symbol}
              timeSeries={timeSeries}
              loading={loading.chart}
            />
            <NewsPanel symbol={selectedStock.symbol} />
          </div>
        </div>
      )}
    </div>
  );
}
