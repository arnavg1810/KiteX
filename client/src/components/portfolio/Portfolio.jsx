import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, TrendingUp, TrendingDown, RefreshCw, History,
  PieChart, DollarSign, ArrowUpCircle, ArrowDownCircle, ShoppingCart, Trash2,
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { portfolioAPI } from '../../services/api';
import { formatCurrency, formatPercent, SECTORS } from '../../utils/constants';
import { SkeletonCard, SkeletonTable } from '../common/SkeletonLoader';
import OrderModal from './OrderModal';

const CHART_COLORS = [
  '#2979ff', '#00c853', '#ff1744', '#ffd600', '#e94560',
  '#7c4dff', '#00bcd4', '#ff6d00', '#76ff03', '#e040fb',
];

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('holdings');
  const [orderModal, setOrderModal] = useState({ open: false, symbol: null, name: null, currentPrice: null, type: 'BUY' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [portfolioRes, ordersRes] = await Promise.all([
        portfolioAPI.get(),
        portfolioAPI.getOrders(),
      ]);
      setPortfolio(portfolioRes.data);
      setOrders(ordersRes.data.orders || []);
    } catch (error) {
      console.error('Portfolio error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const pieData = portfolio?.holdings?.map((h) => ({
    name: h.symbol,
    value: h.currentValue,
  })) || [];

  const sectorData = useMemo(() => {
    if (!portfolio?.holdings?.length || !SECTORS) return [];
    const totals = {};
    for (const [sector, symbols] of Object.entries(SECTORS)) {
      totals[sector] = 0;
      for (const h of portfolio.holdings) {
        if (symbols.includes(h.symbol)) totals[sector] += h.currentValue || 0;
      }
    }
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio?.holdings]);

  const gainLossData = useMemo(() => {
    if (!portfolio?.holdings?.length) return [];
    let gain = 0, loss = 0;
    for (const h of portfolio.holdings) {
      if ((h.pnl || 0) >= 0) gain += h.pnl || 0;
      else loss += Math.abs(h.pnl || 0);
    }
    return [
      { name: 'Gain', value: gain, fill: '#00c853' },
      { name: 'Loss', value: loss, fill: '#ff1744' },
    ].filter((d) => d.value > 0);
  }, [portfolio?.holdings]);

  const metrics = useMemo(() => {
    const s = portfolio?.summary;
    if (!s) return null;
    const totalInvested = s.totalInvested || 0;
    const totalCurrent = s.totalCurrent || 0;
    const absReturn = s.totalPnL ?? 0;
    const pctReturn = s.totalPnLPercent ?? 0;
    const volatility = portfolio?.holdings?.length
      ? Math.sqrt(
          (portfolio.holdings.reduce((acc, h) => acc + Math.pow((h.pnlPercent || 0) - pctReturn, 2), 0) / portfolio.holdings.length)
        ) || 0
      : 0;
    const sharpe = volatility !== 0 ? (pctReturn / volatility) : 0;
    return {
      totalInvested,
      totalCurrent,
      absReturn,
      pctReturn,
      volatility: Math.round(volatility * 100) / 100,
      sharpe: Math.round(sharpe * 100) / 100,
    };
  }, [portfolio]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-kite-blue" />
          <h1 className="text-2xl font-display font-bold tracking-tight">Portfolio</h1>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg hover:bg-kite-border/30 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-kite-muted ${loading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {loading && !portfolio ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
          </div>
          <SkeletonTable rows={5} />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {portfolio?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <SummaryCard
                icon={DollarSign}
                label="Invested"
                value={formatCurrency(portfolio.summary.totalInvested)}
                color="text-kite-blue"
              />
              <SummaryCard
                icon={PieChart}
                label="Current Value"
                value={formatCurrency(portfolio.summary.totalCurrent)}
                color="text-purple-400"
              />
              <SummaryCard
                icon={portfolio.summary.totalPnL >= 0 ? ArrowUpCircle : ArrowDownCircle}
                label="Total P&L"
                value={`${formatCurrency(portfolio.summary.totalPnL)} (${formatPercent(portfolio.summary.totalPnLPercent)})`}
                color={portfolio.summary.totalPnL >= 0 ? 'text-kite-green' : 'text-kite-red'}
                highlight
              />
              <SummaryCard
                icon={portfolio.summary.dayPnL >= 0 ? TrendingUp : TrendingDown}
                label="Day P&L"
                value={formatCurrency(portfolio.summary.dayPnL)}
                color={portfolio.summary.dayPnL >= 0 ? 'text-kite-green' : 'text-kite-red'}
              />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            {[
              { id: 'holdings', label: 'Holdings', icon: Briefcase },
              { id: 'orders', label: 'Order History', icon: History },
              { id: 'allocation', label: 'Allocation', icon: PieChart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-kite-blue/15 text-kite-blue'
                    : 'text-kite-muted hover:bg-kite-border/30'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Holdings Tab */}
          {activeTab === 'holdings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
              {!portfolio?.holdings?.length ? (
                <div className="text-center py-16">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-kite-muted/30" />
                  <h3 className="font-medium text-lg mb-1">No holdings yet</h3>
                  <p className="text-sm text-kite-muted mb-4">Start trading to build your portfolio</p>
                  <button onClick={() => navigate('/stocks')} className="btn-primary text-sm">
                    Explore Stocks
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-kite-muted bg-kite-bg/50">
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4 text-right">Qty</th>
                        <th className="py-3 px-4 text-right">Avg Price</th>
                        <th className="py-3 px-4 text-right">LTP</th>
                        <th className="py-3 px-4 text-right">Invested</th>
                        <th className="py-3 px-4 text-right">Current</th>
                        <th className="py-3 px-4 text-right">P&L</th>
                        <th className="py-3 px-4 text-right hidden md:table-cell">Day Change</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.holdings.map((h, i) => (
                        <motion.tr
                          key={h.symbol}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-t border-kite-border/20 hover:bg-kite-blue/5 cursor-pointer transition-colors"
                          onClick={() => navigate(`/stocks?symbol=${h.symbol}`)}
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium">{h.symbol}</div>
                            <div className="text-xs text-kite-muted truncate max-w-[120px]">{h.name}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono">{h.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono">{formatCurrency(h.avgPrice)}</td>
                          <td className="py-3 px-4 text-right font-mono">{formatCurrency(h.currentPrice)}</td>
                          <td className="py-3 px-4 text-right font-mono text-kite-muted">
                            {formatCurrency(h.investedValue)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {formatCurrency(h.currentValue)}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono ${h.pnl >= 0 ? 'price-up' : 'price-down'}`}>
                            <div>{formatCurrency(h.pnl)}</div>
                            <div className="text-xs">{formatPercent(h.pnlPercent)}</div>
                          </td>
                          <td className={`py-3 px-4 text-right font-mono hidden md:table-cell ${
                            (h.dayChangePercent || 0) >= 0 ? 'price-up' : 'price-down'
                          }`}>
                            {formatPercent(h.dayChangePercent)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setOrderModal({ open: true, symbol: h.symbol, name: h.name, currentPrice: h.currentPrice, type: 'BUY' }); }}
                                className="px-2 py-1 rounded text-xs font-semibold bg-kite-green/20 text-kite-green hover:bg-kite-green/30 transition-colors"
                              >
                                BUY
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setOrderModal({ open: true, symbol: h.symbol, name: h.name, currentPrice: h.currentPrice, type: 'SELL' }); }}
                                className="px-2 py-1 rounded text-xs font-semibold bg-kite-red/20 text-kite-red hover:bg-kite-red/30 transition-colors"
                              >
                                SELL
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Order History Tab */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
              {!orders.length ? (
                <div className="text-center py-16 text-kite-muted">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-kite-muted bg-kite-bg/50">
                        <th className="py-3 px-4">Time</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4 text-right">Qty</th>
                        <th className="py-3 px-4 text-right">Exec. Price</th>
                        <th className="py-3 px-4 text-right">Value</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, i) => (
                        <motion.tr
                          key={order._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-t border-kite-border/20"
                        >
                          <td className="py-3 px-4 text-xs text-kite-muted">
                            {new Date(order.createdAt).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 font-medium">{order.symbol}</td>
                          <td className={`py-3 px-4 font-semibold ${
                            order.type === 'BUY' ? 'text-kite-green' : 'text-kite-red'
                          }`}>
                            {order.type}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">{order.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono">{formatCurrency(order.executedPrice ?? order.price)}</td>
                          <td className="py-3 px-4 text-right font-mono">
                            {formatCurrency((order.executedPrice ?? order.price) * order.quantity)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              order.status === 'EXECUTED'
                                ? 'bg-kite-green/15 text-kite-green'
                                : 'bg-kite-yellow/15 text-kite-yellow'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Allocation Tab */}
          {activeTab === 'allocation' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="glass-card p-3">
                    <div className="text-xs text-kite-muted">Invested</div>
                    <div className="text-sm font-mono font-semibold">{formatCurrency(metrics.totalInvested)}</div>
                  </div>
                  <div className="glass-card p-3">
                    <div className="text-xs text-kite-muted">Current</div>
                    <div className="text-sm font-mono font-semibold">{formatCurrency(metrics.totalCurrent)}</div>
                  </div>
                  <div className="glass-card p-3">
                    <div className="text-xs text-kite-muted">Abs Return</div>
                    <div className={`text-sm font-mono font-semibold ${metrics.absReturn >= 0 ? 'text-kite-green' : 'text-kite-red'}`}>{formatCurrency(metrics.absReturn)}</div>
                  </div>
                  <div className="glass-card p-3">
                    <div className="text-xs text-kite-muted">% Return</div>
                    <div className={`text-sm font-mono font-semibold ${metrics.pctReturn >= 0 ? 'text-kite-green' : 'text-kite-red'}`}>{formatPercent(metrics.pctReturn)}</div>
                  </div>
                  <div className="glass-card p-3">
                    <div className="text-xs text-kite-muted">Sharpe</div>
                    <div className="text-sm font-mono font-semibold">{metrics.sharpe}</div>
                  </div>
                  <div className="glass-card p-3">
                    <div className="text-xs text-kite-muted">Volatility</div>
                    <div className="text-sm font-mono font-semibold">{metrics.volatility}%</div>
                  </div>
                </div>
              )}
              {pieData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="glass-card p-6">
                    <h3 className="text-sm font-medium text-kite-muted mb-4">Stock-wise Allocation</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPie>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="value">
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#16213e', border: '1px solid #233554', borderRadius: '8px', color: '#e0e0e0' }} formatter={(value) => formatCurrency(value)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  {sectorData.length > 0 && (
                    <div className="glass-card p-6">
                      <h3 className="text-sm font-medium text-kite-muted mb-4">Sector-wise</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <RechartsPie>
                          <Pie data={sectorData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="value">
                            {sectorData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#16213e', border: '1px solid #233554', borderRadius: '8px' }} formatter={(value) => formatCurrency(value)} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {gainLossData.length > 0 && (
                    <div className="glass-card p-6">
                      <h3 className="text-sm font-medium text-kite-muted mb-4">Gain / Loss</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <RechartsPie>
                          <Pie data={gainLossData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="value">
                            {gainLossData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#16213e', border: '1px solid #233554', borderRadius: '8px' }} formatter={(value) => formatCurrency(value)} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : null}
              {pieData.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-sm font-medium text-kite-muted mb-4">Breakdown</h3>
                  <div className="space-y-3">
                    {pieData.map((item, i) => {
                      const total = pieData.reduce((s, p) => s + p.value, 0);
                      const pct = total ? ((item.value / total) * 100).toFixed(1) : '0';
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-sm font-medium flex-1">{item.name}</span>
                          <span className="text-sm font-mono text-kite-muted">{formatCurrency(item.value)}</span>
                          <span className="text-xs font-mono text-kite-muted w-12 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {pieData.length === 0 && (
                <div className="glass-card p-12 text-center text-kite-muted">
                  <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Add holdings to see allocation</p>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}

      <OrderModal
        open={orderModal.open}
        onClose={() => setOrderModal((p) => ({ ...p, open: false }))}
        symbol={orderModal.symbol}
        name={orderModal.name}
        currentPrice={orderModal.currentPrice}
        defaultType={orderModal.type}
        onSuccess={fetchData}
      />
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, highlight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 ${highlight ? (color.includes('green') ? 'glow-green' : 'glow-red') : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-kite-muted">{label}</span>
      </div>
      <div className={`text-lg font-bold font-mono ${highlight ? color : ''}`}>{value}</div>
    </motion.div>
  );
}
