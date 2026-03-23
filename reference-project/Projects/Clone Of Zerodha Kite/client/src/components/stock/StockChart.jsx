import { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { CHART_INTERVALS } from '../../utils/constants';
import { stockAPI } from '../../services/api';
import { SkeletonChart } from '../common/SkeletonLoader';

export default function StockChart({ symbol, timeSeries, loading }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [interval, setInterval_] = useState('5min');
  const [chartData, setChartData] = useState(timeSeries);
  const [loadingInterval, setLoadingInterval] = useState(false);

  useEffect(() => {
    setChartData(timeSeries);
  }, [timeSeries]);

  useEffect(() => {
    if (!chartContainerRef.current || !chartData?.length) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#8892b0',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(35, 53, 84, 0.3)' },
        horzLines: { color: 'rgba(35, 53, 84, 0.3)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(41, 121, 255, 0.4)', width: 1, style: 2 },
        horzLine: { color: 'rgba(41, 121, 255, 0.4)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(35, 53, 84, 0.5)',
      },
      timeScale: {
        borderColor: 'rgba(35, 53, 84, 0.5)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00c853',
      downColor: '#ff1744',
      borderUpColor: '#00c853',
      borderDownColor: '#ff1744',
      wickUpColor: '#00c853',
      wickDownColor: '#ff1744',
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const formattedCandles = chartData.map((d) => ({
      time: Math.floor(new Date(d.time).getTime() / 1000),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const formattedVolume = chartData.map((d) => ({
      time: Math.floor(new Date(d.time).getTime() / 1000),
      value: d.volume,
      color: d.close >= d.open ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 23, 68, 0.15)',
    }));

    candleSeries.setData(formattedCandles);
    volumeSeries.setData(formattedVolume);
    chart.timeScale().fitContent();

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [chartData]);

  const handleIntervalChange = async (newInterval) => {
    setInterval_(newInterval);
    setLoadingInterval(true);
    try {
      const { data } = await stockAPI.getTimeSeries(symbol, newInterval, 78);
      setChartData(data.data);
    } catch (error) {
      console.error('Error loading time series:', error);
    } finally {
      setLoadingInterval(false);
    }
  };

  if (loading) return <SkeletonChart className="h-[480px]" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Price Chart</h3>
        <div className="flex items-center gap-1">
          {CHART_INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => handleIntervalChange(iv.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                interval === iv.value
                  ? 'bg-kite-blue text-white'
                  : 'text-kite-muted hover:bg-kite-border/30'
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {loadingInterval && (
          <div className="absolute inset-0 flex items-center justify-center bg-kite-bg/50 z-10 rounded-lg">
            <div className="w-6 h-6 border-2 border-kite-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>
    </motion.div>
  );
}
