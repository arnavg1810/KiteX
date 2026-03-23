import { memo } from 'react';

/**
 * Mini sparkline from array of numbers (e.g. last 7 closes or [open, ..., close]).
 * If no data, renders a flat line.
 */
function Sparkline({ data, width = 64, height = 24, positive = true, className = '' }) {
  const arr = Array.isArray(data) && data.length > 0 ? data : [0, 0];
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const step = w / (arr.length - 1) || 0;
  const points = arr.map((v, i) => {
    const x = pad + i * step;
    const y = pad + h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  const color = positive ? '#00c853' : '#ff1744';

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default memo(Sparkline);
