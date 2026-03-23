import { motion } from 'framer-motion';

export default function WordCloud({ words = [] }) {
  if (!words.length) return null;

  const maxVal = Math.max(...words.map((w) => w.value), 1);

  const getSize = (value) => {
    const ratio = value / maxVal;
    return 10 + ratio * 18;
  };

  const getOpacity = (value) => {
    return 0.4 + (value / maxVal) * 0.6;
  };

  const colors = [
    'text-kite-blue', 'text-kite-green', 'text-kite-accent',
    'text-purple-400', 'text-cyan-400', 'text-amber-400',
    'text-kite-text', 'text-pink-400', 'text-indigo-400',
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center items-center py-2">
      {words.slice(0, 30).map((word, i) => (
        <motion.span
          key={word.text}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: getOpacity(word.value), scale: 1 }}
          transition={{ delay: i * 0.02, type: 'spring', stiffness: 200 }}
          className={`font-medium cursor-default hover:opacity-100 transition-opacity ${colors[i % colors.length]}`}
          style={{ fontSize: `${getSize(word.value)}px` }}
          title={`${word.text}: ${word.value} mentions`}
        >
          {word.text}
        </motion.span>
      ))}
    </div>
  );
}
