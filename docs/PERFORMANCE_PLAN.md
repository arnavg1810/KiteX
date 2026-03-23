# Performance Optimization Plan

## Goals
- UI feels instant and smooth.
- Minimal re-renders; no lag from WebSocket or search.

## Frontend

### 1. Lazy loading
- Route-level: `React.lazy()` for Dashboard, Stocks, Watchlist, Portfolio; wrap in `Suspense` with a small fallback (e.g. skeleton or spinner).
- Heavy components: Lazy load StockChart, FnoPanel, KeyEventsPanel, AllocationCharts where appropriate.

### 2. React.memo
- Memoize: StockDetails, StockChart, NewsCard, WatchlistRow, HoldingsRow, SummaryCard, Sparkline, Pie segments. Compare by symbol/quote/ids to avoid unnecessary re-renders when parent state updates.

### 3. useCallback & useMemo
- All subscription callbacks passed to WebSocket (e.g. `subscribeStock(symbol, callback)`) should be `useCallback` with correct deps so effect deps are stable.
- Derived data: `useMemo` for filtered/sorted lists (watchlist stocks, orders, allocation pie data, F&O trend arrays). Depend on raw state only.

### 4. WebSocket state updates
- Throttle: When receiving `stock:quote`, update state at most every 300–500 ms per symbol (e.g. ref with last update time).
- Batch: If multiple quotes arrive in one tick, do one setState with a combined map instead of one setState per quote.
- Prefer storing quotes in a single object (e.g. `liveQuotes[symbol]`) so only components that use that symbol re-render when using memo.

### 5. Skeleton loaders
- Use SkeletonChart for chart area until data is ready; SkeletonTable for watchlist/portfolio tables; SkeletonCard for cards. Reduces layout shift and perceived latency.

### 6. Debounce search
- Stock search and “Add stock” watchlist search: debounce 250–350 ms so API isn’t hit on every keystroke.

### 7. Virtualized watchlist
- For watchlists with many symbols (e.g. 50+), use a virtual list (e.g. react-window or react-virtuoso) so only visible rows are mounted. Reduces DOM and re-renders.

### 8. Reduce re-renders
- Avoid storing entire quote object in context if only a few fields are needed; or split context (e.g. “quote map” context) so components subscribe to a slice.
- Keep WebSocket callback closure small: only update a ref or a dedicated “quotes” state; let memoized children read from that.

## Backend
- Optimize portfolio aggregation (single pass for totals).
- Index: user, user+createdAt for orders; user+order for watchlists.
- F&O/Events: Cache in MongoDB or in-memory with TTL to avoid repeated external API calls.
- WebSocket: Shared quote cache per symbol (1–2 s TTL); limit symbols per socket (e.g. 50) to avoid overload.

## Metrics (optional)
- Use React DevTools Profiler to confirm fewer re-renders after memo/throttle.
- Measure LCP and INP for critical path (dashboard, stock page, portfolio).
