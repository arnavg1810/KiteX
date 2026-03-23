# KiteX — Professional Trading Terminal

A production-level, interactive stock trading web platform for Nifty 50 stocks, combining Zerodha Kite's trading capabilities with Bloomberg-style news analytics and AI-powered sentiment analysis.

## Features

### Core Trading
- **Real-time Stock Data** — Live prices, OHLC, volume for all Nifty 50 stocks
- **Interactive Candlestick Charts** — Multi-interval (1m, 5m, 15m, 30m, 1h, 1D) via Lightweight Charts
- **Paper Trading** — Buy/sell simulation with ₹10,00,000 virtual balance
- **Portfolio Management** — Real-time P&L, allocation charts, order history
- **Watchlist** — Live price updates with add/remove functionality

### News & Sentiment Intelligence
- **Multi-Source News** — Aggregated from Finnhub, NewsAPI with deduplication
- **Flexible Duration Filters** — 1 Day, 1 Week, 1 Month, Custom date range
- **NLP Sentiment Analysis** — Positive / Negative / Neutral classification with confidence scores
- **Financial Lexicon** — Extended dictionary tuned for market terminology
- **Sentiment Gauge** — Visual meter showing overall market sentiment
- **AI Trading Signals** — Buy/Sell/Hold recommendations based on news sentiment
- **Word Cloud** — Frequent term visualization from news corpus
- **Auto-refresh** — News updates every 3 minutes

### Dashboard
- **Market Overview** — Nifty 50 index summary with advancers/decliners
- **Heat Map** — Color-coded grid of all 50 stocks by performance
- **Top Gainers/Losers** — Ranked by percentage change
- **Live News Ticker** — Scrolling headlines across the top

### UI/UX
- **Dark Theme** — Professional trading terminal aesthetic
- **Responsive Design** — Mobile, tablet, and desktop layouts
- **Smooth Animations** — Framer Motion transitions and micro-interactions
- **Skeleton Loaders** — Content loading states
- **Glass Morphism** — Modern card design with backdrop blur
- **Real-time WebSocket** — Live price streaming via Socket.IO

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Charts | Lightweight Charts (TradingView), Recharts |
| State | React Context + WebSocket |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (bcrypt hashing) |
| Real-time | Socket.IO |
| News APIs | Finnhub, NewsAPI |
| Stock APIs | TwelveData |
| Sentiment | sentiment (NLP) with financial lexicon |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React)                       │
│  ┌──────────┬──────────┬──────────┬──────────┐          │
│  │Dashboard │  Stocks  │Watchlist │Portfolio │          │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┘          │
│       │          │          │          │                  │
│  ┌────┴──────────┴──────────┴──────────┴─────┐          │
│  │        Context Providers + Hooks           │          │
│  │   (Auth, Stock, WebSocket)                 │          │
│  └──────────────────┬────────────────────────┘          │
│                     │ HTTP + WebSocket                    │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────┐
│               Server (Express.js)                        │
│  ┌──────────────────┴───────────────────────┐           │
│  │            API Routes                     │           │
│  │  /auth  /stocks  /news  /portfolio  /ws   │           │
│  └──────┬───────────┬───────────┬────────────┘           │
│         │           │           │                         │
│  ┌──────┴──┐  ┌─────┴────┐  ┌──┴─────────┐             │
│  │  Stock  │  │   News   │  │ Sentiment  │             │
│  │ Service │  │  Service │  │  Service   │             │
│  └────┬────┘  └────┬─────┘  └────────────┘             │
│       │            │                                     │
│  ┌────┴────┐  ┌────┴─────────┐                          │
│  │TwelveData│  │Finnhub/NewsAPI│                          │
│  └─────────┘  └──────────────┘                          │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │           MongoDB (Mongoose)              │           │
│  │  Users | Portfolios | Watchlists | Orders │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### User
```
{
  name: String,
  email: String (unique),
  password: String (hashed),
  balance: Number (default: 1,000,000),
  preferences: { theme, notifications, defaultChart }
}
```

### Portfolio
```
{
  user: ObjectId → User,
  holdings: [{
    symbol: String,
    name: String,
    quantity: Number,
    avgPrice: Number,
    investedValue: Number
  }]
}
```

### Watchlist
```
{
  user: ObjectId → User,
  name: String,
  stocks: [{ symbol, name, addedAt }]
}
```

