import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { stockAPI } from '../../services/api';
import { formatNumber, formatPercent } from '../../utils/constants';
import { SkeletonCard } from '../common/SkeletonLoader';

const RANGE_OPTIONS = [
  { label: '1 Day', value: '1d' },
  { label: '1 Week', value: '1w' },
];
const BUILDUP = {
  long_buildup: { label: 'Long Build-up', color: 'text-kite-green', icon: ArrowUpCircle, bg: 'bg-kite-green/15' },
  short_buildup: { label: 'Short Build-up', color: 'text-kite-red', icon: ArrowDownCircle, bg: 'bg-kite-red/15' },
  short_covering: { label: 'Short Covering', color: 'text-kite-green', icon: TrendingUp, bg: 'bg-kite-green/15' },
  long_unwinding: { label: 'Long Unwinding', color: 'text-kite-red', icon: TrendingDown, bg: 'bg-kite-red/15' },
  none: { label: '—', color: 'text-kite-muted', icon: Minus, bg: 'bg-kite-border/20' },
};

function FnoPanelInner({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('1d');

  const fetchFno = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const res = await stockAPI.getFno(symbol, range);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [symbol, range]);

  useEffect(() => { fetchFno(); }, [fetchFno]);

  if (!symbol) return null;
  if (loading && !data) return <SkeletonCard lines={6} />;

  const buildup = data?.buildUp ? BUILDUP[data.buildUp] || BUILDUP.none : BUILDUP.none;
  const BuildupIcon = buildup.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-kite-blue" />
          <h3 className="font-bold text-sm">F&O Data</h3>
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium ${range === opt.value ? 'bg-kite-blue text-white' : 'text-kite-muted hover:bg-kite-border/30'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {data && (
        <>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-kite-muted">F&O:</span>
            <span className={data.available ? 'text-kite-green font-medium' : 'text-kite-muted'}>{data.available ? 'Yes' : 'No'}</span>
          </div>
          {data.available && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-kite-muted mb-0.5">Open Interest</div>
                  <div className="font-mono font-medium">{formatNumber(data.openInterest)}</div>
                  <div className={`text-xs font-mono ${(data.oiChangePercent || 0) >= 0 ? 'price-up' : 'price-down'}`}>{formatPercent(data.oiChangePercent)}</div>
                </div>
                <div>
                  <div className="text-xs text-kite-muted mb-0.5">Delivery %</div>
                  <div className="font-mono font-medium">{data.deliveryPercent ?? '—'}%</div>
                  <div className={`text-xs font-mono ${(data.deliveryChangePercent || 0) >= 0 ? 'price-up' : 'price-down'}`}>{formatPercent(data.deliveryChangePercent)}</div>
                </div>
              </div>
              {Array.isArray(data.oiTrend) && data.oiTrend.length > 0 && (
                <div>
                  <div className="text-xs text-kite-muted mb-2">OI Trend</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={data.oiTrend}>
                      <defs><linearGradient id="oiGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2979ff" stopOpacity={0.4} /><stop offset="100%" stopColor="#2979ff" stopOpacity={0} /></linearGradient></defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#64748b" />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ background: '#16213e', border: '1px solid #233554', borderRadius: 8 }} formatter={(v) => [formatNumber(v), 'OI']} />
                      <Area type="monotone" dataKey="value" stroke="#2979ff" fill="url(#oiGrad)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              {Array.isArray(data.deliveryTrend) && data.deliveryTrend.length > 0 && (
                <div>
                  <div className="text-xs text-kite-muted mb-2">Delivery % Trend</div>
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={data.deliveryTrend}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#64748b" />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: '#16213e', border: '1px solid #233554', borderRadius: 8 }} formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Delivery']} />
                      <Line type="monotone" dataKey="value" stroke="#00c853" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${buildup.bg}`}>
                <BuildupIcon className={`w-4 h-4 ${buildup.color}`} />
                <span className={`text-sm font-medium ${buildup.color}`}>{buildup.label}</span>
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}

export default memo(FnoPanelInner);
