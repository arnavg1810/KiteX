import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#16213e', color: '#e0e0e0', border: '1px solid #233554' } };

const logoGradient = 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)';

// Password strength calculator
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#ff1744' };
  if (score <= 2) return { score: 2, label: 'Fair', color: '#ff6d00' };
  if (score <= 3) return { score: 3, label: 'Medium', color: '#ffd600' };
  if (score <= 4) return { score: 4, label: 'Strong', color: '#00e676' };
  return { score: 5, label: 'Very Strong', color: '#00c853' };
}

// Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [serverError, setServerError] = useState('');

  // Validation
  const errors = useMemo(() => {
    const e = {};
    if (touched.name && tab === 'register' && !form.name.trim()) e.name = 'Name is required';
    if (touched.email && form.email && !isValidEmail(form.email)) e.email = 'Enter a valid email address';
    if (touched.email && !form.email) e.email = 'Email is required';
    if (touched.password && !form.password) e.password = 'Password is required';
    if (touched.password && form.password && form.password.length < 6) e.password = 'Must be at least 6 characters';
    return e;
  }, [form, touched, tab]);

  const isValid = useMemo(() => {
    const nameOk = tab === 'login' || form.name.trim().length > 0;
    const emailOk = isValidEmail(form.email);
    const passOk = form.password.length >= 6;
    return nameOk && emailOk && passOk;
  }, [form, tab]);

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleBlur = (field) => setTouched((p) => ({ ...p, [field]: true }));
  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!isValid) return;

    setLoading(true);
    setServerError('');
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!', toastStyle);
      } else {
        await register(form.name, form.email, form.password);
        toast.success('Account created!', toastStyle);
      }
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong';
      setServerError(msg);
      toast.error(msg, toastStyle);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setServerError('');
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success('Welcome to KiteX!', toastStyle);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.message || 'Google sign-in failed';
      setServerError(msg);
      toast.error(msg, toastStyle);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    const msg = 'Google sign-in unavailable. Please try again or use email/password.';
    setServerError(msg);
    toast.error(msg, toastStyle);
  };

  // Tab switch reset
  const switchTab = (newTab) => {
    setTab(newTab);
    setTouched({ name: false, email: false, password: false });
    setServerError('');
    setShowPassword(false);
  };

  // Input class builder
  const inputClass = (field) => {
    const base = 'auth-input w-full pl-10 pr-10 py-3 rounded-xl bg-[rgba(15,14,30,0.6)] border text-sm text-kite-text placeholder:text-kite-muted/60 outline-none transition-all duration-200';
    if (errors[field]) return `${base} border-red-500/70 auth-input-error`;
    if (touched[field] && form[field] && !errors[field]) return `${base} border-emerald-500/50 auth-input-valid`;
    return `${base} border-white/[0.08] hover:border-white/[0.15]`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'linear-gradient(180deg, #0f0d18 0%, #15122a 50%, #0d0b14 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px]"
      >
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <motion.div
            className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg"
            style={{ background: logoGradient }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <TrendingUp className="w-8 h-8 text-white" strokeWidth={2.5} />
          </motion.div>
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
          className="rounded-2xl p-6 sm:p-8 border shadow-xl"
          style={{ background: 'rgba(26, 25, 46, 0.85)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Tab Switcher */}
          <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: 'rgba(0,0,0,0.25)' }}>
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                tab === 'login'
                  ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                  : 'text-kite-muted hover:text-kite-text hover:bg-white/[0.03]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                tab === 'register'
                  ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                  : 'text-kite-muted hover:text-kite-text hover:bg-white/[0.03]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Server Error Banner */}
          <AnimatePresence>
            {serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Name Field */}
            <AnimatePresence>
              {tab === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="auth-label block text-xs font-medium text-kite-muted/80 mb-1.5 ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kite-muted/60" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      placeholder="Enter your full name"
                      className={inputClass('name')}
                      autoComplete="name"
                    />
                    {touched.name && form.name.trim() && !errors.name && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <AnimatePresence>
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs text-red-400 mt-1.5 ml-1 flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div>
              <label className="auth-label block text-xs font-medium text-kite-muted/80 mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kite-muted/60" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  className={inputClass('email')}
                  autoComplete="email"
                />
                {touched.email && form.email && isValidEmail(form.email) && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                )}
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-400 mt-1.5 ml-1 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password Field */}
            <div>
              <label className="auth-label block text-xs font-medium text-kite-muted/80 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kite-muted/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder={tab === 'register' ? 'Min 6 characters, mix it up!' : 'Enter your password'}
                  className={inputClass('password')}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-kite-muted/50 hover:text-kite-muted transition-colors p-0.5"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-400 mt-1.5 ml-1 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Password Strength Meter */}
              {tab === 'register' && form.password && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2.5 ml-1"
                >
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= passwordStrength.score
                            ? passwordStrength.color
                            : 'rgba(255,255,255,0.06)',
                        }}
                      />
                    ))}
                  </div>
                  <p
                    className="text-[11px] font-medium transition-colors duration-300"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Please wait...
                </>
              ) : tab === 'login' ? (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
            <span className="text-xs text-kite-muted/60 uppercase tracking-wider font-medium">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              width="320"
              text={tab === 'login' ? 'signin_with' : 'signup_with'}
              useOneTap={false}
              shape="pill"
              theme="filled_black"
            />
          </div>
        </div>

        <p className="text-center text-xs text-kite-muted/50 mt-6">
          Paper trading with ₹10,00,000 virtual balance
        </p>
      </motion.div>
    </div>
  );
}
