# Bark Push Notifications Setup Guide

**Created:** 2025-10-11
**Status:** Configured
**MCP Server:** bark-mcp-server

---

## Overview

The Fantasy Football Assistant now supports push notifications to iOS devices via the Bark app through the Model Context Protocol (MCP). This enables real-time alerts for:
- Trade proposals and acceptances
- Waiver wire activity
- Player injury updates
- Draft reminders
- Weekly lineup deadlines
- Significant player value changes

---

## Prerequisites

### 1. Install Bark iOS App
- Download from App Store: [Bark - Push Notifications](https://apps.apple.com/app/bark-customed-notifications/id1403753865)
- Open the app and note your **Device Key** displayed on the main screen
- Example device key format: `xxxxxxxxxxxxx`

### 2. Configure Environment Variable
The Bark MCP server requires your device key to send notifications.

**Option A: Update Global Claude Config**
Edit `C:\Users\Adamw\.claude.json`:
```json
{
  "mcpServers": {
    "bark": {
      "command": "npx",
      "args": ["-y", "@metrovoc/bark-mcp-server"],
      "env": {
        "BARK_KEY": "your_actual_device_key_here",
        "BARK_SERVER_URL": "https://api.day.app"
      }
    }
  }
}
```

**Option B: Use Custom Bark Server (Self-hosted)**
If you're running your own Bark server:
```json
{
  "mcpServers": {
    "bark": {
      "command": "npx",
      "args": ["-y", "@metrovoc/bark-mcp-server"],
      "env": {
        "BARK_KEY": "your_device_key",
        "BARK_SERVER_URL": "https://your-bark-server.com"
      }
    }
  }
}
```

---

## Available MCP Tools

Once configured, Claude Code has access to these notification tools:

### 1. `mcp__bark__send_bark_notification`
Send a single push notification to your iOS device.

**Parameters:**
```typescript
{
  body: string          // Notification message (required)
  title?: string        // Notification title (optional)
  level?: string        // Priority: 'critical', 'timeSensitive', 'active', 'passive'
  url?: string          // URL to open when tapped (optional)
  group?: string        // Group notifications together (optional)
  icon?: string         // Custom icon URL (optional)
  sound?: string        // Custom sound name (optional)
  isArchive?: boolean   // Archive notification (default: false)
  autoCopy?: boolean    // Auto-copy to clipboard (default: false)
  copy?: string         // Text to copy when tapped (optional)
}
```

**Example Usage:**
```typescript
// Critical alert for trade proposal
await mcp__bark__send_bark_notification({
  title: "Trade Proposal Received",
  body: "Josh Allen for Justin Jefferson + 2025 1st",
  level: "timeSensitive",
  url: "https://dynastyff.vercel.app/trades",
  group: "trades"
})

// Passive notification for player update
await mcp__bark__send_bark_notification({
  body: "Christian McCaffrey injury status: Questionable",
  level: "passive",
  group: "injuries"
})
```

### 2. `mcp__bark__send_bark_batch_notifications`
Send multiple notifications at once (useful for weekly summaries).

**Parameters:**
```typescript
{
  notifications: Array<{
    body: string
    title?: string
    level?: string
    // ... other parameters from single notification
  }>
}
```

**Example Usage:**
```typescript
// Weekly summary notifications
await mcp__bark__send_bark_batch_notifications({
  notifications: [
    {
      title: "Lineup Deadline",
      body: "Set your Week 12 lineup by Sunday 1PM ET",
      level: "timeSensitive"
    },
    {
      title: "Waiver Priority",
      body: "You have waiver priority #3 this week",
      level: "active"
    },
    {
      title: "Dynasty Value Change",
      body: "Your roster value increased by 8% this week",
      level: "passive"
    }
  ]
})
```

---

## Notification Levels

Choose the appropriate level based on urgency:

| Level | Use Case | Example |
|-------|----------|---------|
| **critical** | Urgent issues requiring immediate attention | "Your starting QB is ruled OUT 30 mins before game!" |
| **timeSensitive** | Important updates that need timely action | "Trade proposal expires in 1 hour" |
| **active** | General notifications worth knowing | "Weekly rankings updated" |
| **passive** | Low-priority informational updates | "Player gained 2 points in dynasty value" |

---

## Use Cases for Fantasy Football

### Real-Time Trade Alerts
```typescript
// When a trade is proposed to you
mcp__bark__send_bark_notification({
  title: "🤝 Trade Proposal",
  body: "Receive: Breece Hall\nGive: Ja'Marr Chase + 2025 2nd",
  level: "timeSensitive",
  url: "https://dynastyff.vercel.app/trades/12345",
  group: "trades"
})

// When a trade is accepted
mcp__bark__send_bark_notification({
  title: "✅ Trade Accepted",
  body: "Your trade for Breece Hall has been accepted!",
  level: "active",
  group: "trades"
})
```

### Waiver Wire Notifications
```typescript
// When your waiver claim processes
mcp__bark__send_bark_notification({
  title: "📋 Waiver Claim Successful",
  body: "You acquired Rashee Rice (Dropped: Rondale Moore)",
  level: "active",
  group: "waivers"
})

// When someone claims a player you were watching
mcp__bark__send_bark_notification({
  title: "👀 Watch List Player Claimed",
  body: "Tank Dell was claimed by Team Dynasty Kings",
  level: "passive",
  group: "waivers"
})
```

### Draft Reminders
```typescript
// Rookie draft starting soon
mcp__bark__send_bark_notification({
  title: "🏈 Rookie Draft Starting",
  body: "Dynasty League rookie draft starts in 15 minutes. You pick at 1.06.",
  level: "timeSensitive",
  url: "https://dynastyff.vercel.app/rookie-draft",
  group: "draft"
})

// Your pick is up
mcp__bark__send_bark_notification({
  title: "⏰ Your Pick Is Up!",
  body: "You're on the clock at pick 1.06. Make your selection.",
  level: "critical",
  group: "draft"
})
```

### Player Value Changes
```typescript
// Significant dynasty value increase
mcp__bark__send_bark_notification({
  title: "📈 Player Value Spike",
  body: "Marvin Harrison Jr. value up 15% after 3-TD game",
  level: "active",
  group: "player-values"
})

// Age curve alert
mcp__bark__send_bark_notification({
  title: "⚠️ Age Curve Alert",
  body: "Derrick Henry entering decline phase. Consider selling.",
  level: "timeSensitive",
  group: "dynasty-alerts"
})
```

### Weekly Lineup Reminders
```typescript
// Lineup deadline approaching
mcp__bark__send_bark_notification({
  title: "⏰ Lineup Deadline",
  body: "Set your Week 12 lineup. Deadline: Sunday 1:00 PM ET (2 hours)",
  level: "timeSensitive",
  url: "https://dynastyff.vercel.app/dashboard",
  group: "lineup"
})
```

### Injury Updates
```typescript
// Critical injury to your player
mcp__bark__send_bark_notification({
  title: "🚨 Injury Alert",
  body: "Christian McCaffrey (Your RB1) ruled OUT for Week 12",
  level: "critical",
  group: "injuries"
})
```

---

## Integration with App Features

### Automated Notifications

The app can be enhanced to send notifications automatically:

**Location:** `lib/notifications/bark-service.ts` (to be created)

```typescript
import { env } from '@/lib/env'

interface BarkNotification {
  title?: string
  body: string
  level?: 'critical' | 'timeSensitive' | 'active' | 'passive'
  url?: string
  group?: string
}

export class BarkNotificationService {
  private async sendNotification(notification: BarkNotification) {
    // This will be called by Claude Code MCP tool
    // For now, notifications are sent manually via Claude
    console.log('Notification queued:', notification)
  }

  async notifyTradeProposal(trade: Trade) {
    await this.sendNotification({
      title: "🤝 Trade Proposal",
      body: `Receive: ${trade.receiveAssets}\nGive: ${trade.giveAssets}`,
      level: "timeSensitive",
      url: `https://dynastyff.vercel.app/trades/${trade.id}`,
      group: "trades"
    })
  }

  async notifyLineupDeadline(hoursRemaining: number) {
    const level = hoursRemaining < 3 ? "critical" : "timeSensitive"
    await this.sendNotification({
      title: "⏰ Lineup Deadline",
      body: `Set your lineup. Deadline in ${hoursRemaining} hours.`,
      level,
      url: "https://dynastyff.vercel.app/dashboard",
      group: "lineup"
    })
  }

  async notifyPlayerValueChange(player: string, change: number) {
    if (Math.abs(change) < 10) return // Only notify for significant changes

    const emoji = change > 0 ? "📈" : "📉"
    const direction = change > 0 ? "up" : "down"

    await this.sendNotification({
      title: `${emoji} Player Value Alert`,
      body: `${player} dynasty value ${direction} ${Math.abs(change)}%`,
      level: "active",
      group: "player-values"
    })
  }
}
```

---

## Testing Your Setup

### 1. Verify Configuration
Restart Claude Code after updating the configuration file.

### 2. Test Notification
Ask Claude Code to send a test notification:
```
Claude, send me a test Bark notification to verify the setup is working.
```

Claude will use:
```typescript
mcp__bark__send_bark_notification({
  title: "✅ Test Notification",
  body: "Bark push notifications are configured correctly!",
  level: "active"
})
```

### 3. Check Your iPhone
You should receive the notification within a few seconds.

---

## Troubleshooting

### Issue: "BARK_KEY environment variable not set"
**Solution:** Update `C:\Users\Adamw\.claude.json` with your actual device key (see Configuration section above).

### Issue: "Notification not received"
**Possible causes:**
1. Bark app not installed on iPhone
2. Incorrect device key in configuration
3. iPhone notifications disabled for Bark
4. Network connectivity issues

**Debugging steps:**
1. Verify device key copied correctly from Bark app
2. Check iPhone Settings → Notifications → Bark (ensure enabled)
3. Restart Claude Code after config changes
4. Test with a simple notification first

### Issue: "Custom Bark server not working"
**Solution:** Ensure `BARK_SERVER_URL` in config points to your server with correct protocol (https://).

---

## Privacy & Security

### Data Transmission
- Notifications are sent via HTTPS to Bark servers (default: api.day.app)
- No persistent storage of notification content
- Device key is stored locally in Claude config

### Best Practices
1. **Don't share your device key** - It allows anyone to send you notifications
2. **Use groups** to organize notifications by category
3. **Set appropriate levels** - Avoid notification fatigue with too many critical alerts
4. **Review Bark app settings** - Configure DND schedules, notification sounds

### Self-Hosted Option
For maximum privacy, run your own Bark server:
- GitHub: https://github.com/Finb/Bark
- Docker support available
- Update `BARK_SERVER_URL` in config to point to your instance

---

## Future Enhancements

Planned features for notification integration:

### Sprint 4 - Notification System Integration
- [ ] **TASK-040:** Bark Service Layer [6h]
  - File: `lib/notifications/bark-service.ts`
  - Create service wrapper for Bark MCP tools
  - Type-safe notification interfaces

- [ ] **TASK-041:** Automated Trade Notifications [4h]
  - Trigger: When trade proposal received/accepted
  - Integration: `lib/sleeper-api.ts` webhooks

- [ ] **TASK-042:** Weekly Lineup Reminders [3h]
  - Cron job: Check lineup status Sunday mornings
  - Notification: 3 hours before deadline

- [ ] **TASK-043:** Player Value Change Alerts [5h]
  - Monitor: Dynasty value calculations daily
  - Threshold: Alert on >10% value changes

- [ ] **TASK-044:** Notification Preferences UI [8h]
  - Page: `app/settings/notifications/page.tsx`
  - Configure: Which alerts to receive, frequency, levels

**Total Effort:** 26 hours

---

## Resources

- **Bark iOS App:** https://apps.apple.com/app/bark-customed-notifications/id1403753865
- **Bark GitHub:** https://github.com/Finb/Bark
- **Bark MCP Server:** https://github.com/metrovoc/bark-mcp-server
- **MCP Documentation:** https://modelcontextprotocol.io/

---

## Quick Reference

### Send Test Notification
```
Claude, send me a Bark notification with title "Test" and body "It works!"
```

### Common Notification Commands
```
Claude, notify me when the build completes
Claude, send a critical alert that my lineup isn't set
Claude, push a notification about the trade I just analyzed
```

---

**Document Owner:** Development Team
**Last Updated:** 2025-10-11
**Configuration Status:** ✅ MCP Server Added (Device key needs to be set)
