import { motion } from 'framer-motion';

export default function WordCloud({ words = [] }) {
  const list = Array.isArray(words) ? words : [];
  const maxVal = Math.max(...list.map((w) => w.value || 0), 1);

  return (
    <div className="flex flex-wrap gap-2 justify-center items-center py-2">
      {list.length === 0 ? (
        <p className="text-xs text-kite-muted">No keywords</p>
      ) : (
        list.slice(0, 15).map((item, i) => {
          const size = 10 + Math.round(((item.value || 0) / maxVal) * 12);
          return (
            <motion.span
              key={`${item.text}-${i}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="px-2 py-0.5 rounded bg-kite-border/30 text-kite-muted hover:text-kite-blue transition-colors"
              style={{ fontSize: `${size}px` }}
            >
              {item.text}
            </motion.span>
          );
        })
      )}
    </div>
  );
}
