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

  const selectStock = useCallback((symbol, name) => {
    setSelectedStock({ symbol, name: name || symbol });
    setStockQuote(null);
    setTimeSeries([]);
    setNewsData(null);
    setLoading({ quote: true, chart: true, news: true });
    Promise.all([
      stockAPI.getQuote(symbol).then((res) => {
        setStockQuote(res.data.quote);
        setLoading((p) => ({ ...p, quote: false }));
      }).catch(() => setLoading((p) => ({ ...p, quote: false }))),
      stockAPI.getTimeSeriesByTimeframe(symbol, '1D').then((res) => {
        setTimeSeries(res.data.data || []);
        setLoading((p) => ({ ...p, chart: false }));
      }).catch(() => setLoading((p) => ({ ...p, chart: false }))),
    ]).catch(() => {});
  }, []);

  const loadTimeSeries = useCallback(async (symbol, timeframe) => {
    setLoading((p) => ({ ...p, chart: true }));
    try {
      const res = await stockAPI.getTimeSeriesByTimeframe(symbol, timeframe);
      setTimeSeries(res.data.data || []);
    } catch {
      setTimeSeries([]);
    } finally {
      setLoading((p) => ({ ...p, chart: false }));
    }
  }, []);

  const updateQuote = useCallback((symbol, quote) => {
    if (selectedStock?.symbol === symbol) {
      setStockQuote(quote);
    }
  }, [selectedStock?.symbol]);

  const loadNews = useCallback(async (symbol, from, to, sort = 'latest') => {
    setLoading((p) => ({ ...p, news: true }));
    try {
      const { data } = await newsAPI.getCompanyNews(symbol, from, to, sort);
      setNewsData(data);
    } catch {
      setNewsData(null);
    } finally {
      setLoading((p) => ({ ...p, news: false }));
    }
  }, []);

  const loadNifty50 = useCallback(async () => {
    setLoading((p) => ({ ...p, nifty50: true }));
    try {
      const { data } = await stockAPI.getNifty50();
      setNifty50Data(data);
    } catch {
      setNifty50Data(null);
    } finally {
      setLoading((p) => ({ ...p, nifty50: false }));
    }
  }, []);

  const value = {
    selectedStock,
    stockQuote,
    timeSeries,
    newsData,
    nifty50Data,
    loading,
    selectStock,
    loadNews,
    loadNifty50,
    loadTimeSeries,
    updateQuote,
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
}

export const useStock = () => {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStock must be used within StockProvider');
  return ctx;
};
