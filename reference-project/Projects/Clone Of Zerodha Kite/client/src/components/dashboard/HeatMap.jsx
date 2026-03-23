import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function HeatMap({ stocks = [] }) {
  const navigate = useNavigate();

  if (!stocks.length) return null;

  const maxAbsChange = Math.max(
    ...stocks.map((s) => Math.abs(s.quote?.changePercent || 0)),
    1
  );

  const getColor = (change) => {
    const intensity = Math.min(Math.abs(change) / maxAbsChange, 1);
    if (change > 0) {
      const g = Math.round(80 + intensity * 175);
      return `rgba(0, ${g}, 50, ${0.3 + intensity * 0.6})`;
    } else if (change < 0) {
      const r = Math.round(80 + intensity * 175);
      return `rgba(${r}, 20, 30, ${0.3 + intensity * 0.6})`;
    }
    return 'rgba(100, 100, 100, 0.3)';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-4"
    >
      <h3 className="font-semibold text-sm mb-3">Market Heat Map</h3>
      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-1">
        {stocks.slice(0, 50).map((stock, i) => {
          const change = stock.quote?.changePercent || 0;
          return (
            <motion.button
              key={stock.symbol}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.02 * i }}
              onClick={() => navigate(`/stocks?symbol=${stock.symbol}`)}
              className="relative p-2 rounded-md text-center transition-transform hover:scale-110 hover:z-10"
              style={{ backgroundColor: getColor(change) }}
              title={`${stock.symbol}: ${change > 0 ? '+' : ''}${change.toFixed(2)}%`}
            >
              <div className="text-[10px] font-bold truncate">{stock.symbol}</div>
              <div className={`text-[9px] font-mono ${change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-kite-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-600" />
          <span>Bearish</span>
        </div>
        <div className="w-12 h-2 rounded-full bg-gradient-to-r from-red-600 via-gray-600 to-green-600" />
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-600" />
          <span>Bullish</span>
        </div>
      </div>
    </motion.div>
  );
}
