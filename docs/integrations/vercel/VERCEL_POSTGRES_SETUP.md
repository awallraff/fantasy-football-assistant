# Vercel Postgres Setup Guide

This guide walks you through setting up Vercel Postgres for the Fantasy Football Assistant NFL data caching layer.

## Prerequisites

- Vercel account with access to your project
- Fantasy Football Assistant project deployed on Vercel
- Admin/Owner permissions on the Vercel project

## Step 1: Create Postgres Database

1. Navigate to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your Fantasy Football Assistant project
3. Click on the **Storage** tab in the project navigation
4. Click **Create Database**
5. Select **Postgres** as the database type
6. Configure the database:
   - **Database Name**: `fantasy-nfl-cache`
   - **Region**: Select the region closest to your primary users (recommend US East or US West)
   - **Plan**: Start with **Hobby** (free tier) - upgrade to **Pro** if you need:
     - More than 256 MB storage
     - More than 60 hours of compute per month
     - Connection pooling for serverless functions
7. Click **Create**

### Database Created ✅

You should now see `fantasy-nfl-cache` in your Storage tab.

## Step 2: Get Connection String

1. In the Storage tab, click on your `fantasy-nfl-cache` database
2. Navigate to the **Connect** tab
3. Under the **Prisma** section, you'll see the connection string

   Example format:
   ```
   postgres://username:password@host.postgres.vercel-storage.com:5432/fantasy-nfl-cache?sslmode=require&pgbouncer=true
   ```

4. Copy this connection string - you'll need it for the next steps

## Step 3: Configure Environment Variables

### Local Development (.env)

1. Open your `.env` file in the project root
2. Replace the placeholder `DATABASE_URL` with your actual connection string:

   ```env
   DATABASE_URL="postgres://username:password@host.postgres.vercel-storage.com:5432/fantasy-nfl-cache?sslmode=require&pgbouncer=true"
   ```

3. Save the file

**Important**: Never commit `.env` to Git - it's already in `.gitignore`

### Vercel Production Environment

1. In your Vercel project dashboard, navigate to **Settings**
2. Click on **Environment Variables**
3. Add a new environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Postgres connection string (from Step 2)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

### Vercel CLI (Optional)

You can also set environment variables via CLI:

```bash
vercel env add DATABASE_URL production
# Paste your connection string when prompted
```

## Step 4: Run Database Migrations

Once your connection string is configured, run the Prisma migration to create the database schema:

### Local Development

```bash
npx prisma migrate dev --name init
```

This will:
- Create the migration files in `prisma/migrations/`
- Apply the migration to your database
- Regenerate the Prisma Client

### Production (Vercel Deployment)

Migrations are automatically run during deployment via the build process. Ensure you have a `postinstall` script in `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

## Step 5: Verify Database Schema

Check that all tables were created successfully:

```bash
npx prisma studio
```

This opens a visual database browser at `http://localhost:5555` where you can:
- View all tables (NFLPlayerStats, NFLTeamStats, CacheInvalidation, APICallLog)
- Inspect the schema
- Manually query/edit data (useful for debugging)

## Database Schema Overview

The NFL data caching layer uses four main tables:

### NFLPlayerStats
Stores weekly and seasonal player statistics from nflreadpy.

**Key Fields**:
- `playerId`, `playerName`, `position`, `team`
- `season`, `week` (week is null for seasonal stats)
- Passing stats: yards, TDs, INTs, attempts, completions
- Rushing stats: yards, TDs, attempts
- Receiving stats: yards, TDs, receptions, targets
- Fantasy points: standard, PPR, half-PPR
- Cache metadata: `cachedAt`, `expiresAt`

**Indexes**:
- Unique constraint on `(playerId, season, week)`
- Index on `(playerId, season)` for seasonal queries
- Index on `cachedAt` and `expiresAt` for cache invalidation

### NFLTeamStats
Stores team-level statistics and metrics.

**Key Fields**:
- `team`, `season`, `week`
- Offensive stats: points, yards, passing/rushing yards, turnovers
- Defensive stats: points allowed, yards allowed, sacks, INTs, fumbles
- Cache metadata: `cachedAt`, `expiresAt`

**Indexes**:
- Unique constraint on `(team, season, week)`
- Index on `(team, season)` for seasonal queries

### CacheInvalidation
Tracks cache invalidation events for monitoring and debugging.

**Key Fields**:
- `cacheType`: "player" or "team"
- `reason`: "expired", "manual", "data_update"
- `recordCount`: Number of records invalidated
- `timestamp`

### APICallLog
Tracks Python script calls for performance monitoring.

**Key Fields**:
- `endpoint`: e.g., "nflreadpy.weekly_stats"
- `parameters`: JSON object with request parameters
- `success`: Boolean
- `responseTime`: Milliseconds
- `errorMessage`: Optional error details
- `timestamp`

## Troubleshooting

### Connection String Not Working

**Error**: `Can't reach database server`

**Solution**:
1. Verify the connection string format includes `?sslmode=require&pgbouncer=true`
2. Check that you copied the full string (including password)
3. Ensure your IP is not blocked (Vercel Postgres is accessible from anywhere by default)

### Migration Fails

**Error**: `Error: P3009 - Migration failed to apply cleanly to the shadow database`

**Solution**:
```bash
npx prisma migrate reset
npx prisma migrate dev --name init
```

**Warning**: This will delete all data in your database!

### Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npx prisma generate
```

### Environment Variables Not Loading in Vercel

**Error**: `PrismaClientInitializationError: Invalid DATABASE_URL`

**Solution**:
1. Verify environment variable is set in Vercel dashboard
2. Redeploy your application after adding the variable
3. Check that the variable is set for the correct environment (production/preview)

## Performance Optimization

### Connection Pooling

Vercel Postgres includes connection pooling via PgBouncer. The connection string already includes `?pgbouncer=true`.

**Best Practices**:
- Use connection pooling in production (already configured)
- Set appropriate connection limits in Prisma schema (default: 5 connections)
- Close database connections after each serverless function execution

### Query Optimization

- Use indexes for frequently queried fields (already configured in schema)
- Use `select` to fetch only needed fields
- Batch queries when possible using `findMany` with filters

## Monitoring

### Vercel Dashboard

Monitor your database usage in the Vercel Dashboard:
1. Navigate to Storage > fantasy-nfl-cache
2. View the **Analytics** tab for:
   - Storage usage
   - Query performance
   - Connection count
   - Error rates

### Prisma Studio

Run `npx prisma studio` to:
- View cache hit rates via APICallLog
- Monitor cache invalidation patterns
- Debug data inconsistencies

## Next Steps

After completing the database setup:

1. **Implement the Caching Service Layer** (TASK-043)
   - Create `lib/nfl-data-cache-service.ts`
   - Implement cache-first data fetching
   - Add TTL-based expiration

2. **Add Cache Invalidation Logic** (TASK-044)
   - Implement automatic expiration
   - Add manual invalidation endpoints
   - Log invalidation events

3. **Update NFL Data API** (TASK-045)
   - Modify `app/api/nfl-data/route.ts` to use cache
   - Fall back to Python scripts on cache miss
   - Populate cache on successful fetch

## Additional Resources

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [PgBouncer Guide](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management/configure-pg-bouncer)

## Support

If you encounter issues not covered in this guide:
1. Check the [Vercel Postgres Troubleshooting Guide](https://vercel.com/docs/storage/vercel-postgres/troubleshooting)
2. Review [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
3. Open an issue in the project repository
