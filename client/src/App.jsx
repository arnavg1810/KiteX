import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StockProvider } from './contexts/StockContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Layout from './components/layout/Layout';
import AuthPage from './components/auth/AuthPage';

const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const StockPage = lazy(() => import('./components/stock/StockPage'));
const EventsNewsPage = lazy(() => import('./components/events-news/EventsNewsPage'));
const WatchlistPage = lazy(() => import('./components/watchlist/Watchlist'));
const PortfolioPage = lazy(() => import('./components/portfolio/Portfolio'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-kite-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-kite-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-kite-muted text-sm">Loading KiteX...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <WebSocketProvider>
      <StockProvider>
        <Layout>
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center min-h-[40vh]">
              <div className="w-8 h-8 border-2 border-kite-blue border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            {children}
          </Suspense>
        </Layout>
      </StockProvider>
    </WebSocketProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-kite-bg flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-kite-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route
        path="/"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/stocks"
        element={<ProtectedRoute><StockPage /></ProtectedRoute>}
      />
      <Route
        path="/events-news"
        element={<ProtectedRoute><EventsNewsPage /></ProtectedRoute>}
      />
      <Route
        path="/watchlist"
        element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>}
      />
      <Route
        path="/portfolio"
        element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!googleClientId) {
    console.warn('Warning: VITE_GOOGLE_CLIENT_ID is not configured. Google Sign-in will not work.');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || 'placeholder'}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#16213e',
                color: '#e0e0e0',
                border: '1px solid #233554',
                borderRadius: '12px',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
