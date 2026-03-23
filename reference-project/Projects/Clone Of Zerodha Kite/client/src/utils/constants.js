export const NIFTY_50_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
  'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'TITAN',
  'SUNPHARMA', 'BAJFINANCE', 'WIPRO', 'HCLTECH', 'TATAMOTORS',
  'ULTRACEMCO', 'NESTLEIND', 'NTPC', 'POWERGRID', 'ONGC',
  'M&M', 'TATASTEEL', 'JSWSTEEL', 'ADANIENT', 'ADANIPORTS',
  'TECHM', 'BAJAJFINSV', 'HDFCLIFE', 'SBILIFE', 'DIVISLAB',
  'DRREDDY', 'CIPLA', 'APOLLOHOSP', 'EICHERMOT', 'GRASIM',
  'INDUSINDBK', 'BRITANNIA', 'COALINDIA', 'BPCL', 'TATACONSUM',
  'HEROMOTOCO', 'HINDALCO', 'BAJAJ-AUTO', 'UPL',
];

export const SECTORS = {
  Energy: ['RELIANCE', 'ONGC', 'BPCL'],
  IT: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM'],
  Banking: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK', 'INDUSINDBK'],
  FMCG: ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'TATACONSUM'],
  Automobile: ['MARUTI', 'TATAMOTORS', 'M&M', 'EICHERMOT', 'HEROMOTOCO', 'BAJAJ-AUTO'],
  Pharma: ['SUNPHARMA', 'DIVISLAB', 'DRREDDY', 'CIPLA'],
  Finance: ['BAJFINANCE', 'BAJAJFINSV'],
  Metals: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO'],
};

export const NEWS_DURATION_OPTIONS = [
  { label: '1 Day', value: '1d', days: 1 },
  { label: '1 Week', value: '1w', days: 7 },
  { label: '1 Month', value: '1m', days: 30 },
  { label: 'Custom', value: 'custom', days: null },
];

export const CHART_INTERVALS = [
  { label: '1m', value: '1min' },
  { label: '5m', value: '5min' },
  { label: '15m', value: '15min' },
  { label: '30m', value: '30min' },
  { label: '1h', value: '1h' },
  { label: '1D', value: '1day' },
];

export const formatCurrency = (value) => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value) => {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('en-IN').format(value);
};

export const formatPercent = (value) => {
  if (value === undefined || value === null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatVolume = (vol) => {
  if (!vol) return '—';
  if (vol >= 10_000_000) return `${(vol / 10_000_000).toFixed(2)} Cr`;
  if (vol >= 100_000) return `${(vol / 100_000).toFixed(2)} L`;
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)} K`;
  return vol.toString();
};

export const getDateRange = (days) => {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
};

export const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
