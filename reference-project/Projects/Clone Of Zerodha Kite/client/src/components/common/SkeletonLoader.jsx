import { motion } from 'framer-motion';

export function SkeletonLine({ width = '100%', height = '16px', className = '' }) {
  return (
    <motion.div
      className={`skeleton ${className}`}
      style={{ width, height }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`glass-card p-4 space-y-3 ${className}`}>
      <SkeletonLine width="60%" height="20px" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={`${80 - i * 15}%`} height="14px" />
      ))}
    </div>
  );
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`glass-card p-4 ${className}`}>
      <SkeletonLine width="40%" height="24px" className="mb-4" />
      <div className="flex items-end gap-1 h-48">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="skeleton flex-1 rounded-t"
            style={{ height: `${30 + Math.random() * 60}%` }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <SkeletonLine width="80px" height="14px" />
          <SkeletonLine width="120px" height="14px" />
          <SkeletonLine width="60px" height="14px" />
          <SkeletonLine width="60px" height="14px" />
        </div>
      ))}
    </div>
  );
}
