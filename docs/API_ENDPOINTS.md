# API Endpoint Updates

Base: `/api`. Auth: `Authorization: Bearer <token>` (except auth and public stock/news).

## Auth (existing)
- `POST /auth/register` — body: name, email, password
- `POST /auth/login` — body: email, password
- `GET /auth/me` — protected
- `PUT /auth/preferences` — protected; body: theme, notifications, defaultChart

## Stocks (existing)
- `GET /stocks/search?q=`
- `GET /stocks/quote/:symbol`
- `GET /stocks/timeseries/:symbol` — params: interval, outputsize, timeframe
- `GET /stocks/nifty50`, `GET /stocks/list`

## News (existing)
- `GET /news/company/:symbol` — params: from, to, sort
- `GET /news/market`

## Portfolio (updated)
- `GET /portfolio` — protected; returns holdings (with live prices), summary (totalInvested, totalCurrent, totalPnL, totalPnLPercent, dayPnL, balance)
- `POST /portfolio/order` — protected; body: symbol, type (BUY/SELL), quantity, orderType (MARKET/LIMIT), price? (for LIMIT), triggerPrice? (for SL/SL-M). Response: order (with executedPrice), balance, message. Real-time: client should refetch portfolio/orders or receive via WebSocket.
- `GET /portfolio/orders` — protected; returns orders with executedPrice, sorted by createdAt desc.

## Watchlist (multiple lists — new structure)
- `GET /watchlist` — protected; returns `{ watchlists: [{ _id, name, order, stocks: [{ symbol, name, addedAt, quote? }] }] }` (sorted by order). Enriched with quotes for each stock.
- `POST /watchlist` — protected; body: name → create new list (max 5).
- `PUT /watchlist/:id` — protected; body: name and/or stocks (for reorder); reorder stocks via stocks array order.
- `DELETE /watchlist/:id` — protected.
- `POST /watchlist/:id/add` — body: symbol, name.
- `DELETE /watchlist/:id/remove/:symbol`
- Backward compatibility: if client sends no list id, legacy `POST /watchlist/add` and `DELETE /watchlist/remove/:symbol` can target default (first) list.

## F&O (new)
- `GET /stocks/fno/:symbol` — params: range (1d | 1w | custom), from, to (for custom). Returns: available (boolean), openInterest, oiChange, deliveryVolume, deliveryChange, deliveryPercent, oiTrend[] (date, value), deliveryTrend[] (date, percent), buildUp (long_buildup | short_buildup | short_covering | long_unwinding | none). Data can be simulated or from external API.

## Key Events (new)
- `GET /stocks/events/:symbol` — params: type (earnings | dividend | corporate_action | regulatory | all), from, to. Returns: events[] (type, title, description, date, source). Timeline view on client.

## Health
- `GET /health` — { status: 'ok', timestamp }

## WebSocket Events (see WEBSOCKET_PLAN.md)
- Client: `subscribe:stock`, `unsubscribe:stock`, `subscribe:watchlist` (symbols[])
- Server: `stock:quote` { symbol, quote }, `market:update` { timestamp, isMarketOpen, topQuotes }, optional `portfolio:update`
