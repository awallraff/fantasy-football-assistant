import { NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'

/**
 * GET /api/cache/health
 *
 * Health check endpoint for the caching system.
 * Verifies database connectivity and returns cache system status.
 */
export async function GET() {
  const prisma = new PrismaClient()

  try {
    // Test database connection by querying for expired cache count
    const expiredCount = await prisma.nFLPlayerStats.count({
      where: {
        expiresAt: { lt: new Date() },
      },
    })

    // Get total cache size
    const totalCached = await prisma.nFLPlayerStats.count()

    // Get recent API calls (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentCalls = await prisma.aPICallLog.count({
      where: {
        timestamp: { gte: oneDayAgo },
      },
    })

    await prisma.$disconnect()

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        provider: 'postgresql',
      },
      cache: {
        totalRecords: totalCached,
        expiredRecords: expiredCount,
        healthPercentage:
          totalCached > 0
            ? ((totalCached - expiredCount) / totalCached) * 100
            : 100,
      },
      monitoring: {
        apiCallsLast24h: recentCalls,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    await prisma.$disconnect()

    console.error('[API] Cache health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
