import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPercent } from '../../utils/constants';

export default function MarketOverview({ indexData }) {
  if (!indexData) return null;

  const isPositive = indexData.change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 ${isPositive ? 'glow-green' : 'glow-red'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">{indexData.name}</h3>
          <p className="text-xs text-kite-muted mt-0.5">Indian benchmark index</p>
        </div>
        <div className={`p-2 rounded-lg ${isPositive ? 'bg-kite-green/10' : 'bg-kite-red/10'}`}>
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-kite-green" />
          ) : (
            <TrendingDown className="w-5 h-5 text-kite-red" />
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-2xl font-bold font-mono ${isPositive ? 'price-up' : 'price-down'}`}>
          {formatPercent(indexData.change)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-lg bg-kite-green/5">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-kite-green" />
            <span className="text-xs text-kite-muted">Advancers</span>
          </div>
          <span className="text-lg font-bold text-kite-green">{indexData.advancers}</span>
        </div>
        <div className="text-center p-2 rounded-lg bg-kite-red/5">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="w-3 h-3 text-kite-red" />
            <span className="text-xs text-kite-muted">Decliners</span>
          </div>
          <span className="text-lg font-bold text-kite-red">{indexData.decliners}</span>
        </div>
        <div className="text-center p-2 rounded-lg bg-kite-yellow/5">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Minus className="w-3 h-3 text-kite-yellow" />
            <span className="text-xs text-kite-muted">Unchanged</span>
          </div>
          <span className="text-lg font-bold text-kite-yellow">{indexData.unchanged}</span>
        </div>
      </div>
    </motion.div>
  );
}
