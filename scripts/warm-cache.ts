#!/usr/bin/env tsx
/**
 * Cache Warming Script
 *
 * Pre-populates the NFL data cache with common queries to improve performance.
 * Run this script after deployments or when the cache is cleared.
 *
 * Usage:
 *   npm run warm-cache                          # Warm current season, all positions
 *   npm run warm-cache -- --years 2023,2024     # Warm specific years
 *   npm run warm-cache -- --positions QB,RB     # Warm specific positions
 *   npm run warm-cache -- --help                # Show help
 */

import nflDataCacheService from '../lib/nfl-data-cache-service'

interface WarmCacheOptions {
  years?: number[]
  positions?: string[]
  verbose?: boolean
}

const DEFAULT_POSITIONS = ['QB', 'RB', 'WR', 'TE']

function parseArgs(): WarmCacheOptions {
  const args = process.argv.slice(2)
  const options: WarmCacheOptions = {
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--years':
      case '-y':
        const yearsArg = args[++i]
        if (yearsArg) {
          options.years = yearsArg.split(',').map((y) => parseInt(y.trim())).filter((y) => !isNaN(y))
        }
        break

      case '--positions':
      case '-p':
        const positionsArg = args[++i]
        if (positionsArg) {
          options.positions = positionsArg.split(',').map((p) => p.trim().toUpperCase())
        }
        break

      case '--verbose':
      case '-v':
        options.verbose = true
        break

      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
        break

      default:
        console.error(`Unknown argument: ${arg}`)
        printHelp()
        process.exit(1)
    }
  }

  return options
}

function printHelp() {
  console.log(`
Cache Warming Script
Pre-populates the NFL data cache with common queries.

Usage:
  npm run warm-cache [options]

Options:
  --years, -y <years>         Comma-separated list of years (e.g., 2023,2024,2025)
                              Default: Current NFL season

  --positions, -p <positions> Comma-separated list of positions (e.g., QB,RB,WR,TE)
                              Default: QB,RB,WR,TE

  --verbose, -v               Enable verbose logging

  --help, -h                  Show this help message

Examples:
  # Warm current season with all positions
  npm run warm-cache

  # Warm last 3 seasons
  npm run warm-cache -- --years 2023,2024,2025

  # Warm only QBs and RBs for 2024
  npm run warm-cache -- --years 2024 --positions QB,RB

  # Verbose output
  npm run warm-cache -- --verbose
`)
}

function getCurrentNFLSeason(): number {
  const now = new Date()
  // NFL season starts in September
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
}

async function warmCache(options: WarmCacheOptions) {
  const years = options.years || [getCurrentNFLSeason()]
  const positions = options.positions || DEFAULT_POSITIONS
  const verbose = options.verbose || false

  console.log('🔥 Starting cache warming...\n')
  console.log(`Years: ${years.join(', ')}`)
  console.log(`Positions: ${positions.join(', ')}\n`)

  const startTime = Date.now()

  try {
    if (verbose) {
      console.log('[Verbose] Calling nflDataCacheService.warmCache()')
    }

    await nflDataCacheService.warmCache(years, positions)

    const duration = Date.now() - startTime
    const durationSeconds = (duration / 1000).toFixed(2)

    console.log('\n✅ Cache warming completed successfully!')
    console.log(`⏱️  Duration: ${durationSeconds}s`)
    console.log(`📊 Warmed ${years.length} season(s) × ${positions.length} position(s) = ${years.length * positions.length} combinations`)

    // Get cache stats
    if (verbose) {
      console.log('\n[Verbose] Fetching cache statistics...')
      const stats = await nflDataCacheService.getCacheStats()
      console.log('\n📈 Cache Statistics:')
      console.log(`   Total Calls: ${stats.totalCalls}`)
      console.log(`   Cache Hits: ${stats.hits}`)
      console.log(`   Cache Misses: ${stats.misses}`)
      console.log(`   Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`)
      console.log(`   Avg Response Time: ${stats.avgResponseTime.toFixed(2)}ms`)
    }

    await nflDataCacheService.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Cache warming failed!')
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')

    if (verbose && error instanceof Error) {
      console.error('\n[Verbose] Stack trace:')
      console.error(error.stack)
    }

    await nflDataCacheService.disconnect()
    process.exit(1)
  }
}

// Main execution
const options = parseArgs()
warmCache(options)
