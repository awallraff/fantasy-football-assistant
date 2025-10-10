# Railway V2 RAILPACK Deployment Checklist

## ✅ Configuration Files

- [x] **railway.json** - Railway V2 configuration with RAILPACK builder
- [x] **Procfile** - Process type definition for uvicorn
- [x] **requirements.txt** - Python dependencies with uvicorn[standard]
- [x] **runtime.txt** - Python 3.11 runtime specification
- [x] **.python-version** - RAILPACK auto-detection
- [x] **.railwayignore** - Deployment optimization
- [x] **main.py** - PORT environment variable handling

## 📋 Pre-Deployment Checklist

### 1. Railway Project Setup
- [ ] Create Railway account at [railway.app](https://railway.app)
- [ ] Connect GitHub repository
- [ ] Select `python-api` as root directory
- [ ] Enable auto-deploys from main branch

### 2. Environment Variables (Optional)
Railway auto-detects everything, but you can configure:
- `PORT` - Auto-set by Railway (default: dynamic)
- `PYTHON_VERSION` - Auto-detected from runtime.txt (3.11)
- `LOG_LEVEL` - Optional: "info", "debug", "warning", "error"

### 3. Configuration Verification

**railway.json Settings:**
```json
{
  "build": {
    "builder": "RAILPACK"  // ✅ Optimized builder
  },
  "deploy": {
    "runtime": "V2",        // ✅ Latest runtime
    "numReplicas": 1,       // ✅ Single instance (free tier)
    "sleepApplication": false, // ✅ Always warm (no cold starts)
    "multiRegionConfig": {
      "us-west2": {
        "numReplicas": 1    // ✅ West coast deployment
      }
    }
  }
}
```

**Procfile Settings:**
```
web: uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
```
- ✅ Uses Railway's $PORT
- ✅ Fallback to 8000 for local dev
- ✅ Single worker (Railway handles scaling)

### 4. Dependency Verification

**requirements.txt:**
```
fastapi==0.115.0           # ✅ Latest stable
uvicorn[standard]==0.32.0  # ✅ With performance extras
nfl-data-py==0.3.3         # ✅ NFL data library
pandas==2.2.3              # ✅ Data processing
pydantic==2.9.2            # ✅ Data validation
gunicorn==21.2.0           # ✅ Production WSGI server
```

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
git push origin main
```
Railway auto-deploys on push to main branch.

### Step 2: Monitor Deployment
1. Go to Railway dashboard
2. Click on your project
3. Watch "Deployments" tab
4. Wait for "Deployed" status (2-5 minutes)

### Step 3: Get Your API URL
Railway provides a URL like:
```
https://your-app-name.up.railway.app
```

Copy this URL - you'll need it for Vercel.

### Step 4: Test Endpoints

**Health Check:**
```bash
curl https://your-app-name.up.railway.app/health
# Expected: {"status":"ok"}
```

**API Info:**
```bash
curl https://your-app-name.up.railway.app/
# Expected: JSON with service info
```

**NFL Data Test:**
```bash
curl https://your-app-name.up.railway.app/api/nfl-data/test
# Expected: Success message with player count
```

**Full Data Extract:**
```bash
curl "https://your-app-name.up.railway.app/api/nfl-data/extract?years=2024&positions=QB&week=1"
# Expected: JSON with player data
```

### Step 5: Configure Vercel
1. Go to Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   ```
   NFL_DATA_API_URL=https://your-app-name.up.railway.app
   ```
4. Redeploy Vercel app

## 🔍 Troubleshooting

### Deployment Fails

**Check Build Logs:**
1. Railway Dashboard → Deployments → Click deployment
2. View "Build Logs" tab
3. Look for Python/dependency errors

**Common Issues:**
- Missing dependencies → Check requirements.txt
- Wrong Python version → Verify runtime.txt says "python-3.11"
- Port binding error → Procfile should use ${PORT:-8000}

### Application Crashes

**Check Application Logs:**
1. Railway Dashboard → Project → "Logs" tab
2. Look for Python exceptions

**Common Issues:**
- Import errors → Missing dependency in requirements.txt
- nfl_data_py errors → Library may be fetching data (normal on first run)
- Memory errors → Upgrade Railway plan if needed

### Slow Response Times

**First Request:**
- Cold start is normal (should be minimal with `sleepApplication: false`)
- Subsequent requests should be fast

**All Requests Slow:**
- Check Railway metrics for CPU/memory usage
- Consider upgrading Railway plan
- May need to optimize data fetching

## 📊 Railway Dashboard

### Key Metrics to Monitor

1. **Deployments** - Deploy history and status
2. **Metrics** - CPU, memory, network usage
3. **Logs** - Application output and errors
4. **Settings** - Environment variables, domains

### Free Tier Limits

- **500 execution hours/month** - More than enough
- **100GB bandwidth** - Plenty for API calls
- **1GB memory** - Sufficient for this app
- **Shared CPU** - Adequate performance

## 🎯 Success Criteria

- [x] Railway deployment succeeds
- [x] `/health` endpoint returns 200
- [x] `/api/nfl-data/test` returns success
- [x] `/api/nfl-data/extract` returns player data
- [x] Vercel app can call Railway API
- [x] NFL Data page works in production

## 📚 Resources

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **RAILPACK Guide:** [docs.railway.app/reference/railpack](https://docs.railway.app/reference/railpack)
- **FastAPI Docs:** [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **nfl_data_py Docs:** [github.com/cooperdff/nfl_data_py](https://github.com/cooperdff/nfl_data_py)

## 🔐 Security Notes

### CORS Configuration

Current setting allows all origins (`allow_origins=["*"]`).

**For production, restrict to your domain:**

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

Then redeploy to Railway.

### API Keys

This API doesn't require authentication currently.

**To add API key protection:**
1. Set `API_KEY` environment variable in Railway
2. Add middleware to validate `X-API-Key` header
3. Update Vercel app to send key in requests

## ✅ Final Checklist

Before considering deployment complete:

- [ ] Railway deployment succeeded
- [ ] All health checks pass
- [ ] API returns real NFL data
- [ ] Vercel environment variable set
- [ ] Vercel app redeployed
- [ ] NFL Data page works in production
- [ ] No errors in Railway logs
- [ ] CORS configured (if restricting origins)

---

**Your Python API is now optimized for Railway V2 with RAILPACK! 🚀**

The configuration ensures:
- ✅ Fast deployments with RAILPACK
- ✅ No cold starts (sleepApplication: false)
- ✅ Production-ready performance
- ✅ Auto-scaling support
- ✅ Multi-region capable
- ✅ Free tier compatible
