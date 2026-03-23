import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Search, Bookmark, Briefcase, TrendingUp,
  Bell, LogOut, User, Wifi, WifiOff, Menu, X,   Newspaper,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { formatCurrency } from '../../utils/constants';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/stocks', label: 'Stocks', icon: TrendingUp },
  { path: '/events-news', label: 'Key events and news', icon: Newspaper },
  { path: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useWebSocket();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-kite-surface/90 backdrop-blur-xl border-b border-kite-border/50 shadow-[0_1px_0_0_rgba(255,255,255,0.03)]">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-kite-blue to-kite-accent flex items-center justify-center shadow-glow-blue"
            >
              <TrendingUp className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-display font-bold tracking-tight bg-gradient-to-r from-kite-blue to-kite-accent bg-clip-text text-transparent">
              KiteX
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                    active ? 'text-kite-blue' : 'text-kite-muted hover:text-kite-text hover:bg-kite-border/20'
                  }`}
                >
                  <item.icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-kite-blue/10 rounded-xl border border-kite-blue/25"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${
              connected ? 'border-kite-green/30 bg-kite-green/5' : 'border-kite-red/30 bg-kite-red/5'
            }`}>
              {connected ? (
                <>
                  <span className="text-[10px]" title="Live">🟢</span>
                  <motion.span
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Wifi className="w-3.5 h-3.5 text-kite-green" />
                  </motion.span>
                  <span className="text-xs font-medium text-kite-green">Live</span>
                </>
              ) : (
                <>
                  <span className="text-[10px]" title="Disconnected">🔴</span>
                  <WifiOff className="w-3.5 h-3.5 text-kite-red" />
                  <span className="text-xs font-medium text-kite-red">Disconnected</span>
                </>
              )}
            </div>

            {/* Balance */}
            {user && (
              <div className="hidden sm:block text-right">
                <div className="text-xs text-kite-muted">Balance</div>
                <div className="text-sm font-semibold font-mono">{formatCurrency(user.balance)}</div>
              </div>
            )}

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-kite-border/30 transition-colors">
              <Bell className="w-4 h-4 text-kite-muted" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-kite-accent rounded-full" />
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-kite-border/30 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-kite-blue to-purple-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 glass-card p-3 shadow-2xl"
                  >
                    <div className="mb-3 pb-3 border-b border-kite-border">
                      <p className="font-medium text-sm">{user?.name}</p>
                      <p className="text-xs text-kite-muted">{user?.email}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kite-red hover:bg-kite-red/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-kite-border/30"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="md:hidden overflow-hidden border-t border-kite-border"
          >
            <div className="p-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                    location.pathname === item.path
                      ? 'bg-kite-blue/10 text-kite-blue'
                      : 'text-kite-muted hover:text-kite-text'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
