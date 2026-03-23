# Database Schema Updates

## MongoDB Collections

### User (existing, unchanged for upgrade)
- `name`, `email`, `password` (select: false), `balance`, `avatar`, `preferences{ theme, notifications, defaultChart }`

### Portfolio (existing)
- `user` (ref User, unique), `holdings[]` (symbol, name, quantity, avgPrice, investedValue), `totalInvested`, `totalPnL`, `dayPnL`

### Order (updated)
- **Added**: `executedPrice` (Number) — execution price per unit (can equal `price` for market).
- Existing: `user`, `symbol`, `name`, `type` (BUY/SELL), `orderType` (MARKET/LIMIT/SL/SL-M), `quantity`, `price`, `triggerPrice`, `status`, `executedAt`

### Watchlist (replaced with multiple watchlists)
- **Old**: Single document per user with `name`, `stocks[]`.
- **New**: One document per list.
  - `user` (ref User), `name` (String), `order` (Number, default 0 for sort), `stocks[]` { symbol, name, addedAt, sortOrder? }.
  - Index: `{ user: 1, order: 1 }`.
  - Constraint: max 5 watchlists per user (enforced in API).

### StockFnoCache (new, optional)
- For F&O data when using external API with rate limits.
- `symbol` (String, unique), `openInterest`, `oiChange`, `deliveryVolume`, `deliveryChange`, `deliveryPercent`, `series` (e.g. 1D/1W), `from`, `to`, `updatedAt`.

### KeyEvent (new)
- For key events & announcements per symbol.
- `symbol` (String), `type` (earnings | dividend | corporate_action | regulatory | board_meeting | news), `title`, `description`, `date`, `source`, `createdAt`.
- Index: `{ symbol: 1, date: -1 }`, `{ type: 1 }`.

## Migration Notes

1. **Watchlist**: Migrate existing single watchlist to new collection with `order: 0`. Keep backward compatibility: if no multi-watchlist docs exist, create default "My Watchlist" from old schema or first fetch.
2. **Order**: Add `executedPrice`; backfill existing orders with `executedPrice = price` where missing.
3. **StockFnoCache / KeyEvent**: New collections; can be populated by cron or on-demand from external APIs.
