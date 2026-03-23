# WebSocket Implementation Plan

## Technology
- **Server**: Socket.IO on same HTTP server (Express).
- **Client**: socket.io-client; connection to same origin (Vite proxy or same host).

## Connection & Status
- **Live status**: Client shows "Live" (green) when `socket.connected === true`, "Disconnected" (red) otherwise. Use `connect` / `disconnect` and optional `connect_error` for reconnection state.
- **Throttling**: Server sends quote updates per symbol at a fixed interval (e.g. 2–3 s) instead of on every tick; batch multiple symbols in one tick to avoid burst. Client may throttle UI updates (e.g. max one state update per 500 ms per symbol) to reduce re-renders.
- **Debouncing**: Client debounces subscription changes (e.g. when watchlist symbols change, wait 300 ms before emitting new `subscribe:watchlist`).

## Events

### Client → Server
- `subscribe:stock` (symbol: string) — add symbol to this socket’s subscription set.
- `unsubscribe:stock` (symbol: string) — remove.
- `subscribe:watchlist` (symbols: string[]) — set or add symbols for this socket (replace or merge by implementation choice; typically replace for current watchlist view).

### Server → Client
- `stock:quote` — payload: `{ symbol, quote }`. Throttled per symbol (e.g. every 2–3 s).
- `market:update` — payload: `{ timestamp, isMarketOpen, topQuotes }`. Broadcast to all; interval e.g. 30 s.
- Optional: `portfolio:update` — when user places order, server can emit to that user’s socket with updated summary (alternative: client refetches after order).

## Implementation Details (Server)
- Keep a `Map<socketId, Set<symbol>>` (or similar) per socket. On `subscribe:stock` / `subscribe:watchlist`, update set.
- Single `setInterval` (e.g. 2.5 s): for each socket, iterate its symbols, fetch quote once per symbol (use in-memory or external API), emit `stock:quote` to that socket. If many symbols, batch or limit (e.g. max 50 symbols per socket).
- On disconnect, clear that socket’s subscriptions.
- Use a shared quote cache (TTL 1–2 s) per symbol to avoid duplicate API calls across sockets.

## Implementation Details (Client)
- Single Socket.IO connection in WebSocketContext; expose `connected`, `subscribeStock(symbol, callback)`, `subscribeWatchlist(symbols)`.
- Store callbacks in a ref (e.g. `Map<symbol, callback>`). On `stock:quote`, invoke the callback for that symbol. Wrap callback in a throttle (e.g. 500 ms) so React state updates don’t flood.
- Memoize components that render quote (React.memo); use stable callbacks (useCallback) so subscription effect doesn’t re-run unnecessarily.
- Dashboard/Watchlist/Portfolio: subscribe to relevant symbols on mount; unsubscribe on unmount or when symbol list changes (with debounce).

## Goals
- Real-time price, change %, volume, and mini charts without page reload.
- Watchlist, Portfolio P&L, and Dashboard update live.
- Throttling/debouncing to prevent UI lag and server overload.
- Live status indicator (Live / Disconnected).
- Minimal re-renders via memoization and throttled state updates.
