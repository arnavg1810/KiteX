import { motion } from 'framer-motion';
import { Zap, AlertTriangle } from 'lucide-react';

const signalConfig = {
  BUY: { color: 'text-kite-green', bg: 'bg-kite-green/10', border: 'border-kite-green/30' },
  SELL: { color: 'text-kite-red', bg: 'bg-kite-red/10', border: 'border-kite-red/30' },
  HOLD: { color: 'text-kite-yellow', bg: 'bg-kite-yellow/10', border: 'border-kite-yellow/30' },
};

export default function TradingSignal({ signal }) {
  if (!signal) return null;

  const config = signalConfig[signal.signal] || signalConfig.HOLD;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-xl border ${config.bg} ${config.border}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Zap className={`w-4 h-4 ${config.color}`} />
        <span className="text-xs font-medium text-kite-muted">AI Signal</span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className={`text-2xl font-bold ${config.color}`}>{signal.signal}</span>
        {signal.strength !== undefined && (
          <div className="flex-1">
            <div className="h-2 bg-kite-border/30 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  signal.signal === 'BUY' ? 'bg-kite-green' :
                  signal.signal === 'SELL' ? 'bg-kite-red' : 'bg-kite-yellow'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${signal.strength * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <span className="text-[10px] text-kite-muted mt-0.5 block">
              Strength: {Math.round(signal.strength * 100)}%
            </span>
          </div>
        )}
      </div>

      {signal.reasoning?.length > 0 && (
        <ul className="space-y-1 mb-3">
          {signal.reasoning.map((r, i) => (
            <li key={i} className="text-xs text-kite-muted flex items-start gap-1.5">
              <span className={`mt-1 w-1 h-1 rounded-full flex-shrink-0 ${
                signal.signal === 'BUY' ? 'bg-kite-green' :
                signal.signal === 'SELL' ? 'bg-kite-red' : 'bg-kite-yellow'
              }`} />
              {r}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-start gap-1.5 pt-2 border-t border-kite-border/20">
        <AlertTriangle className="w-3 h-3 text-kite-yellow mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-kite-muted leading-relaxed">
          {signal.disclaimer}
        </p>
      </div>
    </motion.div>
  );
}
