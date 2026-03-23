import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

export default function TradingSignal({ signal }) {
  const action = (signal?.action || 'HOLD').toUpperCase();
  const confidence = Math.round((signal?.confidence ?? 0) * 100);
  const summary = signal?.summary || '—';
  const rationale = signal?.rationale || '';

  const isBuy = action === 'BUY';
  const isSell = action === 'SELL';
  const Icon = isBuy ? TrendingUp : isSell ? TrendingDown : Minus;
  const colorClass = isBuy ? 'text-emerald-400' : isSell ? 'text-red-400' : 'text-kite-muted';
  const bgColorClass = isBuy ? 'bg-emerald-500/10' : isSell ? 'bg-red-500/10' : 'bg-kite-border/10';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${colorClass}`} />
        <span className={`font-semibold text-sm ${colorClass}`}>{action}</span>
        <span className="text-xs text-kite-muted ml-auto">
          <span className="font-medium">{confidence}%</span>
        </span>
      </div>
      
      <div className={`p-2 rounded text-xs ${bgColorClass}`}>
        <p className="text-kite-text leading-relaxed">{summary}</p>
      </div>

      {rationale && (
        <div className="pt-2 border-t border-kite-border/20">
          <p className="text-xs text-kite-muted leading-relaxed">
            <span className="font-medium block mb-1">Rationale:</span>
            {rationale}
          </p>
        </div>
      )}
    </div>
  );
}
