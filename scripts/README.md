# Scripts Directory

Utility scripts for the Fantasy Football Assistant project.

## Cache Warming Script

Pre-populates the NFL data cache with common queries to improve performance.

### Usage

```bash
# Warm current season with all positions (QB, RB, WR, TE)
npm run warm-cache

# Warm specific years
npm run warm-cache -- --years 2023,2024,2025

# Warm specific positions
npm run warm-cache -- --years 2024 --positions QB,RB

# Verbose output
npm run warm-cache -- --verbose

# Show help
npm run warm-cache -- --help
```

### When to Use

- **After deployment**: Warm the cache to ensure fast initial response times
- **After cache clearing**: Re-populate the cache after manual invalidation
- **Scheduled maintenance**: Run daily/weekly to keep cache fresh
- **Before high traffic**: Pre-warm cache before expected usage spikes

### Options

- `--years, -y <years>` - Comma-separated list of years (e.g., 2023,2024,2025)
  - Default: Current NFL season
- `--positions, -p <positions>` - Comma-separated list of positions (e.g., QB,RB,WR,TE)
  - Default: QB,RB,WR,TE
- `--verbose, -v` - Enable verbose logging
- `--help, -h` - Show help message

### Examples

```bash
# Basic usage - warm current season
npm run warm-cache

# Warm last 3 seasons (comprehensive)
npm run warm-cache -- --years 2023,2024,2025

# Warm only skill positions for 2024
npm run warm-cache -- --years 2024 --positions QB,RB,WR,TE

# Warm with detailed logging
npm run warm-cache -- --years 2024 --verbose
```

### Performance

Warming the cache can take several minutes depending on the amount of data:

- **Single season, all positions**: ~2-5 minutes
- **Three seasons, all positions**: ~10-15 minutes
- **Single position, single season**: ~30-60 seconds

The script will display progress and completion statistics.

### Output Example

```
🔥 Starting cache warming...

Years: 2024
Positions: QB, RB, WR, TE

[Cache] Warming cache for years: [ 2024 ] positions: [ 'QB', 'RB', 'WR', 'TE' ]
[Cache] Cache miss for options: { years: [ 2024 ], positions: [ 'QB' ] }
[Cache] Cached 150 records
...

✅ Cache warming completed successfully!
⏱️  Duration: 145.32s
📊 Warmed 1 season(s) × 4 position(s) = 4 combinations
```

### Integration with CI/CD

You can add cache warming to your deployment pipeline:

**.github/workflows/deploy.yml**:
```yaml
- name: Warm Cache
  run: npm run warm-cache -- --years 2024,2025
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Vercel (via API)**:
```bash
# Call the warming endpoint after deployment
curl -X POST https://your-app.vercel.app/api/cache/warm \
  -H "Content-Type: application/json" \
  -d '{"years": [2024, 2025], "positions": ["QB", "RB", "WR", "TE"]}'
```

## Future Scripts

Additional utility scripts may be added:

- `migrate-data.ts` - Data migration utilities
- `analyze-cache.ts` - Cache performance analysis
- `cleanup-old-data.ts` - Remove outdated cache entries
