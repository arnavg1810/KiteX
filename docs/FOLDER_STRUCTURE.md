# Folder Structure (Post-Upgrade)

```
Clone Of Zerodha Kite/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── common/           # SkeletonLoader, Toaster wrapper
│   │   │   ├── dashboard/
│   │   │   ├── layout/
│   │   │   ├── news/             # NewsPanel, NewsCard, WordCloud, SentimentMeter, TradingSignal
│   │   │   ├── portfolio/        # Portfolio, OrderModal, AllocationCharts, HoldingsTable
│   │   │   ├── stock/            # StockPage, StockDetails, StockChart, OrderForm, FnoPanel, KeyEventsPanel
│   │   │   └── watchlist/        # WatchlistPage, WatchlistTabs, WatchlistTable (virtualized), Sparkline
│   │   ├── contexts/             # AuthContext, StockContext, WebSocketContext
│   │   ├── hooks/                # useDebounce, useThrottle, usePortfolioLive (optional)
│   │   ├── services/             # api.js
│   │   ├── utils/                # constants, formatters
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/               # db, nifty50
│   │   ├── middleware/           # auth (protect)
│   │   ├── models/               # User, Portfolio, Order, Watchlist (multi), KeyEvent, StockFnoCache (optional)
│   │   ├── routes/               # auth, stocks, news, portfolio, watchlist; stocks extended for fno & events
│   │   ├── services/             # stockService, fnoService (optional), eventsService (optional)
│   │   └── websocket/            # index.js (throttled quotes, market broadcast)
│   ├── .env
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DB_SCHEMA.md
│   ├── API_ENDPOINTS.md
│   ├── WEBSOCKET_PLAN.md
│   ├── FOLDER_STRUCTURE.md
│   ├── COMPONENT_HIERARCHY.md
│   ├── PERFORMANCE_PLAN.md
│   └── DEPLOYMENT.md
└── README.md
```

## New / Moved Files (Summary)
- **Client**: `components/stock/FnoPanel.jsx`, `components/stock/KeyEventsPanel.jsx`; `components/portfolio/OrderModal.jsx`, allocation subcomponents; `components/watchlist/WatchlistTabs.jsx`, `Sparkline.jsx`; `hooks/useDebounce.js`, `hooks/useThrottle.js`.
- **Server**: `models/KeyEvent.js`, optional `models/StockFnoCache.js`; `services/fnoService.js`, `services/eventsService.js`; watchlist routes extended for multiple lists; stocks route extended with `/fno/:symbol`, `/events/:symbol`.