### Order
```
{
  user: ObjectId → User,
  symbol: String,
  type: BUY | SELL,
  orderType: MARKET | LIMIT | SL | SL-M,
  quantity: Number,
  price: Number,
  status: PENDING | EXECUTED | CANCELLED
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/stocks/search?q=` | Search Nifty 50 stocks |
| GET | `/api/stocks/quote/:symbol` | Get real-time quote |
| GET | `/api/stocks/timeseries/:symbol` | Get OHLC time series |
| GET | `/api/stocks/nifty50` | Get all Nifty 50 with stats |
| GET | `/api/news/company/:symbol` | Get news + sentiment for stock |
| GET | `/api/news/market` | Get general market news |
| GET | `/api/portfolio` | Get portfolio with live P&L |
| POST | `/api/portfolio/order` | Place buy/sell order |
| GET | `/api/portfolio/orders` | Get order history |
| GET | `/api/watchlist` | Get watchlist with live quotes |
| POST | `/api/watchlist/add` | Add stock to watchlist |
| DELETE | `/api/watchlist/remove/:symbol` | Remove from watchlist |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `subscribe:stock` | Client → Server | `symbol` |
| `unsubscribe:stock` | Client → Server | `symbol` |
| `stock:quote` | Server → Client | `{ symbol, quote }` |
| `market:update` | Server → All | Market summary |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- API keys: TwelveData, Finnhub, NewsAPI (optional — app works with simulated data)

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your API keys and MongoDB URI
```

### 3. Start Development

```bash
# Terminal 1 — Start backend
cd server
npm run dev

# Terminal 2 — Start frontend
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Create Account
Register with any email/password. You'll receive ₹10,00,000 virtual balance for paper trading.

---

## Folder Structure

```
├── server/
│   ├── src/
│   │   ├── config/          # DB connection, Nifty 50 data
│   │   ├── middleware/       # JWT auth middleware
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Express API routes
│   │   ├── services/         # Business logic (stocks, news, sentiment)
│   │   ├── websocket/        # Socket.IO real-time engine
│   │   └── index.js          # Server entry point
│   ├── .env.example
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/         # Login/Register
│   │   │   ├── common/       # Skeleton loaders, shared UI
│   │   │   ├── dashboard/    # Market overview, heat map, ticker
│   │   │   ├── layout/       # Navbar, Layout wrapper
│   │   │   ├── news/         # News panel, cards, sentiment, signals
│   │   │   ├── portfolio/    # Holdings, orders, allocation chart
│   │   │   ├── stock/        # Search, chart, details, order form
│   │   │   └── watchlist/    # Watchlist management
│   │   ├── contexts/         # React contexts (Auth, Stock, WebSocket)
│   │   ├── services/         # API client (axios)
│   │   ├── utils/            # Constants, formatters, helpers
│   │   ├── App.jsx           # Router + providers
│   │   ├── main.jsx          # React entry
│   │   └── index.css         # Tailwind + custom styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── ARCHITECTURE.md           # Detailed system architecture
└── README.md
```

---

## Deployment

### Docker (Recommended)

```bash
# Build
docker build -t kitex-server ./server
docker build -t kitex-client ./client

# Run
docker run -d -p 5000:5000 --env-file ./server/.env kitex-server
docker run -d -p 80:80 kitex-client
```

### Manual

```bash
# Build frontend
cd client && npm run build

# Serve with backend
# Copy client/dist to server/public
# Add static serving in Express

# Start production server
cd server && NODE_ENV=production npm start
```

### Environment Variables (Production)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `TWELVEDATA_API_KEY` | No | For live stock data |
| `FINNHUB_API_KEY` | No | For live news |
| `NEWSAPI_KEY` | No | For historical news |
| `CLIENT_URL` | Yes | Frontend URL for CORS |

---

## Scalability Considerations

1. **Caching** — In-memory cache (15s TTL for quotes, 2min for news) reduces API calls. Upgrade to Redis for multi-instance deployments.
2. **Rate Limiting** — Express rate limiter prevents API abuse. Configure per-route limits for production.
3. **WebSocket Scaling** — Use Redis adapter for Socket.IO to support multiple server instances.
4. **Database Indexing** — Compound indexes on user + timestamp for portfolio/order queries.
5. **API Key Rotation** — Support multiple API keys per provider with round-robin selection.
6. **CDN** — Serve static assets via CloudFront/Cloudflare for global latency reduction.
7. **Horizontal Scaling** — Stateless backend design supports load-balanced deployments.
8. **News Processing** — Move sentiment analysis to background workers (Bull/BullMQ) for heavy loads.

---

## Development Roadmap

| Phase | Features | Timeline |
|-------|----------|----------|
| ✅ Phase 1 | Auth, Dashboard, Stock Search, Charts | Week 1 |
| ✅ Phase 2 | News Panel, Sentiment Analysis, Signals | Week 2 |
| ✅ Phase 3 | Watchlist, Portfolio, Paper Trading | Week 3 |
| 🔲 Phase 4 | Backtesting Engine, Correlation Matrix | Week 4 |
| 🔲 Phase 5 | Alert System, Push Notifications | Week 5 |
| 🔲 Phase 6 | Mobile App (React Native) | Week 6-8 |

---

## License

MIT — For educational and demonstration purposes.
