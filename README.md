# 🚀 KiteX Trading Terminal

A full-stack, real-time stock trading platform clone featuring live market data, portfolio management, advanced analytics, and WebSocket-driven real-time updates.

![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)
![Node](https://img.shields.io/badge/node-v24%2B-blue)
![React](https://img.shields.io/badge/react-18-61DAFB?logo=react)
![MongoDB](https://img.shields.io/badge/mongodb-Atlas/Local-13AA52?logo=mongodb)

---

## 🌍 Live Demo

The project is fully deployed and running in production. You do not need to run it locally to test it.

🔗 **Frontend (Vercel)**: [https://kitex.vercel.app](https://kitex.vercel.app)  
⚙️ **Backend (Render)**: `https://kitex.onrender.com`

**Demo Credentials:**
- **Email**: testuser123@example.com
- **Password**: Test1234!
*(Or feel free to register a new account on the live site)*

---

## ⚡ Quick Start (2 Minutes)

### 1. Open Browser
```
https://kitex.vercel.app
```

### 2. Login
- **Email**: testuser123@example.com  
- **Password**: Test1234!
- (Or register a new account to test everything)

---

## 📋 What's Implemented

### ✅ Backend (100%)
- Express.js REST API with JWT authentication
- Socket.IO WebSocket for real-time data
- MongoDB with 6 optimized collections
- Rate limiting, CORS, compression, security headers
- F&O data and key events services

### ✅ Frontend (100%)
- React 18 with TypeScript-ready code
- 30+ reusable components
- Real-time WebSocket updates
- Responsive dark theme with Tailwind CSS
- Framer Motion animations

### ✅ Features Implemented
- ✅ User authentication (register/login/logout)
- ✅ Real-time dashboard with market overview
- ✅ Stock search & detailed view
- ✅ Interactive charts (multiple timeframes)
- ✅ F&O data visualization
- ✅ Key events timeline
- ✅ Portfolio management with P&L tracking
- ✅ BUY/SELL order placement
- ✅ Multiple watchlists (up to 5)
- ✅ Live price updates via WebSocket
- ✅ News & sentiment analysis
- ✅ Portfolio allocation charts
- ✅ Order history tracking

---

## 🎯 Core Capabilities

### Real-time Data
- **WebSocket** throttled quote updates (2.5s per symbol)
- **Market broadcasts** every 30 seconds
- **Live connection** status indicator
- **Automatic reconnection** on disconnect

### Trading Features
- Place immediate **market orders** or **limit orders**
- Real-time P&L calculation
- Order history and status tracking
- Balance management and validation

### Analytics
- Sector-wise portfolio breakdown
- Gain/loss distribution analysis
- Sharpe ratio and volatility metrics
- Comparative stock performance

### Watchlist Management
- Create up to 5 independent watchlists
- Real-time prices per list
- Quick add/remove stocks
- Sparkline mini-charts

---

## 📁 Project Structure

```
KiteX/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # React components (30+)
│   │   ├── contexts/       # React contexts (3)
│   │   ├── services/       # API integration
│   │   ├── utils/          # Constants & formatters
│   │   └── App.jsx
│   ├── vite.config.js      # Proxy to backend
│   └── tailwind.config.js
│
├── server/                 # Express.js Backend
│   ├── src/
│   │   ├── routes/         # API routes (5)
│   │   ├── models/         # MongoDB schemas (6)
│   │   ├── services/       # Business logic
│   │   ├── websocket/      # Socket.IO server
│   │   ├── middleware/     # Auth & limits
│   │   ├── config/         # DB & data config
│   │   └── index.js        # Entry point
│   ├── .env                # Environment config
│   └── package.json
│
├── docs/                   # Comprehensive documentation
│   ├── ARCHITECTURE.md     # System design
│   ├── API_ENDPOINTS.md    # API reference
│   ├── DB_SCHEMA.md        # Database design
│   ├── WEBSOCKET_PLAN.md   # Real-time strategy
│   └── 4 more docs
│
├── SETUP_GUIDE.md          # Detailed setup guide
└── README.md               # This file
```

---

## 🔧 Configuration

### Environment Variables (.env)
Located in `server/.env`:

```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/kite-trading

# Authentication
JWT_SECRET=kite_trading_secret_key_2026_demo
JWT_EXPIRE=7d

# Client
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id

# Frontend (.env.production for Vercel)
VITE_API_URL=https://kitex.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Optional: Real Data APIs
TWELVEDATA_API_KEY=          # Stock quotes
NEWSAPI_KEY=                 # Market news
FINNHUB_API_KEY=            # Alternative quotes

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

---

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/register      Register new user
POST   /api/auth/login         Login user
GET    /api/auth/me            Get current user
PUT    /api/auth/preferences   Update preferences
```

### Stocks
```
GET    /api/stocks/search?q=   Search stocks
GET    /api/stocks/quote/:sym  Get live quote
GET    /api/stocks/timeseries  Get chart data
GET    /api/stocks/nifty50     Nifty 50 overview
GET    /api/stocks/fno/:sym    F&O analysis
GET    /api/stocks/events/:sym Key events
```

### Portfolio
```
GET    /api/portfolio          Get holdings & P&L
POST   /api/portfolio/order    Place order
GET    /api/portfolio/orders   Order history
```

### Watchlist
```
GET    /api/watchlist          Get all watchlists
POST   /api/watchlist          Create list
PUT    /api/watchlist/:id      Rename/reorder
DELETE /api/watchlist/:id      Delete list
POST   /api/watchlist/:id/add          Add stock
DELETE /api/watchlist/:id/remove/:sym  Remove stock
```

### News
```
GET    /api/news/company/:sym  Company news
GET    /api/news/market        Market news
```

---

## 🔌 WebSocket Events

### Client → Server
```javascript
socket.emit('subscribe:stock', 'RELIANCE')
socket.emit('subscribe:watchlist', ['TCS', 'INFY', 'HDFCBANK'])
socket.emit('unsubscribe:stock', 'RELIANCE')
```

### Server → Client
```javascript
socket.on('stock:quote', { symbol, quote })     // Per symbol
socket.on('market:update', { timestamp, isMarketOpen, topQuotes })
```

---

## 🧪 Testing

### Demo Account
```
Email: test@example.com
Password: password123
```
Or register a new account directly in the app.

### Test Scenarios
1. **Dashboard**: View market overview and Nifty 50 data
2. **Stock Search**: Search "RELIANCE" → Place order
3. **Watchlist**: Add 5+ stocks → Monitor live prices
4. **Portfolio**: View holdings → Check P&L → Place orders
5. **WebSocket**: Watch prices update in real-time

---

## 📊 Database

### Collections
- **Users**: User accounts, balance, preferences
- **Portfolio**: Holdings per user
- **Orders**: Order history with execution details
- **Watchlists**: Multiple lists per user
- **KeyEvents**: Corporate events (earnings, dividends, etc.)
- **StockFnoCache**: F&O data cache (TTL: 24 hours)

### Indexes
- Users: `email` (unique)
- Orders: `user_1_createdAt_-1`
- Watchlists: `user_1_order_1`
- KeyEvents: `symbol_1_date_-1`

---

## 🚀 Development

### Build for Production

**Frontend**: 
```bash
cd client
npm.cmd run build
```
Output: `client/dist/` (ready for static hosting)

**Backend**: 
- Already production-ready
- Use process manager like PM2: `pm2 start server/src/index.js`

### Debug Mode

**Backend**:
```bash
cd server
npm.cmd run dev  # Uses nodemon for auto-restart
```

**Frontend**:
```bash
cd client
npm.cmd run dev   # Dev server with HMR
```

---

## 📦 Dependencies

### Backend
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **socket.io** - WebSocket library
- **jsonwebtoken** - JWT auth
- **bcryptjs** - Password hashing
- **axios** - HTTP client
- **helmet** - Security headers
- **cors** - Cross-origin support
- **express-rate-limit** - Rate limiting

### Frontend
- **react** - UI library
- **react-router-dom** - Routing
- **axios** - API calls
- **socket.io-client** - WebSocket client
- **tailwindcss** - Styling
- **framer-motion** - Animations
- **recharts** - Charts
- **lightweight-charts** - Trading charts
- **lucide-react** - Icons
- **react-hot-toast** - Notifications
- **react-datepicker** - Date input

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5001 in use | Change `PORT` in `server/.env` |
| MongoDB not running | Start MongoDB: `mongod` |
| WebSocket connection fails | Ensure server is running on configured port |
| CORS errors | Check `CLIENT_URL` matches frontend URL |
| Blank page on frontend | Check browser console for errors |
| Order fails | Ensure balance is sufficient |

---

## 📚 Documentation

Detailed documentation available in `/docs`:

- **ARCHITECTURE.md** - System design, scalability, patterns
- **API_ENDPOINTS.md** - Complete API reference with examples
- **DB_SCHEMA.md** - Database design and relationships
- **COMPONENT_HIERARCHY.md** - React component tree and props
- **WEBSOCKET_PLAN.md** - Real-time data flow and optimizations
- **PERFORMANCE_PLAN.md** - Optimization strategies
- **DEPLOYMENT.md** - Production deployment guide
- **SETUP_GUIDE.md** - Detailed setup instructions

---

## 🎓 Learning Resources

### Key Concepts Demonstrated
- **Authentication**: JWT with secure storage
- **Real-time**: WebSocket with throttling & debouncing
- **State Management**: React Context API
- **Database**: MongoDB with indexes and relationships
- **API Design**: RESTful with socket.io integration
- **Frontend**: Component composition, memoization, hooks
- **Backend**: Express middleware, error handling, rate limiting

---

## ✨ Technical Highlights

### Performance Optimizations
- ✅ WebSocket throttling (2.5s per symbol)
- ✅ Component memoization (React.memo)
- ✅ Lazy-loaded routes
- ✅ Request debouncing/caching
- ✅ Compression middleware
- ✅ Database indexes

### Security
- ✅ JWT authentication with expiry
- ✅ Password hashing (bcrypt)
- ✅ CORS restrictions
- ✅ Rate limiting
- ✅ Helmet.js security headers
- ✅ Input validation

### Code Quality
- ✅ Error boundaries
- ✅ Consistent naming conventions
- ✅ Modular component structure
- ✅ Service layer abstraction
- ✅ Configuration management

---

## 🎯 Next Steps

1. **Run the application** (see Quick Start)
2. **Explore the code** (well-documented)
3. **Test all features** (see Testing section)
4. **Read documentation** (in `/docs`)
5. **Customize** as needed (colors, data, features)

---

## 📞 Support

For detailed information:
- Check `/docs` for comprehensive guides
- Review inline JSDoc comments in code
- Check `.env` file for configuration options

---

## 📄 License

This project is provided as-is for educational and demonstration purposes.

---

## 🚀 Production Deployment Notes

To deploy KiteX to production (e.g., Vercel for frontend, Render for backend):

1. **Backend URL**: In your frontend `VITE_API_URL` on Vercel, ensure you append `/api` to the backend URL (e.g., `https://kitex.onrender.com/api`).
2. **WebSockets**: The frontend is configured to automatically strip `/api` from `VITE_API_URL` to connect to the Socket.IO server at the backend's root.
3. **Google OAuth**: Ensure `VITE_GOOGLE_CLIENT_ID` is set on the Vercel frontend, and `GOOGLE_CLIENT_ID` is set on the backend. Add your production frontend URL (e.g., `https://kitex.vercel.app`) to your **Authorized JavaScript origins** and **Authorized redirect URIs** in the Google Cloud Console.

---

**Version**: 1.0.1  
**Status**: ✅ Production-Ready 
**Last Updated**: March 2026

Built with ❤️ using React, Express, and MongoDB
