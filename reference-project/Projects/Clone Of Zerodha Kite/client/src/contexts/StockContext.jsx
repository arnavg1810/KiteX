import { createContext, useContext, useState, useCallback } from 'react';
import { stockAPI, newsAPI } from '../services/api';

const StockContext = createContext(null);

export function StockProvider({ children }) {
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockQuote, setStockQuote] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [newsData, setNewsData] = useState(null);
  const [nifty50Data, setNifty50Data] = useState(null);
  const [loading, setLoading] = useState({
    quote: false,
    chart: false,
    news: false,
    nifty50: false,
  });

  const selectStock = useCallback(async (symbol, name) => {
    setSelectedStock({ symbol, name });
    setLoading((prev) => ({ ...prev, quote: true, chart: true }));

    try {
      const [quoteRes, tsRes] = await Promise.all([
        stockAPI.getQuote(symbol),
        stockAPI.getTimeSeries(symbol, '5min', 78),
      ]);
      setStockQuote(quoteRes.data.quote);
      setTimeSeries(tsRes.data.data);
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading((prev) => ({ ...prev, quote: false, chart: false }));
    }
  }, []);

  const loadNews = useCallback(async (symbol, from, to, sort = 'latest') => {
    setLoading((prev) => ({ ...prev, news: true }));
    try {
      const { data } = await newsAPI.getCompanyNews(symbol, from, to, sort);
      setNewsData(data);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading((prev) => ({ ...prev, news: false }));
    }
  }, []);

  const loadNifty50 = useCallback(async () => {
    setLoading((prev) => ({ ...prev, nifty50: true }));
    try {
      const { data } = await stockAPI.getNifty50();
      setNifty50Data(data);
    } catch (error) {
      console.error('Error loading Nifty 50:', error);
    } finally {
      setLoading((prev) => ({ ...prev, nifty50: false }));
    }
  }, []);

  const updateQuote = useCallback((symbol, quote) => {
    if (selectedStock?.symbol === symbol) {
      setStockQuote(quote);
    }
  }, [selectedStock]);

  return (
    <StockContext.Provider
      value={{
        selectedStock,
        stockQuote,
        timeSeries,
        newsData,
        nifty50Data,
        loading,
        selectStock,
        loadNews,
        loadNifty50,
        updateQuote,
        setStockQuote,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export const useStock = () => {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStock must be used within StockProvider');
  return ctx;
};
