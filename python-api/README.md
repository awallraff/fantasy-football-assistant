# NFL Data API Service

FastAPI service that wraps `nfl_data_py` for deployment on Railway/Render.

## Features

- ✅ RESTful API for NFL data
- ✅ Compatible with Railway and Render deployments
- ✅ CORS enabled for Vercel integration
- ✅ Health check endpoints
- ✅ Comprehensive error handling

## Endpoints

### `GET /`
Health check and service info

### `GET /health`
Simple health check for Railway/Render

### `GET /api/nfl-data/test`
Test connection to nfl_data_py library

**Response:**
```json
{
  "success": true,
  "message": "Connection successful. Found 50 QB records.",
  "timestamp": "2025-01-09T..."
}
```

### `GET /api/nfl-data/extract`
Extract NFL player data

**Query Parameters:**
- `years` (required): Comma-separated years (e.g., "2023,2024")
- `positions` (optional): Comma-separated positions (default: "QB,RB,WR,TE")
- `week` (optional): Specific week number

**Example:**
```
GET /api/nfl-data/extract?years=2024&positions=QB,RB&week=1
```

**Response:**
```json
{
  "weekly_stats": [...],
  "seasonal_stats": [...],
  "aggregated_season_stats": [...],
  "player_info": [...],
  "team_analytics": [...],
  "metadata": {
    "years": [2024],
    "positions": ["QB", "RB"],
    "week": 1,
    "total_players": 150
  }
}
```

## Local Development

### Install Dependencies

```bash
cd python-api
pip install -r requirements.txt
```

### Run Server

```bash
uvicorn main:app --reload
```

Server runs on `http://localhost:8000`

View API docs at `http://localhost:8000/docs`

## Deployment

### Railway

1. **Create New Project**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Set root directory to `/python-api`

2. **Configure Environment** (optional)
   - Railway auto-detects Python and installs dependencies
   - No environment variables needed

3. **Deploy**
   - Railway will automatically deploy
   - Copy the generated URL (e.g., `https://your-app.up.railway.app`)

### Render

1. **Create New Web Service**
   - Go to [Render](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Root Directory**: `python-api`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Deploy**
   - Render will build and deploy
   - Copy the generated URL (e.g., `https://your-app.onrender.com`)

## Integration with Next.js App

After deployment, update your Next.js environment variables:

```env
# .env.local
NFL_DATA_API_URL=https://your-app.up.railway.app
```

Then update `lib/nfl-data-service.ts` to use the external API instead of spawning Python processes.

## CORS Configuration

By default, CORS is open (`allow_origins=["*"]`).

**For production**, restrict to your Vercel domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",
        "http://localhost:3000"  # for local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Cost

- **Railway**: Free tier includes 500 hours/month (plenty for this use case)
- **Render**: Free tier available (sleeps after 15 min of inactivity)

## Monitoring

Both Railway and Render provide:
- Deployment logs
- Application logs
- Metrics and analytics
- Automatic SSL certificates

## Troubleshooting

**Import Error:**
```
ModuleNotFoundError: No module named 'nfl_data_py'
```
Solution: Ensure `requirements.txt` is in the root directory and includes `nfl-data-py`

**Port Binding Error:**
```
Address already in use
```
Solution: Railway/Render set `$PORT` automatically. Use `--port $PORT` in start command.
