# KiteX Trading Terminal — System Architecture

## Overview

KiteX is a full-stack, real-time stock trading terminal clone with WebSocket-driven live data, F&O analytics, multiple watchlists, portfolio management, and event/announcement tracking.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React + Vite)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │ AuthContext │  │ StockContext │  │ WebSocketCtx │  │ Toaster      │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │
│         │                │                 │                            │
│  ┌──────▼────────────────▼────────────────▼──────────────────────────┐│
│  │  Pages: Dashboard | Stocks | Watchlist(s) | Portfolio               ││
│  │  Lazy-loaded components, memoized lists, virtualized watchlists     ││
│  └────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    REST (axios)    │    WebSocket (Socket.IO)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVER (Node.js + Express)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │ Auth        │  │ Stocks       │  │ F&O / Events│  │ Portfolio    │  │
│  │ Watchlist   │  │ News         │  │ Orders      │  │ WebSocket    │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                │                 │                 │          │
│  ┌──────▼────────────────▼────────────────▼────────────────▼──────────┐│
│  │  MongoDB (User, Portfolio, Order, Watchlist, StockMetadata)          ││
│  └──────────────────────────────────────────────────────────────────────┘│
│  External: Twelve Data API (quotes/time series), News API (optional)     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

- **Frontend**: React 18, Vite 5, React Router 6, Tailwind CSS, Framer Motion, lightweight-charts, Recharts, Socket.IO client.
- **Backend**: Express 4, Mongoose, Socket.IO server, Twelve Data (or simulated) for quotes.
- **Database**: MongoDB for users, portfolios, orders, watchlists, and optional F&O/events cache.
- **Real-time**: Socket.IO with throttled per-symbol and watchlist subscriptions; live status indicator (Live/Disconnected).

## Data Flow

1. **Auth**: JWT in `Authorization` header; token stored in `localStorage` as `kite_token`.
2. **Quotes**: REST `GET /api/stocks/quote/:symbol` for on-demand; WebSocket `subscribe:stock` / `subscribe:watchlist` for live stream (throttled).
3. **Portfolio**: REST `GET /api/portfolio` returns holdings + summary; WebSocket can push P&L updates when portfolio symbols are subscribed.
4. **Orders**: `POST /api/portfolio/order` places BUY/SELL (Market/Limit); response includes order + updated balance; order history via `GET /api/portfolio/orders`.
5. **Watchlists**: Up to 5 lists per user; CRUD + reorder via REST; live prices via WebSocket for all list symbols.
6. **F&O / Events**: REST endpoints for F&O data and key events; optional server-side cache for rate limiting.

## Security

- CORS restricted to `CLIENT_URL`.
- Rate limiting on `/api/`.
- Helmet, compression, JWT validation on protected routes.
- Passwords hashed with bcrypt; no secrets in client.

## Scaling Notes

- WebSocket: one server instance per namespace; for multi-instance, use Socket.IO Redis adapter.
- REST: stateless; horizontal scaling behind a load balancer.
- DB: indexes on `user`, `user+createdAt` for orders and watchlists.
