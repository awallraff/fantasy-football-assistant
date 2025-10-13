"use client"

/**
 * Dynasty Status Indicator Demo Page
 *
 * Showcases all dynasty status indicator variants and sizes
 * for testing and documentation purposes.
 */

import { DynastyStatusIndicator } from '@/components/dynasty/dynasty-status-indicator'
import { DynastyStatus } from '@/lib/dynasty/dynasty-status-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DynastyStatusDemoPage() {
  const allStatuses = [
    DynastyStatus.BREAKOUT,
    DynastyStatus.DECLINING,
    DynastyStatus.STABLE,
    DynastyStatus.ROOKIE,
    DynastyStatus.VETERAN,
  ]

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dynasty Status Indicators</h1>
        <p className="text-muted-foreground">
          Visual indicators for dynasty-specific player evaluation. Following WCAG 2.1 AA
          guidelines with icon + color (never color alone).
        </p>
      </div>

      {/* Icon Only Variant */}
      <Card>
        <CardHeader>
          <CardTitle>Icon Only (Default)</CardTitle>
          <CardDescription>Compact display with tooltip on hover</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Small Size */}
          <div>
            <h3 className="text-sm font-medium mb-2">Small (sm)</h3>
            <div className="flex gap-4">
              {allStatuses.map((status) => (
                <DynastyStatusIndicator key={status} status={status} size="sm" />
              ))}
            </div>
          </div>

          {/* Medium Size */}
          <div>
            <h3 className="text-sm font-medium mb-2">Medium (md) - Default</h3>
            <div className="flex gap-4">
              {allStatuses.map((status) => (
                <DynastyStatusIndicator key={status} status={status} size="md" />
              ))}
            </div>
          </div>

          {/* Large Size */}
          <div>
            <h3 className="text-sm font-medium mb-2">Large (lg)</h3>
            <div className="flex gap-4">
              {allStatuses.map((status) => (
                <DynastyStatusIndicator key={status} status={status} size="lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Icon with Label Variant */}
      <Card>
        <CardHeader>
          <CardTitle>Icon with Label</CardTitle>
          <CardDescription>Explicit label for clarity in detailed views</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {allStatuses.map((status) => (
              <DynastyStatusIndicator
                key={status}
                status={status}
                variant="icon-with-label"
                size="md"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Badge Variant */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Variant</CardTitle>
          <CardDescription>Pill-shaped badge with background color</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Small Badge */}
          <div>
            <h3 className="text-sm font-medium mb-2">Small</h3>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((status) => (
                <DynastyStatusIndicator
                  key={status}
                  status={status}
                  variant="badge"
                  size="sm"
                />
              ))}
            </div>
          </div>

          {/* Medium Badge */}
          <div>
            <h3 className="text-sm font-medium mb-2">Medium</h3>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((status) => (
                <DynastyStatusIndicator
                  key={status}
                  status={status}
                  variant="badge"
                  size="md"
                />
              ))}
            </div>
          </div>

          {/* Large Badge */}
          <div>
            <h3 className="text-sm font-medium mb-2">Large</h3>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((status) => (
                <DynastyStatusIndicator
                  key={status}
                  status={status}
                  variant="badge"
                  size="lg"
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Status Definitions</CardTitle>
          <CardDescription>What each indicator means</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex items-start gap-3">
              <DynastyStatusIndicator status={DynastyStatus.BREAKOUT} variant="badge" />
              <div>
                <dt className="font-medium text-success">Breakout Candidate</dt>
                <dd className="text-sm text-muted-foreground">
                  Player showing signs of breaking out with strong upward trajectory in
                  performance, targets, or opportunity.
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DynastyStatusIndicator status={DynastyStatus.DECLINING} variant="badge" />
              <div>
                <dt className="font-medium text-destructive">Declining Asset</dt>
                <dd className="text-sm text-muted-foreground">
                  Player's dynasty value declining due to age, decreased production, or loss of
                  role/opportunity.
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DynastyStatusIndicator status={DynastyStatus.STABLE} variant="badge" />
              <div>
                <dt className="font-medium text-warning">Stable Hold</dt>
                <dd className="text-sm text-muted-foreground">
                  Player maintaining consistent dynasty value without significant upward or
                  downward trends.
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DynastyStatusIndicator status={DynastyStatus.ROOKIE} variant="badge" />
              <div>
                <dt className="font-medium text-accent">Rookie</dt>
                <dd className="text-sm text-muted-foreground">
                  Player in first NFL season. High upside potential but unproven at NFL level.
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DynastyStatusIndicator status={DynastyStatus.VETERAN} variant="badge" />
              <div>
                <dt className="font-medium text-muted-foreground">Veteran</dt>
                <dd className="text-sm text-muted-foreground">
                  Experienced player with 5+ years in the NFL. Proven track record but age
                  considerations for dynasty.
                </dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Accessibility Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Icon + Color:</strong> Never relies on color alone (WCAG 2.1 AA compliant)
            </li>
            <li>
              <strong>ARIA Labels:</strong> Each indicator includes descriptive aria-label for
              screen readers
            </li>
            <li>
              <strong>Tooltips:</strong> Hover/focus reveals full description of the status
            </li>
            <li>
              <strong>Touch Targets:</strong> All sizes meet minimum 44x44px touch target
              guidelines
            </li>
            <li>
              <strong>Contrast Ratios:</strong> All text colors meet 4.5:1 contrast requirement
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
