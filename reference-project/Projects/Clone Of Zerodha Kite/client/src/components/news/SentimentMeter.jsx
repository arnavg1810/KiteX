import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function SentimentMeter({ overview }) {
  if (!overview) return null;

  const { sentimentCounts, averageScore, overallSentiment, sentimentRatio, totalArticles } = overview;

  const meterAngle = Math.max(-90, Math.min(90, averageScore * 300));

  const sentimentColor = {
    positive: 'text-kite-green',
    negative: 'text-kite-red',
    neutral: 'text-kite-yellow',
  };

  const sentimentBg = {
    positive: 'bg-kite-green/10',
    negative: 'bg-kite-red/10',
    neutral: 'bg-kite-yellow/10',
  };

  return (
    <div className="space-y-4">
      {/* Sentiment Gauge */}
      <div className="flex items-center justify-center">
        <div className="relative w-40 h-20 overflow-hidden">
          {/* Gauge background */}
          <div className="absolute bottom-0 left-0 right-0 h-20">
            <svg viewBox="0 0 200 100" className="w-full">
              <path d="M 10 95 A 90 90 0 0 1 190 95" fill="none" stroke="#233554" strokeWidth="12" strokeLinecap="round" />
              <path d="M 10 95 A 90 90 0 0 1 70 20" fill="none" stroke="#ff1744" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
              <path d="M 70 20 A 90 90 0 0 1 130 20" fill="none" stroke="#ffd600" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
              <path d="M 130 20 A 90 90 0 0 1 190 95" fill="none" stroke="#00c853" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
            </svg>
          </div>
          {/* Needle */}
          <motion.div
            className="absolute bottom-0 left-1/2 origin-bottom"
            initial={{ rotate: 0 }}
            animate={{ rotate: meterAngle }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            style={{ width: '2px', height: '70px', marginLeft: '-1px' }}
          >
            <div className="w-full h-full bg-white rounded-full" />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full" />
          </motion.div>
        </div>
      </div>

      <div className="text-center">
        <span className={`text-lg font-bold capitalize ${sentimentColor[overallSentiment]}`}>
          {overallSentiment}
        </span>
        <p className="text-xs text-kite-muted mt-0.5">
          Based on {totalArticles} article{totalArticles !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Sentiment Distribution */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`text-center p-2 rounded-lg ${sentimentBg.positive}`}>
          <TrendingUp className="w-3.5 h-3.5 text-kite-green mx-auto mb-1" />
          <div className="text-lg font-bold text-kite-green">{sentimentCounts.positive}</div>
          <div className="text-[10px] text-kite-muted">{sentimentRatio.positive}% Positive</div>
        </div>
        <div className={`text-center p-2 rounded-lg ${sentimentBg.neutral}`}>
          <Minus className="w-3.5 h-3.5 text-kite-yellow mx-auto mb-1" />
          <div className="text-lg font-bold text-kite-yellow">{sentimentCounts.neutral}</div>
          <div className="text-[10px] text-kite-muted">{sentimentRatio.neutral}% Neutral</div>
        </div>
        <div className={`text-center p-2 rounded-lg ${sentimentBg.negative}`}>
          <TrendingDown className="w-3.5 h-3.5 text-kite-red mx-auto mb-1" />
          <div className="text-lg font-bold text-kite-red">{sentimentCounts.negative}</div>
          <div className="text-[10px] text-kite-muted">{sentimentRatio.negative}% Negative</div>
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="h-2 rounded-full overflow-hidden flex">
        <motion.div
          className="bg-kite-green"
          initial={{ width: 0 }}
          animate={{ width: `${sentimentRatio.positive}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <motion.div
          className="bg-kite-yellow"
          initial={{ width: 0 }}
          animate={{ width: `${sentimentRatio.neutral}%` }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />
        <motion.div
          className="bg-kite-red"
          initial={{ width: 0 }}
          animate={{ width: `${sentimentRatio.negative}%` }}
          transition={{ duration: 0.8, delay: 0.6 }}
        />
      </div>
    </div>
  );
}
