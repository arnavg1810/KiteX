import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, AlertTriangle } from 'lucide-react';
import { portfolioAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/constants';

export default function OrderModal({ open, onClose, symbol, name, currentPrice, defaultType = 'BUY', onSuccess }) {
  const { user, updateBalance } = useAuth();
  const [type, setType] = useState(defaultType);
  const [orderType, setOrderType] = useState('MARKET');
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [placing, setPlacing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const price = orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : currentPrice;
  const totalCost = (price || 0) * quantity;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symbol || !price || quantity < 1) return;
    setShowConfirm(true);
  };

  const confirmOrder = async () => {
    setPlacing(true);
    try {
      const payload = {
        symbol,
        type,
        quantity: parseInt(quantity, 10),
        orderType,
        price: orderType === 'MARKET' ? currentPrice : price,
      };
      const { data } = await portfolioAPI.placeOrder(payload);
      toast.success(data.message, {
        style: { background: '#16213e', color: '#e0e0e0', border: '1px solid #233554' },
      });
      updateBalance(data.balance);
      setShowConfirm(false);
      onClose();
      if (onSuccess) onSuccess();
      setQuantity(1);
      setLimitPrice('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Order failed', {
        style: { background: '#16213e', color: '#e0e0e0', border: '1px solid #233554' },
      });
    } finally {
      setPlacing(false);
    }
  };

  const reset = () => {
    setType(defaultType);
    setOrderType('MARKET');
    setQuantity(1);
    setLimitPrice('');
    setShowConfirm(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={() => { onClose(); reset(); }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card p-6 max-w-sm w-full relative"
        >
          <button
            type="button"
            onClick={() => { onClose(); reset(); }}
            className="absolute right-4 top-4 p-1 rounded hover:bg-kite-border/30 transition-colors"
          >
            <X className="w-4 h-4 text-kite-muted" />
          </button>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-kite-blue" />
            Quick Order — {symbol}
          </h3>

          {!showConfirm ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex rounded-lg overflow-hidden border border-kite-border/50">
                <button type="button" onClick={() => setType('BUY')} className={`flex-1 py-2 text-sm font-semibold ${type === 'BUY' ? 'bg-kite-green/20 text-kite-green' : 'text-kite-muted hover:bg-kite-border/20'}`}>
                  BUY
                </button>
                <button type="button" onClick={() => setType('SELL')} className={`flex-1 py-2 text-sm font-semibold ${type === 'SELL' ? 'bg-kite-red/20 text-kite-red' : 'text-kite-muted hover:bg-kite-border/20'}`}>
                  SELL
                </button>
              </div>
              <div>
                <label className="text-xs text-kite-muted block mb-1">Order type</label>
                <div className="flex gap-2">
                  {['MARKET', 'LIMIT'].map((ot) => (
                    <button key={ot} type="button" onClick={() => setOrderType(ot)} className={`px-3 py-1.5 rounded text-xs font-medium ${orderType === ot ? 'bg-kite-blue text-white' : 'bg-kite-border/30 text-kite-muted hover:bg-kite-border/50'}`}>
                      {ot}
                    </button>
                  ))}
                </div>
              </div>
              {orderType === 'LIMIT' && (
                <div>
                  <label className="text-xs text-kite-muted block mb-1">Limit price</label>
                  <input type="number" step="0.01" min="0" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder={formatCurrency(currentPrice)} className="w-full px-3 py-2 rounded-lg border border-kite-border/50 bg-kite-surface text-kite-text text-sm font-mono focus:outline-none focus:border-kite-blue/50 placeholder:text-kite-muted" />
                </div>
              )}
              <div>
                <label className="text-xs text-kite-muted block mb-1">Quantity</label>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-full px-3 py-2 rounded-lg border border-kite-border/50 bg-kite-surface text-kite-text text-sm font-mono focus:outline-none focus:border-kite-blue/50" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-kite-muted">Price</span>
                <span className="font-mono">{formatCurrency(orderType === 'MARKET' ? currentPrice : (limitPrice ? parseFloat(limitPrice) : currentPrice))}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-kite-border/30 pt-2">
                <span>Total</span>
                <span className="font-mono text-kite-blue">{formatCurrency(totalCost)}</span>
              </div>
              {type === 'BUY' && totalCost > (user?.balance || 0) && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-kite-red/10 text-xs text-kite-red">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Insufficient balance ({formatCurrency(user?.balance)})
                </div>
              )}
              <button type="submit" disabled={!quantity || (type === 'BUY' && totalCost > (user?.balance || 0)) || (orderType === 'LIMIT' && !limitPrice)} className={`w-full py-2.5 rounded-lg font-semibold text-sm ${type === 'BUY' ? 'btn-buy' : 'btn-sell'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                {type} {symbol}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Confirm order</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-kite-muted">Type</span><span className={type === 'BUY' ? 'text-kite-green' : 'text-kite-red'}>{type}</span></div>
                <div className="flex justify-between"><span className="text-kite-muted">Stock</span><span>{symbol}</span></div>
                <div className="flex justify-between"><span className="text-kite-muted">Order</span><span>{orderType}</span></div>
                <div className="flex justify-between"><span className="text-kite-muted">Qty</span><span className="font-mono">{quantity}</span></div>
                <div className="flex justify-between"><span className="text-kite-muted">Price</span><span className="font-mono">{formatCurrency(price)}</span></div>
                <div className="flex justify-between font-semibold border-t border-kite-border/30 pt-2"><span>Total</span><span className="font-mono">{formatCurrency(totalCost)}</span></div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowConfirm(false)} className="flex-1 py-2 rounded-lg border border-kite-border/50 text-sm hover:bg-kite-border/20">Back</button>
                <button type="button" onClick={confirmOrder} disabled={placing} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${type === 'BUY' ? 'btn-buy' : 'btn-sell'}`}>
                  {placing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
