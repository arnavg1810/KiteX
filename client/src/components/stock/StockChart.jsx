import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createChart } from 'lightweight-charts';
import { CHART_TIMEFRAMES } from '../../utils/constants';
import { useStock } from '../../contexts/StockContext';
import { SkeletonChart } from '../common/SkeletonLoader';

const IST_OPTIONS = { timeZone: 'Asia/Kolkata' };

/** Format chart axis: intraday = time (IST 9:15–15:30); higher frames = date per bar */
function formatTimeIST(utcSeconds, isIntraday) {
  const d = new Date(utcSeconds * 1000);
  if (isIntraday) {
    return d.toLocaleTimeString('en-IN', { ...IST_OPTIONS, hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return d.toLocaleDateString('en-IN', { ...IST_OPTIONS, day: 'numeric', month: 'short' });
}

export default function StockChart({ symbol, timeSeries, loading, stockQuote }) {
  const { loadTimeSeries } = useStock();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [timeframe, setTimeframe] = useState('1D');

  const isIntraday = (() => {
    if (timeframe === '1D') return true;
    if (!timeSeries || timeSeries.length < 2) return false;
    const first = new Date(timeSeries[0].time);
    const second = new Date(timeSeries[1].time);
    if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) return timeframe === '1D';
    const diffMs = Math.abs(second.getTime() - first.getTime());
    // Treat series with bar spacing less than half a day as intraday (e.g. 5min custom range)
    return diffMs < 12 * 60 * 60 * 1000;
  })();

  const currentTimeframeConfig = CHART_TIMEFRAMES.find((tf) => tf.value === timeframe);
  const timeframeLabel = currentTimeframeConfig?.label || '1 Day';

  let subtitle = `Price · ${timeframeLabel}`;
  if (isIntraday) {
    subtitle = 'Price · NSE/BSE 9:15 AM – 3:30 PM IST';
  } else if (timeSeries && timeSeries.length) {
    const first = new Date(timeSeries[0].time);
    const last = new Date(timeSeries[timeSeries.length - 1].time);
    const opts = { ...IST_OPTIONS, day: 'numeric', month: 'short', year: 'numeric' };
    const fromStr = Number.isNaN(first.getTime())
      ? ''
      : first.toLocaleDateString('en-IN', opts);
    const toStr = Number.isNaN(last.getTime())
      ? ''
      : last.toLocaleDateString('en-IN', opts);
    if (fromStr && toStr) {
      const range = fromStr === toStr ? fromStr : `${fromStr} – ${toStr}`;
      subtitle = `Price · ${timeframeLabel} · ${range}`;
    }
  }

  useEffect(() => {
    setTimeframe('1D');
  }, [symbol]);

  const handleRangeClick = (value) => {
    setTimeframe(value);
    if (symbol) loadTimeSeries(symbol, value);
  };

  useEffect(() => {
    if (!chartRef.current || !symbol) return;
    if (chartInstance.current) {
      chartInstance.current.remove();
      chartInstance.current = null;
    }
    let chart;
    try {
      const width = Math.max(chartRef.current.clientWidth || 400, 100);
      chart = createChart(chartRef.current, {
        layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#8b95a5' },
        grid: { vertLines: { color: '#23355420' }, horzLines: { color: '#23355420' } },
        width,
        height: 360,
        timeScale: {
          borderColor: '#233554',
          timeVisible: true,
          secondsVisible: false,
          tickMarkFormatter: (time) => formatTimeIST(time, isIntraday),
        },
        rightPriceScale: { borderColor: '#233554', scaleMargins: { top: 0.1, bottom: 0.2 } },
      });
      const candleSeries = chart.addCandlestickSeries({ upColor: '#00c853', downColor: '#ff1744', borderVisible: false });
      const volSeries = chart.addHistogramSeries({ priceScaleId: '' });
      chart.priceScale('').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      const toTime = (t) => {
        if (t == null) return null;
        const ts = typeof t === 'number' ? t : new Date(t).getTime();
        if (Number.isNaN(ts)) return null;
        return Math.floor(ts / 1000);
      };
      const data = (timeSeries || [])
        .filter((d) => d != null && typeof d.close === 'number')
        .map((d) => {
          const t = toTime(d.time);
          return t == null ? null : { time: t, open: Number(d.open), high: Number(d.high), low: Number(d.low), close: Number(d.close) };
        })
        .filter(Boolean);
      const volData = (timeSeries || [])
        .filter((d) => d != null)
        .map((d) => {
          const t = toTime(d.time);
          return t == null ? null : {
            time: t,
            value: Number(d.volume) || 0,
            color: (d.close >= d.open) ? 'rgba(0,200,83,0.5)' : 'rgba(255,23,68,0.5)',
          };
        })
        .filter(Boolean);
      if (data.length) candleSeries.setData(data);
      if (volData.length) volSeries.setData(volData);
      if (stockQuote?.close && data.length) {
        const last = data[data.length - 1];
        candleSeries.update({ ...last, close: stockQuote.close });
      }
      chart.timeScale().fitContent();
      chartInstance.current = chart;
    } catch (err) {
      console.warn('StockChart init error:', err);
      if (chart) try { chart.remove(); } catch (_) {}
      return;
    }
    const onResize = () => {
      if (chartInstance.current && chartRef.current?.clientWidth) {
        chartInstance.current.applyOptions({ width: Math.max(chartRef.current.clientWidth, 100) });
      }
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (chartInstance.current) { chartInstance.current.remove(); chartInstance.current = null; }
    };
  }, [symbol, timeSeries, stockQuote?.close, timeframe, isIntraday]);

  if (!symbol) return null;
  if (loading && !timeSeries?.length) return <SkeletonChart />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-medium text-kite-muted">{subtitle}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {CHART_TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => handleRangeClick(tf.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeframe === tf.value
                  ? 'bg-kite-blue text-white'
                  : 'bg-kite-border/30 text-kite-muted hover:text-kite-text'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartRef} style={{ height: 360 }} />
    </motion.div>
  );
}
