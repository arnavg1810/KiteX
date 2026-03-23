# UI Component Hierarchy

## App
- `BrowserRouter` → `AuthContext` → `WebSocketProvider` → `StockProvider` → `ProtectedRoute` (or public) → `Layout` → `Outlet` / page

## Layout
- `Navbar` (logo, nav links, **Live/Disconnected** status, balance, notifications, profile)
- `main` → page content
- `Toaster` (react-hot-toast) at root for order confirmations and notifications

## Dashboard
- Dashboard → MarketOverview, TopMovers, HeatMap, NewsTicker (all consume WebSocket market data where applicable; memoized)

## Stocks (StockPage)
- StockSearch (debounced)
- When symbol selected:
  - **Left**: StockDetails (quote, OHLC, volume; live via WebSocket), OrderForm
  - **Center**: StockChart (timeframes; skeleton when loading), **FnoPanel** (OI, delivery, trends, build-up), **KeyEventsPanel** (timeline, filter: earnings/corporate/regulatory/all), NewsPanel (News & Sentiment; **Key Events** replaces “Key Terms” / WordCloud in same panel or as separate section)

## Watchlist
- WatchlistPage → WatchlistTabs (up to 5 lists; create/rename/delete), Add-stock UI (debounced search)
- Per list: WatchlistTable (virtualized rows), each row: symbol, **Sparkline**, price, change %, volume, actions (remove, open stock)
- Live prices via WebSocket (throttled); subscribe to all symbols of active list

## Portfolio
- PortfolioPage → Summary cards (Invested, Current, P&L, Day P&L; optional Sharpe, Volatility, Beta from allocation)
- Tabs: Holdings | Order History | Allocation
- **Holdings**: Table with **BUY** / **SELL** per row → OrderModal (Market/Limit, qty, confirm) → confirmation toast; order history shows execution price
- **Allocation**: Dynamic pie (sector + stock), gain/loss distribution, asset breakdown; interactive tooltips; metrics: Total Investment, Current Value, Absolute Return, % Return, Sharpe, Volatility, Beta (optional)
- Real-time: refetch portfolio after order or via WebSocket; balance and P&L update

## Common
- SkeletonCard, SkeletonChart, SkeletonTable (for charts and tables)
- OrderModal (reusable for Portfolio and optionally Stock page)
- Sparkline (mini chart per symbol)

## UI Polish
- Dark professional theme (existing); smooth hover and transitions (Framer Motion); expandable stock details panel; compact trading layout; real-time notification toaster.
