import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatPercent } from '../../utils/constants';

export default function TopMovers({ gainers = [], losers = [] }) {
  const navigate = useNavigate();

  const handleClick = (symbol) => {
    navigate(`/stocks?symbol=${symbol}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Gainers */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-kite-green" />
          <h3 className="font-semibold text-sm">Top Gainers</h3>
        </div>
        <div className="space-y-1">
          {gainers.map((stock, i) => (
            <motion.button
              key={stock.symbol}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => handleClick(stock.symbol)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-kite-green/5 transition-colors group"
            >
              <div className="text-left">
                <div className="text-sm font-medium group-hover:text-kite-green transition-colors">
                  {stock.symbol}
                </div>
                <div className="text-xs text-kite-muted truncate max-w-[140px]">{stock.name}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono">{formatCurrency(stock.quote?.close)}</div>
                <div className="text-xs font-mono text-kite-green">
                  {formatPercent(stock.quote?.changePercent)}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Losers */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-kite-red" />
          <h3 className="font-semibold text-sm">Top Losers</h3>
        </div>
        <div className="space-y-1">
          {losers.map((stock, i) => (
            <motion.button
              key={stock.symbol}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => handleClick(stock.symbol)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-kite-red/5 transition-colors group"
            >
              <div className="text-left">
                <div className="text-sm font-medium group-hover:text-kite-red transition-colors">
                  {stock.symbol}
                </div>
                <div className="text-xs text-kite-muted truncate max-w-[140px]">{stock.name}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono">{formatCurrency(stock.quote?.close)}</div>
                <div className="text-xs font-mono text-kite-red">
                  {formatPercent(stock.quote?.changePercent)}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
