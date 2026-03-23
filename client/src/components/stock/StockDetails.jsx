import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Activity, Clock } from 'lucide-react';
import { formatCurrency, formatPercent, formatVolume } from '../../utils/constants';
import { SkeletonCard } from '../common/SkeletonLoader';

export default function StockDetails({ quote, loading }) {
  if (loading) return <SkeletonCard lines={6} />;
  if (!quote) return null;

  const isPositive = quote.change >= 0;
  const stats = [
    { label: 'Open', value: formatCurrency(quote.open), icon: Activity },
    { label: 'High', value: formatCurrency(quote.high), icon: TrendingUp, color: 'text-kite-green' },
    { label: 'Low', value: formatCurrency(quote.low), icon: TrendingDown, color: 'text-kite-red' },
    { label: 'Prev Close', value: formatCurrency(quote.previousClose), icon: Clock },
    { label: 'Volume', value: formatVolume(quote.volume), icon: BarChart3 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 glass-card-hover ${isPositive ? 'glow-green' : 'glow-red'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-display font-bold tracking-tight">{quote.symbol}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-kite-border/30 text-kite-muted">
              {quote.exchange || 'NSE'}
            </span>
            {quote.simulated && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-kite-yellow/20 text-kite-yellow">Simulated</span>
            )}
          </div>
          <p className="text-sm text-kite-muted mt-0.5">{quote.name}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${isPositive ? 'bg-kite-green/10' : 'bg-kite-red/10'}`}>
          {isPositive ? <TrendingUp className="w-6 h-6 text-kite-green" /> : <TrendingDown className="w-6 h-6 text-kite-red" />}
        </div>
      </div>
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-3xl font-bold font-mono">{formatCurrency(quote.close)}</span>
        <div className={`flex items-center gap-1 ${isPositive ? 'price-up' : 'price-down'}`}>
          <span className="text-lg font-semibold font-mono">{isPositive ? '+' : ''}{quote.change?.toFixed(2)}</span>
          <span className={`text-sm font-mono px-2 py-0.5 rounded-full ${isPositive ? 'bg-kite-green/15' : 'bg-kite-red/15'}`}>
            {formatPercent(quote.changePercent)}
          </span>
        </div>
      </div>
      <div className="space-y-2.5">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color || 'text-kite-muted'}`} />
              <span className="text-sm text-kite-muted">{stat.label}</span>
            </div>
            <span className="text-sm font-mono font-medium">{stat.value}</span>
          </div>
        ))}
      </div>
      {quote.low != null && quote.high != null && quote.high !== quote.low && (
        <div className="mt-4 pt-4 border-t border-kite-border/30">
          <div className="flex justify-between text-xs text-kite-muted mb-1"><span>Day Low</span><span>Day High</span></div>
          <div className="relative h-2 bg-kite-border/30 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-kite-red via-kite-yellow to-kite-green rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, ((quote.close - quote.low) / (quote.high - quote.low)) * 100))}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg border-2 border-kite-blue"
              style={{ left: `${Math.min(100, Math.max(0, ((quote.close - quote.low) / (quote.high - quote.low)) * 100))}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono mt-1">
            <span className="text-kite-red">{formatCurrency(quote.low)}</span>
            <span className="text-kite-green">{formatCurrency(quote.high)}</span>
          </div>
        </div>
      )}
      <div className="mt-3 text-[10px] text-kite-muted/50 text-right">
        {quote.isMarketOpen ? '🟢 Market Open' : '🔴 Market Closed'}
        {quote.timestamp && ` · ${new Date(quote.timestamp).toLocaleTimeString('en-IN')}`}
      </div>
    </motion.div>
  );
}
