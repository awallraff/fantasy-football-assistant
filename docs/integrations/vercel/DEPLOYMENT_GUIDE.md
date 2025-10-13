# Deployment Guide - NFL Data API

## Overview

The NFL Data feature requires a Python backend that can't run on Vercel. This guide walks you through deploying the Python API service to Render, then connecting it to your Vercel app.

## Quick Start (5 minutes)

### Deploy to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Root Directory**: `python-api`
     - **Environment**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Get Your API URL**
   - Once deployed, Render provides a URL like: `https://your-app.onrender.com`
   - Copy this URL

4. **Configure Vercel**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add:
     ```
     NFL_DATA_API_URL=https://your-app.onrender.com
     ```
   - Redeploy your Vercel app

5. **Done!** 🎉
   - Your NFL Data page will now work in production

## Testing Your Deployment

### 1. Test API Health

Visit your API URL in a browser:
```
https://your-app.onrender.com/health
```

You should see:
```json
{"status": "ok"}
```

### 2. Test NFL Data Connection

```
https://your-app.onrender.com/api/nfl-data/test
```

Should return:
```json
{
  "success": true,
  "message": "Connection successful. Found X QB records.",
  "timestamp": "..."
}
```

### 3. Test in Your App

- Go to your Vercel app
- Navigate to `/nfl-data`
- Click "Test Connection"
- Should show success message

## Cost

Render offers a generous free tier:

- **Free Tier**: 750 hours/month
- **Limitation**: Sleeps after 15min of inactivity
- **Cold Start**: First request after sleep takes ~30-60 seconds
- **Paid Tier**: $7/month for always-on service

## Advanced Configuration

### CORS Settings

By default, the API allows all origins (`*`). For production, restrict to your domain:

Edit `python-api/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",
        "http://localhost:3000"  # Keep for local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Environment Variables

The Python API doesn't need any environment variables, but you can add:

- `LOG_LEVEL` - Set logging verbosity (default: "info")
- `MAX_WORKERS` - Number of Uvicorn workers (default: 1)

## Monitoring

Render provides comprehensive monitoring tools:

- **Logs**: Service → "Logs" tab (real-time streaming)
- **Metrics**: Service → "Metrics" tab (CPU, memory, requests)
- **Events**: Service → "Events" tab (deployments, restarts)
- **Health Checks**: Automatic monitoring of `/health` endpoint

## Troubleshooting

### API Returns 404

**Problem**: Visiting API URL returns 404

**Solution**:
- Check the Root Directory is set to `python-api`
- Verify Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Check deployment logs for errors

### Module Not Found Error

**Problem**: Logs show `ModuleNotFoundError: No module named 'nfl_data_py'`

**Solution**:
- Ensure `requirements.txt` exists in `python-api/` directory
- Check Build Command: `pip install -r requirements.txt`
- Redeploy

### Vercel Still Shows Error

**Problem**: NFL Data page in production shows "API URL not configured"

**Solution**:
1. Verify `NFL_DATA_API_URL` is set in Vercel environment variables
2. **Important**: Redeploy Vercel app after adding environment variable
3. Check the URL doesn't have trailing slash (e.g., `https://api.com` not `https://api.com/`)

### Connection Timeout

**Problem**: API request times out

**Solution**:
- Render free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30-60 seconds (cold start)
- This is normal behavior - subsequent requests will be fast
- Consider upgrading to paid tier ($7/month) for always-on service

## API Endpoints Reference

### `GET /`
Health check and service info

### `GET /health`
Simple health check (used by Render)

### `GET /api/nfl-data/test`
Test connection to nfl_data_py

### `GET /api/nfl-data/extract`
Extract NFL player data

**Query Parameters:**
- `years` (required): "2023,2024"
- `positions` (optional): "QB,RB,WR,TE" (default)
- `week` (optional): 1-18

**Example:**
```
GET /api/nfl-data/extract?years=2024&positions=QB&week=1
```

## Next Steps

After successful deployment:

1. ✅ Test the API endpoints manually
2. ✅ Verify Vercel environment variable is set
3. ✅ Redeploy Vercel
4. ✅ Test NFL Data page in production
5. ✅ (Optional) Configure CORS for your domain
6. ✅ (Optional) Set up monitoring/alerts

## Support

**Render Documentation**: [render.com/docs](https://render.com/docs)
**Render Support**: [render.com/support](https://render.com/support)

For code issues, check `python-api/README.md` for detailed API documentation.
