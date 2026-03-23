import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';
import { portfolioAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/constants';

export default function OrderForm({ symbol, currentPrice, name }) {
  const { user, updateBalance } = useAuth();
  const [type, setType] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const totalCost = currentPrice * quantity;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symbol || !currentPrice || quantity < 1) return;
    setShowConfirm(true);
  };

  const confirmOrder = async () => {
    setPlacing(true);
    try {
      const { data } = await portfolioAPI.placeOrder({
        symbol,
        type,
        quantity: parseInt(quantity),
      });
      toast.success(data.message, {
        style: { background: '#16213e', color: '#e0e0e0', border: '1px solid #233554' },
      });
      updateBalance(data.balance);
      setShowConfirm(false);
      setQuantity(1);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Order failed', {
        style: { background: '#16213e', color: '#e0e0e0', border: '1px solid #233554' },
      });
    } finally {
      setPlacing(false);
    }
  };

  if (!symbol || !currentPrice) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-kite-blue" />
        Place Order
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Buy / Sell Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-kite-border/50">
          <button
            type="button"
            onClick={() => setType('BUY')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              type === 'BUY'
                ? 'bg-kite-green/20 text-kite-green border-r border-kite-border/50'
                : 'text-kite-muted hover:bg-kite-border/20'
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setType('SELL')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              type === 'SELL'
                ? 'bg-kite-red/20 text-kite-red'
                : 'text-kite-muted hover:bg-kite-border/20'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Quantity */}
        <div>
          <label className="text-xs text-kite-muted mb-1 block">Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 rounded-lg border border-kite-border/50 text-sm font-mono"
          />
        </div>

        {/* Price */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-kite-muted">Price</span>
          <span className="font-mono">{formatCurrency(currentPrice)}</span>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between text-sm font-semibold border-t border-kite-border/30 pt-2">
          <span>Total</span>
          <span className="font-mono text-kite-blue">{formatCurrency(totalCost)}</span>
        </div>

        {/* Balance check */}
        {type === 'BUY' && totalCost > (user?.balance || 0) && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-kite-red/10 text-xs text-kite-red">
            <AlertTriangle className="w-3.5 h-3.5" />
            Insufficient balance ({formatCurrency(user?.balance)})
          </div>
        )}

        <button
          type="submit"
          disabled={!quantity || (type === 'BUY' && totalCost > (user?.balance || 0))}
          className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
            type === 'BUY' ? 'btn-buy' : 'btn-sell'
          }`}
        >
          {type} {symbol}
        </button>
      </form>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 max-w-sm w-full"
            >
              <h3 className="font-bold text-lg mb-4">Confirm Order</h3>
              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between">
                  <span className="text-kite-muted">Type</span>
                  <span className={type === 'BUY' ? 'text-kite-green' : 'text-kite-red'}>
                    {type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-kite-muted">Stock</span>
                  <span>{symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-kite-muted">Quantity</span>
                  <span className="font-mono">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-kite-muted">Price</span>
                  <span className="font-mono">{formatCurrency(currentPrice)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-kite-border/30 pt-2">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(totalCost)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 rounded-lg border border-kite-border/50 text-sm hover:bg-kite-border/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOrder}
                  disabled={placing}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    type === 'BUY' ? 'btn-buy' : 'btn-sell'
                  }`}
                >
                  {placing ? 'Processing...' : `Confirm ${type}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
