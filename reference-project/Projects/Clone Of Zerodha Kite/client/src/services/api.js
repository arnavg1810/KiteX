import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kite_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kite_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (data) => api.put('/auth/preferences', data),
};

// Stocks
export const stockAPI = {
  search: (q) => api.get('/stocks/search', { params: { q } }),
  getQuote: (symbol) => api.get(`/stocks/quote/${symbol}`),
  getTimeSeries: (symbol, interval, outputsize) =>
    api.get(`/stocks/timeseries/${symbol}`, { params: { interval, outputsize } }),
  getNifty50: () => api.get('/stocks/nifty50'),
  getList: () => api.get('/stocks/list'),
};

// News
export const newsAPI = {
  getCompanyNews: (symbol, from, to, sort) =>
    api.get(`/news/company/${symbol}`, { params: { from, to, sort } }),
  getMarketNews: () => api.get('/news/market'),
};

// Portfolio
export const portfolioAPI = {
  get: () => api.get('/portfolio'),
  placeOrder: (data) => api.post('/portfolio/order', data),
  getOrders: () => api.get('/portfolio/orders'),
};

// Watchlist
export const watchlistAPI = {
  get: () => api.get('/watchlist'),
  add: (symbol, name) => api.post('/watchlist/add', { symbol, name }),
  remove: (symbol) => api.delete(`/watchlist/remove/${symbol}`),
};

export default api;
