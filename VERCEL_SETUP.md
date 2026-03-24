# Vercel Deployment Guide - VITE_API_URL Configuration

## 🚀 Moving from Preview to Production

### The Issue
The app uses `VITE_API_URL` environment variable to determine which backend API to connect to. Each deployment branch (main, production) can have different API endpoints.

### Solution: Set Environment Variables in Vercel Dashboard

#### Step 1: Access Vercel Project Settings
1. Go to [vercel.com](https://vercel.com)
2. Select your KiteX project
3. Click **Settings** at the top
4. Select **Environment Variables** in the left sidebar

#### Step 2: Add Environment Variables for Production

**For Production Branch (main):**
```
VITE_API_URL = https://your-production-backend.com
VITE_GOOGLE_CLIENT_ID = your_production_google_client_id
```

**For Preview Deployments (optional, for feature branches):**
```
VITE_API_URL = https://staging-backend.com
VITE_GOOGLE_CLIENT_ID = your_staging_google_client_id
```

#### Step 3: Important - Set Environment Selection
Make sure to assign each variable to the correct environment:
- **Production**: Select this checkbox for production builds
- **Preview**: Select this checkbox for preview builds (feature branches)
- **Development**: Optional, for local `npm run dev`

#### Step 4: Redeploy
After setting environment variables, redeploy:
1. Go to **Deployments**
2. Click the three dots on your latest deployment
3. Select **Redeploy** (NOT "Rebuild")

Alternative: Push a new commit to trigger automatic redeployment with the new env vars.

### Verification

After redeployment, verify the configuration:
1. Open your production site
2. Open **DevTools → Network tab**
3. Check API requests - they should go to your `VITE_API_URL` domain
4. If still seeing wrong API, hard refresh (Ctrl+Shift+R on Windows)

### Common Issues

**API requests still hitting old URL?**
- Clear browser cache: `Ctrl+Shift+Delete` → Clear cache
- Hard refresh: `Ctrl+Shift+R`
- Incognito window: Env vars may be cached

**Still on preview environment?**
- Check that you pushed to the branch connected to production
- Verify the environment variable shows "Production" badge in Vercel

**Different URLs for different branches?**
- `main` branch → Production environment
- `develop` branch → Preview environment
- Set VITE_API_URL in both environments separately

### Example Configuration

**Production (https://kitex.vercel.app):**
```
VITE_API_URL = https://api.kitex.app
VITE_GOOGLE_CLIENT_ID = 123456789.apps.googleusercontent.com
```

**Preview (https://feature-branch.kitex.vercel.app):**
```
VITE_API_URL = https://staging-api.kitex.app
VITE_GOOGLE_CLIENT_ID = 987654321.apps.googleusercontent.com
```

### Building Locally with Environment Variables

To test the production build locally:
```bash
# Set environment variables in .env.production
cd client
npm run build
npm run preview
```

The preview will use the `VITE_API_URL` from your `.env.production` file.
