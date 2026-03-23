# KiteX — System Architecture Document

## 1. System Architecture Diagram

```
                        ┌─────────────────────┐
                        │    Load Balancer     │
                        │   (Nginx / ALB)      │
                        └──────────┬──────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
    ┌───────┴────────┐   ┌────────┴───────┐   ┌─────────┴───────┐
    │  Static Assets │   │   Express API  │   │  WebSocket (WS) │
    │  (Vite Build)  │   │   Port 5000    │   │  Socket.IO      │
    │  CDN / S3      │   │                │   │  Same Port      │
    └────────────────┘   └───────┬────────┘   └────────┬────────┘
                                 │                     │
                    ┌────────────┼─────────────────────┘
                    │            │
           ┌────────┴──────┐    │
           │  Service Layer │    │
           │               │    │
           │ ┌───────────┐ │    │
           │ │  Stock Svc │ │◄───── TwelveData API
           │ └───────────┘ │    │
           │ ┌───────────┐ │    │
           │ │  News Svc  │ │◄───── Finnhub + NewsAPI
           │ └───────────┘ │    │
           │ ┌───────────┐ │    │
           │ │Sentiment   │ │    │
           │ │  Engine    │ │    │
           │ └───────────┘ │    │
           └───────┬───────┘    │
                   │            │
           ┌───────┴───────┐    │
           │   MongoDB     │    │
           │               │    │
           │  ┌─────────┐  │    │
           │  │  Users   │  │    │
           │  ├─────────┤  │    │
           │  │Portfolio │  │    │
           │  ├─────────┤  │    │
           │  │Watchlist │  │    │
           │  ├─────────┤  │    │
           │  │ Orders   │  │    │
           │  └─────────┘  │    │
           └───────────────┘    │
                                │
           ┌────────────────────┴────────────┐
           │     In-Memory Cache (Map)       │
           │  ┌───────────┐ ┌─────────────┐  │
           │  │ Stock Quotes│ │  News Cache │  │
           │  │  TTL: 15s  │ │   TTL: 2m   │  │
           │  └───────────┘ └─────────────┘  │
           └─────────────────────────────────┘
```

## 2. Data Flow

### Stock Quote Flow
```
User selects stock → StockContext.selectStock()
  → HTTP GET /api/stocks/quote/:symbol
  → stockService.getQuote()
    → Check cache (15s TTL)
    → If miss: TwelveData API call
    → If API fails: Generate simulated quote
  → Return to client
  → WebSocket subscribe for live updates
  → Server pushes quotes every 5 seconds
```

### News & Sentiment Flow
```
Stock selected → NewsPanel loads
  → HTTP GET /api/news/company/:symbol?from=&to=
  → newsService.getCompanyNews()
    → Parallel fetch: Finnhub + NewsAPI
    → Deduplicate by title similarity
    → Sort by publish date
  → sentimentService.analyzeArticles()
    → NLP analysis with financial lexicon
    → Compute per-article sentiment
    → Aggregate overview (counts, ratios, avg score)
    → Extract word frequency (word cloud)
  → generateTradingSignal()
    → Cross-reference sentiment + price movement
    → Generate BUY/SELL/HOLD with strength & reasoning
  → Return full payload to client
```

### Order Execution Flow
```
User submits order → OrderForm.confirmOrder()
  → HTTP POST /api/portfolio/order { symbol, type, quantity }
  → Get current quote (stockService.getQuote)
  → Validate balance (BUY) or holdings (SELL)
  → Update User.balance
  → Update Portfolio.holdings
    → BUY: Add/increase holding, recalculate avgPrice
    → SELL: Decrease/remove holding
  → Create Order document
  → Return confirmation + new balance
```

## 3. WebSocket Architecture

```
Client                          Server
  │                               │
  │──── connect ─────────────────►│ Socket.IO handshake
  │                               │
  │──── subscribe:stock ─────────►│ Add to subscriber set
  │                               │
  │◄─── stock:quote ──────────────│ Every 5s per subscriber
  │                               │
  │──── subscribe:watchlist ─────►│ Bulk subscribe
  │                               │
  │◄─── market:update ────────────│ Every 30s broadcast
  │                               │
  │──── unsubscribe:stock ───────►│ Remove from set
  │                               │
  │──── disconnect ──────────────►│ Clean up intervals
```

