# Deployment-Ready Configuration

## Environment Variables

### Server (.env)
- `NODE_ENV=production`
- `PORT=5000`
- `MONGODB_URI=<your MongoDB Atlas or server URI>`
- `JWT_SECRET=<strong secret>`
- `JWT_EXPIRE=7d`
- `CLIENT_URL=<frontend origin, e.g. https://kitex.example.com>`
- `TWELVEDATA_API_KEY=<optional; for live quotes>`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX=200`

### Client (build-time)
- `VITE_API_URL` - The backend API URL  (e.g., `https://api.yourdomain.com` for production)
- `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- Ensure Vite proxy in dev points to server (e.g. `/api` → `http://localhost:5000/api`, socket to same host).

#### Vercel Deployment
When deploying on Vercel, set environment variables in the **Environment Variables** section:
1. Go to your Vercel project settings
2. Navigate to **Settings → Environment Variables**
3. Add for **Production** environment:
   - `VITE_API_URL` = `https://your-backend-domain.com` (your production backend URL)
   - `VITE_GOOGLE_CLIENT_ID` = `your_production_google_client_id`
4. Add for **Preview** environment (optional, for staging):
   - `VITE_API_URL` = `https://staging-backend.com` (your staging backend URL)
5. Redeploy to apply changes

## Build
- **Client**: `npm run build` (Vite); output in `client/dist`.
- **Server**: No build step; run with `node server/src/index.js` or `npm run start`. Serve static client from Express in production (optional): `app.use(express.static(path.join(__dirname, '../client/dist')))` and `app.get('*', (req, res) => res.sendFile(...))` for SPA.

## Process
- Use a process manager (PM2 or systemd). Example PM2: `pm2 start server/src/index.js --name kite-api`.
- Single instance: WebSocket works out of the box. Multi-instance: add Socket.IO Redis adapter and sticky sessions (or single WS server behind LB).

## Database
- MongoDB: Ensure indexes from DB_SCHEMA.md (user, user+createdAt, symbol+date for events). Run migrations for Order.executedPrice and Watchlist multi-list if applicable.

## Security
- HTTPS in production; CORS limited to CLIENT_URL.
- Helmet and rate limiting enabled.
- No secrets in client bundle.

## Health
- `GET /api/health` for load balancer or monitoring.
- Optional: readiness check that pings MongoDB and (if used) external quote API.

## Optional
- Docker: Dockerfile for Node server; optional nginx for static client.
- CI: Lint + test + build on push; deploy to your host or cloud.
