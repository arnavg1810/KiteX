import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#16213e', color: '#e0e0e0', border: '1px solid #233554' } };

const logoGradient = 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!', toastStyle);
      } else {
        if (!form.name?.trim()) {
          toast.error('Name is required', toastStyle);
          setLoading(false);
          return;
        }
        await register(form.name, form.email, form.password);
        toast.success('Account created!', toastStyle);
      }
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong', toastStyle);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success('Welcome to KiteX!', toastStyle);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed', toastStyle);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in failed', toastStyle);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(180deg, #0f0d18 0%, #15122a 50%, #0d0b14 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px]"
      >
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg"
            style={{ background: logoGradient }}
          >
            <TrendingUp className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1
            className="text-3xl font-display font-bold tracking-tight bg-clip-text text-transparent mb-1"
            style={{ backgroundImage: logoGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            KiteX
          </h1>
          <p className="text-sm text-kite-muted">Professional Trading Terminal</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 border shadow-xl"
          style={{ background: 'rgba(26, 25, 46, 0.85)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                tab === 'login'
                  ? 'bg-[#2563eb] text-white shadow'
                  : 'text-kite-muted hover:text-kite-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                tab === 'register'
                  ? 'bg-[#2563eb] text-white shadow'
                  : 'text-kite-muted hover:text-kite-text'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kite-muted" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-kite-surface border border-kite-border/50 text-sm text-kite-text placeholder:text-kite-muted focus:border-[#2563eb] outline-none"
                  required={tab === 'register'}
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kite-muted" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-kite-surface border border-kite-border/50 text-sm text-kite-text placeholder:text-kite-muted focus:border-[#2563eb] outline-none"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kite-muted" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Password"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-kite-surface border border-kite-border/50 text-sm text-kite-text placeholder:text-kite-muted focus:border-[#2563eb] outline-none"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create account'}
              {!loading && tab === 'login' && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
            <span className="text-xs text-kite-muted">OR</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              width="280"
              text={tab === 'login' ? 'signin_with' : 'signup_with'}
              useOneTap={false}
            />
          </div>
        </div>

        <p className="text-center text-xs text-kite-muted mt-6">
          Paper trading with ₹10,00,000 virtual balance
        </p>
      </motion.div>
    </div>
  );
}
