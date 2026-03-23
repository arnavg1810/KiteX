import { motion } from 'framer-motion';
import { TrendingUp, Minus, TrendingDown } from 'lucide-react';

export default function SentimentMeter({ overview }) {
  const positive = Number(overview?.positive ?? 0);
  const neutral = Number(overview?.neutral ?? 0);
  const negative = Number(overview?.negative ?? 0);
  const total = positive + neutral + negative || 1;

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-kite-border/30">
        {positive > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${positive}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-emerald-500"
          />
        )}
        {neutral > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${neutral}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-full bg-gray-500"
          />
        )}
        {negative > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${negative}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-full bg-red-500"
          />
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Positive</span>
          </div>
          <p className="text-sm font-semibold text-emerald-400">{positive}%</p>
        </div>
        
        <div className="p-2 rounded bg-gray-500/10 border border-gray-500/20">
          <div className="flex items-center gap-1 mb-1">
            <Minus className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-medium text-gray-400">Neutral</span>
          </div>
          <p className="text-sm font-semibold text-gray-400">{neutral}%</p>
        </div>
        
        <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span className="text-xs font-medium text-red-400">Negative</span>
          </div>
          <p className="text-sm font-semibold text-red-400">{negative}%</p>
        </div>
      </div>
    </div>
  );
}
