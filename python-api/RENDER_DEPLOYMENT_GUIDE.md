# Render Deployment Guide

## Overview

This guide walks through deploying the Python NFL Data API service to Render. Render provides a reliable platform with a generous free tier and excellent GitHub integration.

## Pre-Deployment Checklist

### ✅ Configuration Files Ready
- [x] **render.yaml** - Render service configuration
- [x] **requirements.txt** - Python dependencies
- [x] **Procfile** - Process definition (fallback)
- [x] **main.py** - FastAPI application with PORT handling

## Step-by-Step Deployment

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended for auto-deploys)
3. Authorize Render to access your GitHub repositories

### Step 2: Create New Web Service
1. Click "New +" button in Render dashboard
2. Select "Web Service"
3. Connect your repository: `fantasy-football-assistant`
4. **Important**: Set root directory to `python-api`

### Step 3: Configure Service
Render should auto-detect `render.yaml`, but verify these settings:

**Basic Settings:**
- **Name**: `nfl-data-api` (or your preferred name)
- **Runtime**: Python 3
- **Region**: Oregon (US West) - recommended
- **Branch**: main
- **Root Directory**: `python-api`

**Build & Deploy:**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Environment Variables:**
- `PYTHON_VERSION`: `3.11.0` (auto-set from render.yaml)
- `PORT`: (Render auto-sets this)

**Advanced Settings:**
- **Health Check Path**: `/health`
- **Auto-Deploy**: Yes (deploys on git push to main)

**Plan:**
- Select **Free** tier

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will:
   - Clone your repository
   - Install dependencies from requirements.txt
   - Start uvicorn server
   - Assign a public URL

**Expected Build Time**: 2-5 minutes

### Step 5: Monitor Deployment
Watch the deployment logs in Render dashboard:

**Successful Build Indicators:**
```
==> Installing dependencies from requirements.txt
Successfully installed fastapi uvicorn nfl-data-py pandas pydantic gunicorn
==> Starting service with command 'uvicorn main:app --host 0.0.0.0 --port $PORT'
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
```

### Step 6: Get Your API URL
Once deployed, Render provides a URL like:
```
https://nfl-data-api.onrender.com
```

**Copy this URL** - you'll need it for Vercel configuration.

### Step 7: Test Your API

**Health Check:**
```bash
curl https://nfl-data-api.onrender.com/health
```
Expected response:
```json
{"status": "ok"}
```

**API Info:**
```bash
curl https://nfl-data-api.onrender.com/
```
Expected response:
```json
{
  "service": "NFL Data API",
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-10-10T..."
}
```

**Test Connection:**
```bash
curl https://nfl-data-api.onrender.com/api/nfl-data/test
```
Expected response:
```json
{
  "success": true,
  "message": "Connection successful. Found X QB records.",
  "timestamp": "2025-10-10T..."
}
```

**Full Data Extract:**
```bash
curl "https://nfl-data-api.onrender.com/api/nfl-data/extract?years=2024&positions=QB&week=1"
```
Expected: JSON with player data

### Step 8: Configure Vercel Environment Variable

1. Go to [vercel.com](https://vercel.com) dashboard
2. Open your `fantasy-football-assistant` project
3. Navigate to **Settings** → **Environment Variables**
4. Add new variable:
   - **Key**: `NFL_DATA_API_URL`
   - **Value**: `https://nfl-data-api.onrender.com` (your Render URL)
   - **Environments**: Production, Preview, Development (select all)
5. Click **Save**

### Step 9: Redeploy Vercel App

**Option A: Trigger Redeploy from Vercel**
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Select "Redeploy"

**Option B: Push to GitHub**
```bash
git commit --allow-empty -m "chore: trigger redeploy with Render API URL"
git push origin main
```

### Step 10: Verify Production

Once Vercel redeploys:
1. Go to your production app: `https://your-app.vercel.app/nfl-data`
2. Click "Test Connection"
3. Should see success message with player count
4. Click "Extract Data"
5. Should see NFL player statistics

## Troubleshooting

### Build Fails

**Check Build Logs:**
- Render Dashboard → Your Service → Logs tab
- Look for Python/dependency errors

**Common Issues:**
- **Missing dependencies**: Check requirements.txt has all packages
- **Python version**: Verify PYTHON_VERSION is 3.11
- **Import errors**: Check all dependencies installed correctly

### Deploy Succeeds but Health Check Fails

**Check Application Logs:**
- Look for Python exceptions
- Verify uvicorn started correctly
- Check PORT environment variable is being read

**Common Issues:**
- **Port binding**: Ensure main.py reads `os.environ.get("PORT", 8000)`
- **Import errors**: Missing dependency in requirements.txt
- **nfl_data_py errors**: Library fetching data (normal on first run)

### API Returns Errors

**Check Logs for:**
- nfl_data_py connection issues
- Memory errors (upgrade plan if needed)
- Timeout errors (nfl_data_py can be slow on first fetch)

**First Request Behavior:**
- nfl_data_py caches data locally
- First request may take 30-60 seconds
- Subsequent requests should be fast (<2s)

### CORS Errors

If you see CORS errors in browser console:

1. Check main.py has correct CORS middleware:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

2. For production, restrict origins:
```python
allow_origins=[
    "https://your-app.vercel.app",
    "http://localhost:3000"
],
```

## Render Free Tier Limits

- **750 hours/month** - Plenty for this API
- **Sleeps after 15 min inactivity** - First request after sleep is slower
- **512 MB RAM** - Sufficient for nfl_data_py
- **100 GB bandwidth** - More than enough

**Important**: Free tier services sleep after inactivity. First request wakes the service (30-60s response time). Consider upgrading to paid tier ($7/mo) for always-on service if needed.

## Monitoring

**Render Dashboard Metrics:**
- **CPU Usage**: Monitor for spikes during data fetches
- **Memory Usage**: Watch for memory leaks
- **Bandwidth**: Track API usage
- **Response Times**: Should be <2s for cached data

**Logs:**
- Real-time logs available in dashboard
- Filter by level (INFO, WARNING, ERROR)
- Search for specific requests

## Success Criteria

- [x] Render deployment succeeds
- [x] `/health` endpoint returns 200
- [x] `/api/nfl-data/test` returns success with player count
- [x] `/api/nfl-data/extract` returns player data
- [x] Vercel environment variable configured
- [x] Vercel app redeployed
- [x] NFL Data page works in production

## Render Features

| Feature | Details |
|---------|---------|
| Free Tier Hours | 750 hours/month |
| Build Time | ~3 minutes |
| Cold Start | Sleeps after 15 min inactivity |
| GitHub Integration | ✅ Reliable auto-deploys |
| Health Checks | ✅ Built-in monitoring |
| Auto-Deploy | ✅ On git push to main |
| Custom Domains | ✅ Free SSL certificates |

## Next Steps After Deployment

1. **Restrict CORS**: Update main.py to only allow your Vercel domain
2. **Add API Authentication**: Consider adding API key protection
3. **Monitor Performance**: Watch response times and memory usage
4. **Optimize Caching**: Consider adding Redis for nfl_data_py cache
5. **Add Rate Limiting**: Prevent abuse with rate limits

## Resources

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **FastAPI Deployment**: [fastapi.tiangolo.com/deployment](https://fastapi.tiangolo.com/deployment/)
- **nfl_data_py**: [github.com/cooperdff/nfl_data_py](https://github.com/cooperdff/nfl_data_py)

---

**Your Python API is ready to deploy to Render! 🚀**

Follow the steps above and you'll have your NFL Data API running in production within 10 minutes.