**Key Design Decisions:**
- Per-socket subscription tracking (Set per connection)
- 5-second polling interval balances freshness vs. API rate limits
- Market-wide broadcasts use io.emit() for efficiency
- Heartbeat: 25s ping interval, 20s timeout

## 4. Sentiment Processing Pipeline

```
Raw Article Text
    │
    ▼
┌──────────────────────────┐
│  Tokenization & Scoring  │
│  (sentiment npm library) │
│  + Financial Lexicon     │
│                          │
│  Extended terms:         │
│  bullish: +3, crash: -4  │
│  upgrade: +2, NPA: -2   │
│  beat: +2, shortfall: -2 │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Classification          │
│                          │
│  comparative > 0.1  → ✅ Positive
│  comparative < -0.1 → ❌ Negative
│  else               → ⚠️ Neutral
│                          │
│  Confidence = f(|comp|)  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Aggregation             │
│                          │
│  • Count per category    │
│  • Average score         │
│  • Sentiment ratio %     │
│  • Overall label         │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Trading Signal          │
│                          │
│  Strong positive (>60%)  │
│  + price dip → BUY       │
│                          │
│  Strong negative (>60%)  │
│  + price rise → SELL     │
│                          │
│  Mixed → HOLD            │
└──────────────────────────┘
```

## 5. UI Component Hierarchy

```
App
├── AuthPage (unauthenticated)
│   └── Login / Register form
│
├── Layout (authenticated)
│   ├── Navbar
│   │   ├── Logo + Nav links
│   │   ├── Connection status (WS)
│   │   ├── Balance display
│   │   ├── Notification bell
│   │   └── Profile dropdown
│   │
│   └── Routes
│       ├── Dashboard
│       │   ├── NewsTicker
│       │   ├── MarketOverview (index card)
│       │   ├── TopMovers (gainers/losers)
│       │   ├── HeatMap (50-stock grid)
│       │   └── Stock table
│       │
│       ├── StockPage
│       │   ├── StockSearch
│       │   ├── StockDetails (OHLC, day range)
│       │   ├── OrderForm (BUY/SELL + confirmation)
│       │   ├── StockChart (Lightweight Charts)
│       │   └── NewsPanel
│       │       ├── Duration selector (1D/1W/1M/Custom)
│       │       ├── DatePicker (custom range)
│       │       ├── Filters (sort, sentiment)
│       │       ├── SentimentMeter (gauge)
│       │       ├── TradingSignal (AI signal)
│       │       ├── WordCloud
│       │       └── NewsCard[] (expandable)
│       │
│       ├── WatchlistPage
│       │   ├── Add stock search
│       │   └── Stock table (live quotes)
│       │
│       └── PortfolioPage
│           ├── Summary cards (invested, P&L)
│           ├── Holdings tab (enriched table)
│           ├── Orders tab (history)
│           └── Allocation tab (pie chart)
│
└── Context Providers
    ├── AuthContext (user, token, auth methods)
    ├── StockContext (selected stock, quotes, news)
    └── WebSocketContext (Socket.IO, subscriptions)
```

## 6. Security

- **Password Hashing** — bcrypt with 12 salt rounds
- **JWT Authentication** — Stateless tokens with 7-day expiry
- **Rate Limiting** — 200 requests per 15 minutes per IP
- **Helmet** — Security headers (XSS, MIME sniffing, etc.)
- **CORS** — Restricted to client origin
- **Input Validation** — Mongoose schema validation + route-level checks
- **API Key Protection** — Server-side only, never exposed to client

## 7. Performance Optimizations

- **In-Memory Caching** — Stock quotes (15s), news (2min)
- **Batch API Calls** — Multiple quotes fetched in parallel with batching
- **WebSocket** — Eliminates polling overhead for real-time data
- **Compression** — gzip response compression
- **Lazy Loading** — Route-based code splitting via React Router
- **Debounced Search** — 200ms delay on stock search input
- **Simulated Fallback** — App remains functional without API keys
