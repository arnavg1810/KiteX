import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStock } from '../../contexts/StockContext';
import MarketOverview from './MarketOverview';
import TopMovers from './TopMovers';
import HeatMap from './HeatMap';
import NewsTicker from './NewsTicker';
import { SkeletonCard, SkeletonChart } from '../common/SkeletonLoader';

export default function Dashboard() {
  const { nifty50Data, loading, loadNifty50 } = useStock();

  useEffect(() => {
    loadNifty50();
    const interval = setInterval(loadNifty50, 30_000);
    return () => clearInterval(interval);
  }, [loadNifty50]);

  return (
    <div>
      <NewsTicker />
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">Market Dashboard</h1>
            <p className="text-sm text-kite-muted mt-1">
              Real-time Nifty 50 market overview
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-kite-muted">Last updated</div>
            <div className="text-sm font-mono">
              {new Date().toLocaleTimeString('en-IN')}
            </div>
          </div>
        </motion.div>

        {loading.nifty50 && !nifty50Data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SkeletonCard lines={4} />
              <SkeletonCard lines={4} className="md:col-span-2" />
            </div>
            <SkeletonChart />
          </div>
        ) : nifty50Data ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MarketOverview indexData={nifty50Data.index} />
              <div className="lg:col-span-2">
                <TopMovers gainers={nifty50Data.gainers} losers={nifty50Data.losers} />
              </div>
            </div>
            <HeatMap stocks={nifty50Data.stocks} />

            {/* Sector Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-4"
            >
              <h3 className="font-semibold text-sm mb-3">All Nifty 50 Stocks</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-kite-muted text-xs border-b border-kite-border/50">
                      <th className="pb-2 px-3">Symbol</th>
                      <th className="pb-2 px-3 hidden sm:table-cell">Name</th>
                      <th className="pb-2 px-3">Sector</th>
                      <th className="pb-2 px-3 text-right">Price</th>
                      <th className="pb-2 px-3 text-right">Change</th>
                      <th className="pb-2 px-3 text-right hidden md:table-cell">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nifty50Data.stocks.map((stock, i) => (
                      <motion.tr
                        key={stock.symbol}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.01 * i }}
                        className="border-b border-kite-border/20 hover:bg-kite-blue/5 cursor-pointer transition-colors"
                        onClick={() => window.location.href = `/stocks?symbol=${stock.symbol}`}
                      >
                        <td className="py-2.5 px-3 font-medium">{stock.symbol}</td>
                        <td className="py-2.5 px-3 text-kite-muted hidden sm:table-cell truncate max-w-[200px]">
                          {stock.name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-kite-border/30">
                            {stock.sector}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ₹{stock.quote?.close?.toFixed(2)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono ${
                          stock.quote?.changePercent >= 0 ? 'price-up' : 'price-down'
                        }`}>
                          {stock.quote?.changePercent > 0 ? '+' : ''}
                          {stock.quote?.changePercent?.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-right text-kite-muted font-mono hidden md:table-cell">
                          {(stock.quote?.volume || 0).toLocaleString('en-IN')}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-20 text-kite-muted">
            Failed to load market data. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
