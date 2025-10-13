# Visual Density Examples - Before/After

This document provides visual code comparisons showing the transformation from current spacing to compact, information-dense layouts.

---

## Example 1: Dashboard Page Header

### BEFORE (Current - Spacious)

```tsx
<div className="container mx-auto px-4 py-8">
  <div className="text-center mb-8">
    <h1 className="text-ios-title-1 font-bold text-foreground mb-2">
      Welcome back, {user.display_name || user.username}!
    </h1>
    <p className="text-ios-body text-text-secondary">
      Select a league to view detailed analytics and insights
    </p>
  </div>
</div>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│                                     │  ← 32px padding top
│     Welcome back, John Doe!         │
│                                     │  ← 8px margin bottom
│   Select a league to view detailed  │
│   analytics and insights            │
│                                     │  ← 32px margin bottom
│                                     │
│  [League Cards Start Here...]       │
│                                     │
└─────────────────────────────────────┘
Total vertical space: ~110px
```

---

### AFTER (Compact)

```tsx
<div className="container mx-auto px-4 py-4 md:py-6">
  <div className="text-center mb-4 md:mb-6">
    <h1 className="text-ios-title-1 font-bold text-foreground mb-1">
      Welcome back, {user.display_name || user.username}!
    </h1>
    <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
      <BarChart3 className="h-4 w-4" />
      <span>Select league for analytics</span>
    </div>
  </div>
</div>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│                                     │  ← 16px padding top
│     Welcome back, John Doe!         │
│     📊 Select league for analytics  │
│                                     │  ← 16px margin bottom
│  [League Cards Start Here...]       │
│                                     │
└─────────────────────────────────────┘
Total vertical space: ~70px
```

**Savings:** 40px (36% reduction)

---

## Example 2: Stats Cards Grid

### BEFORE (Current - Spacious)

```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
  <Card className="overflow-hidden">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center space-x-2 min-w-0">
          <BarChart3 className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-2xl font-bold">{userRankingSystems.length}</p>
            <p className="text-sm text-muted-foreground truncate">User Imported</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
  {/* ... 2 more cards */}
</div>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │        24px padding top       │  │
│  │  📊  25                       │  │
│  │      User Imported            │  │
│  │        24px padding bottom    │  │
│  └───────────────────────────────┘  │
│              12px gap                │
│  ┌───────────────────────────────┐  │
│  │        24px padding top       │  │
│  │  📈  0                        │  │
│  │      External APIs            │  │
│  │        24px padding bottom    │  │
│  └───────────────────────────────┘  │
│              12px gap                │
│  ┌───────────────────────────────┐  │
│  │        24px padding top       │  │
│  │  🧠  150                      │  │
│  │      Filtered Players         │  │
│  │        24px padding bottom    │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
Total vertical space: ~270px (stacked)
```

---

### AFTER (Compact)

```tsx
<div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
  <Card className="overflow-hidden">
    <CardContent className="pt-4 pb-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <p className="text-xl font-bold">{userRankingSystems.length}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">
          Imported
        </p>
      </div>
    </CardContent>
  </Card>
  {/* ... 2 more cards */}
</div>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │ 16px│  │ 16px│  │ 16px│         │  ← Padding top
│  │ [📊]│  │ [📈]│  │ [🧠]│         │  ← Icon in background
│  │  25 │  │  0  │  │ 150 │         │  ← Large number
│  │Impor│  │APIs │  │Filtr│         │  ← Abbreviated label
│  │ 16px│  │ 16px│  │ 16px│         │  ← Padding bottom
│  └─────┘  └─────┘  └─────┘         │
│     ↕ 8px gap between cards         │
└─────────────────────────────────────┘
Total vertical space: ~110px (3-column)
```

**Savings:** 160px (59% reduction)

**Additional Benefits:**
- All 3 cards visible without horizontal scroll
- Icon backgrounds improve visual hierarchy
- Abbreviated labels reduce cognitive load

---

## Example 3: Dashboard Tabs (Mobile)

### BEFORE (Current - Text Only)

```tsx
<TabsList className="grid w-full grid-cols-2 md:grid-cols-4 min-h-[44px]">
  <TabsTrigger value="overview" className="min-h-[44px]">
    Overview
  </TabsTrigger>
  <TabsTrigger value="teams" className="min-h-[44px]">
    Teams
  </TabsTrigger>
  <TabsTrigger value="standings" className="min-h-[44px]">
    Standings
  </TabsTrigger>
  <TabsTrigger value="activity" className="min-h-[44px]">
    Activity
  </TabsTrigger>
</TabsList>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  ┌────────────┬────────────┐        │
│  │  Overview  │   Teams    │        │  ← Row 1 (44px tall)
│  └────────────┴────────────┘        │
│  ┌────────────┬────────────┐        │
│  │ Standings  │  Activity  │        │  ← Row 2 (44px tall)
│  └────────────┴────────────┘        │
└─────────────────────────────────────┘
Total height: 88px (2 rows)
```

**Issue:** 2-row layout wastes vertical space, requires eye travel

---

### AFTER (Compact - Icon + Text)

```tsx
<TabsList className="grid w-full grid-cols-4 min-h-[44px] gap-1">
  <TabsTrigger value="overview" className="min-h-[44px] px-2">
    <BarChart3 className="h-5 w-5 md:mr-2" />
    <span className="hidden md:inline">Overview</span>
    <span className="sr-only md:hidden">Overview</span>
  </TabsTrigger>
  <TabsTrigger value="teams" className="min-h-[44px] px-2">
    <Users className="h-5 w-5 md:mr-2" />
    <span className="hidden md:inline">Teams</span>
    <span className="sr-only md:hidden">Teams</span>
  </TabsTrigger>
  <TabsTrigger value="standings" className="min-h-[44px] px-2">
    <Trophy className="h-5 w-5 md:mr-2" />
    <span className="hidden md:inline">Standings</span>
    <span className="sr-only md:hidden">Standings</span>
  </TabsTrigger>
  <TabsTrigger value="activity" className="min-h-[44px] px-2">
    <Activity className="h-5 w-5 md:mr-2" />
    <span className="hidden md:inline">Activity</span>
    <span className="sr-only md:hidden">Activity</span>
  </TabsTrigger>
</TabsList>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  ┌───┬───┬───┬───┐                  │
│  │📊 │👥 │🏆 │📡 │                  │  ← Single row (44px)
│  └───┴───┴───┴───┘                  │
└─────────────────────────────────────┘
Total height: 44px (1 row)
```

**Savings:** 44px (50% reduction)

**Additional Benefits:**
- Single row layout improves scannability
- Icons communicate meaning faster
- Desktop shows full text labels
- Maintains accessibility with sr-only

---

## Example 4: Player Card (Roster)

### BEFORE (Current - Verbose)

```tsx
<div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
  <div className="flex items-center gap-3">
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className="font-medium">Christian McCaffrey</span>
        <Badge variant="outline" className="text-xs">RB</Badge>
        <Badge variant="secondary" className="text-xs">SF</Badge>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="default" className="text-xs">Healthy</Badge>
      </div>
    </div>
  </div>

  <div className="flex items-center gap-2">
    <div className="text-right">
      <div className="flex items-center gap-1 mb-1">
        <TrendingUp className="h-3 w-3 text-blue-500" />
        <span className="text-sm font-medium text-blue-600">
          18.5 pts
        </span>
      </div>
      <div className="text-sm font-medium">Starter</div>
    </div>
  </div>
</div>
```

**Visual Layout (Mobile 375px):**
```
┌───────────────────────────────────────────┐
│  12px padding                             │
│  Christian McCaffrey  [RB] [SF]           │
│  [Healthy]                                │
│                              📈 18.5 pts  │
│                                  Starter  │
│  12px padding                             │
└───────────────────────────────────────────┘
Height: ~64px per player
```

---

### AFTER (Compact - Icon-Dense)

```tsx
<div className="flex items-center justify-between p-2.5 md:p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors min-h-[44px]">
  <div className="flex items-center gap-2 min-w-0 flex-1">
    <div className="flex flex-col min-w-0 flex-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-medium truncate">Christian McCaffrey</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">RB</Badge>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">SF</Badge>
        <Badge variant="success" className="text-[10px] px-1.5 py-0">✓</Badge>
      </div>
    </div>
  </div>

  <div className="flex items-center gap-2 shrink-0">
    <div className="text-right">
      <div className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3 text-blue-500" />
        <span className="text-sm font-medium text-blue-600">18.5</span>
      </div>
      <Badge variant="default" className="text-[10px] mt-0.5">S</Badge>
    </div>
  </div>
</div>
```

**Visual Layout (Mobile 375px):**
```
┌───────────────────────────────────────────┐
│ 10px padding                              │
│ Christian McCaffrey [RB][SF][✓]  📈18.5  │
│                                      [S]  │
│ 10px padding                              │
└───────────────────────────────────────────┘
Height: ~50px per player
```

**Savings:** 14px per card (22% reduction)

**Changes:**
- "Healthy" → "✓" checkmark badge
- "18.5 pts" → "18.5" (icon implies points)
- "Starter" → "S" badge
- Reduced padding (12px → 10px)
- Single-line layout on mobile

---

## Example 5: League Card

### BEFORE (Current - Spacious)

```tsx
<Card className="hover:shadow-lg transition-shadow border-border">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-lg text-card-foreground">
        Dynasty League 2025
      </CardTitle>
      <div className="flex items-center gap-2">
        <Badge variant="default">in_season</Badge>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
    <CardDescription>
      12 teams • 2025 season
    </CardDescription>
  </CardHeader>
  <CardContent className="cursor-pointer">
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Sport</span>
        <span className="font-medium uppercase text-foreground">NFL</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Season Type</span>
        <span className="font-medium text-foreground">regular</span>
      </div>
      <Button className="w-full mt-4">
        <BarChart3 className="h-4 w-4 mr-2" />
        View Analytics
      </Button>
    </div>
  </CardContent>
</Card>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  Dynasty League 2025    [Active][×] │
│  12 teams • 2025 season             │
│  ─────────────────────────────────  │
│                                     │
│  Sport              NFL             │
│                                     │
│  Season Type        regular         │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  📊 View Analytics            │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
Height: ~180px
```

---

### AFTER (Compact - Dense Info)

```tsx
<Card className="hover:shadow-lg transition-shadow border-border">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-base text-card-foreground truncate">
        Dynasty League 2025
      </CardTitle>
      <div className="flex items-center gap-1 shrink-0">
        <Badge variant="default" className="text-[10px]">Active</Badge>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Users className="h-3 w-3" />
      <span>12</span>
      <span>•</span>
      <Calendar className="h-3 w-3" />
      <span>2025</span>
      <span>•</span>
      <Badge variant="outline" className="text-[10px] px-1.5">NFL</Badge>
    </div>
  </CardHeader>
  <CardContent className="pt-0 cursor-pointer">
    <Button size="sm" className="w-full min-h-[44px]">
      <BarChart3 className="h-4 w-4 md:mr-2" />
      <span className="hidden sm:inline">Analytics</span>
    </Button>
  </CardContent>
</Card>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  Dynasty League 2025    [Act.][×]   │
│  👥 12 • 📅 2025 • [NFL]            │
│  ┌───────────────────────────────┐  │
│  │  📊                           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
Height: ~120px
```

**Savings:** 60px per card (33% reduction)

**Changes:**
- Removed verbose sport/season rows
- Converted to icon + data format
- Smaller badges and text
- Removed bottom padding
- Icon-only button on mobile

---

## Example 6: Rankings Filter Section

### BEFORE (Current - 4-Column Desktop Only)

```tsx
<Card className="mb-6 overflow-hidden">
  <CardHeader>
    <CardTitle>Ranking Filters & Sorting</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="min-w-0">
        <label className="text-sm font-medium mb-2 block truncate">
          Ranking Source
        </label>
        <Select value={selectedSource} onValueChange={setSelectedSource}>
          <SelectTrigger className="min-h-[44px] w-full">
            <SelectValue />
          </SelectTrigger>
          {/* ... */}
        </Select>
      </div>
      {/* ... 3 more filters */}
    </div>
  </CardContent>
</Card>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  Ranking Filters & Sorting          │
│  ─────────────────────────────────  │
│                                     │
│  Ranking Source                     │
│  ┌───────────────────────────────┐  │
│  │ AI Generated              ▼   │  │
│  └───────────────────────────────┘  │
│                                     │
│  Position                           │
│  ┌───────────────────────────────┐  │
│  │ All Positions             ▼   │  │
│  └───────────────────────────────┘  │
│                                     │
│  Ranking System                     │
│  ┌───────────────────────────────┐  │
│  │ AI Week 18 2025           ▼   │  │
│  └───────────────────────────────┘  │
│                                     │
│  AI Projection Type                 │
│  ┌───────────────────────────────┐  │
│  │ Weekly Projections        ▼   │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
Height: ~340px (stacked)
```

---

### AFTER (Compact - 2x2 Grid on Mobile)

```tsx
<Card className="mb-4 overflow-hidden">
  <CardHeader className="pb-3">
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4" />
      <CardTitle className="text-base">Filters</CardTitle>
    </div>
  </CardHeader>
  <CardContent className="pt-0">
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
      <div className="min-w-0">
        <label className="text-xs font-medium mb-1 block truncate flex items-center gap-1">
          <Database className="h-3 w-3" />
          Source
        </label>
        <Select value={selectedSource} onValueChange={setSelectedSource}>
          <SelectTrigger className="min-h-[44px] w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          {/* ... */}
        </Select>
      </div>
      {/* ... 3 more filters in 2x2 grid */}
    </div>
  </CardContent>
</Card>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  🔍 Filters                         │
│  ─────────────────────────────────  │
│  💾 Source       📍 Position        │
│  ┌─────────┐    ┌─────────┐        │
│  │AI Gen. ▼│    │All Pos.▼│        │
│  └─────────┘    └─────────┘        │
│  📊 System       ⚙️ Type            │
│  ┌─────────┐    ┌─────────┐        │
│  │Wk 18  ▼│    │Weekly ▼│        │
│  └─────────┘    └─────────┘        │
└─────────────────────────────────────┘
Height: ~160px (2x2 grid)
```

**Savings:** 180px (53% reduction)

**Changes:**
- Icon-based section title
- Icon + abbreviated labels
- 2x2 grid on mobile (was stacked)
- Smaller text and spacing
- Removed verbose card title

---

## Example 7: Rankings Table (Mobile Cards)

### BEFORE (Current - Spacious Cards)

```tsx
<div className="md:hidden space-y-2 overflow-hidden">
  {players.map((player) => (
    <Card key={player.playerId} className="p-4 cursor-pointer">
      <div className="space-y-3 min-w-0">
        <div className="flex justify-between items-start gap-2 min-w-0">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 min-w-[44px] min-h-[44px] text-white rounded-full flex items-center justify-center text-sm font-bold ${getTierColor(player.tier)} shrink-0`}>
              {player.rank}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{player.playerName}</div>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs shrink-0">{player.position}</Badge>
                <span className="text-sm text-muted-foreground truncate">{player.team}</span>
              </div>
            </div>
          </div>
          {player.tier && (
            <Badge variant="secondary" className="text-xs shrink-0">Tier {player.tier}</Badge>
          )}
        </div>
        <div className="flex justify-between items-center text-sm gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground">Projected: </span>
            <span className="font-medium">{player.projectedPoints?.toFixed(1)} pts</span>
          </div>
          <div className="shrink-0">
            <Badge variant={player.injuryStatus === "Healthy" ? "secondary" : "destructive"} className="text-xs">
              {player.injuryStatus || "Healthy"}
            </Badge>
          </div>
        </div>
        {player.notes && (
          <div className="text-xs text-muted-foreground border-t pt-2 break-words">
            {player.notes}
          </div>
        )}
      </div>
    </Card>
  ))}
</div>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │  16px padding                 │  │
│  │  [1] Christian McCaffrey      │  │
│  │      [RB] SF          Tier 1  │  │
│  │                               │  │
│  │  Projected: 18.5 pts [Healthy]│  │
│  │  ───────────────────────────  │  │
│  │  Elite RB1 with high upside...│  │
│  │  16px padding                 │  │
│  └───────────────────────────────┘  │
│             8px gap                  │
│  ┌───────────────────────────────┐  │
│  │  [2] Tyreek Hill              │  │
│  │      [WR] MIA         Tier 1  │  │
│  │  Projected: 17.2 pts [Healthy]│  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
Height per card: ~110px (with notes)
```

---

### AFTER (Compact - Dense Cards)

```tsx
<div className="md:hidden space-y-1.5 overflow-hidden">
  {players.map((player) => (
    <Card key={player.playerId} className="p-2.5 cursor-pointer">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-8 h-8 min-w-[44px] min-h-[44px] text-white rounded-full flex items-center justify-center text-xs font-bold ${getTierColor(player.tier)} shrink-0`}>
          {player.rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm truncate">{player.playerName}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{player.position}</Badge>
            <span className="text-xs text-muted-foreground">{player.team}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium text-blue-600">
                {player.projectedPoints?.toFixed(1)}
              </span>
            </div>
            {player.tier && <Badge variant="secondary" className="text-[10px]">T{player.tier}</Badge>}
            <Badge variant={player.injuryStatus === "Healthy" ? "success" : "destructive"} className="text-[10px] px-1.5">
              {player.injuryStatus === "Healthy" ? "✓" : player.injuryStatus?.substring(0, 1)}
            </Badge>
          </div>
        </div>
      </div>
      {player.notes && (
        <div className="text-[10px] text-muted-foreground mt-1.5 line-clamp-1">
          {player.notes}
        </div>
      )}
    </Card>
  ))}
</div>
```

**Visual Layout (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │ 10px padding                  │  │
│  │ [1] Christian McCaffrey       │  │
│  │     [RB] SF  📈18.5 [T1] [✓] │  │
│  │     Elite RB1 with high...    │  │  ← Truncated notes
│  │ 10px padding                  │  │
│  └───────────────────────────────┘  │
│             6px gap                  │
│  ┌───────────────────────────────┐  │
│  │ [2] Tyreek Hill               │  │
│  │     [WR] MIA 📈17.2 [T1] [✓] │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
Height per card: ~68px (with notes)
```

**Savings:** 42px per card (38% reduction)

**Changes:**
- Reduced padding (16px → 10px)
- Single-line layout for all metadata
- Icon-only injury status (✓ or first letter)
- Tier abbreviation (Tier 1 → T1)
- Line-clamp notes to 1 line
- Smaller rank badge (10px → 8px width)

---

## Summary: Total Mobile Viewport Impact

### Dashboard Page (375px × 667px viewport)

| Section | Current Height | Compact Height | Savings |
|---------|----------------|----------------|---------|
| Header | 110px | 70px | 40px |
| Stats Grid (3 cards) | 270px | 110px | 160px |
| Tabs | 88px | 44px | 44px |
| League Cards (2) | 360px | 240px | 120px |
| **Total Visible** | 828px | 464px | **364px (44%)** |

**Result:** Show 1.8x more content per viewport

---

### Rankings Page (375px × 667px viewport)

| Section | Current Height | Compact Height | Savings |
|---------|----------------|----------------|---------|
| Header | 90px | 60px | 30px |
| Filters | 340px | 160px | 180px |
| Stats Grid | 180px | 110px | 70px |
| Player Cards (5) | 550px | 340px | 210px |
| **Total Visible** | 1160px | 670px | **490px (42%)** |

**Result:** Show 7-8 player cards instead of 5

---

## Accessibility Verification Checklist

For each "AFTER" example:

- [ ] Touch targets ≥44px (width × height)
- [ ] Color contrast ≥4.5:1 for text <18px
- [ ] Color contrast ≥3:1 for text ≥18px
- [ ] Icon-only buttons have aria-label or sr-only text
- [ ] Truncated text doesn't hide critical information
- [ ] Keyboard navigation preserved
- [ ] Focus indicators visible
- [ ] Screen reader announces abbreviated text correctly

---

## Desktop Comparison (≥768px)

**Key Difference:** Desktop retains more generous spacing while still benefiting from information density improvements.

**Example: Stats Cards on Desktop**

```tsx
// Mobile: 3-column compact
grid-cols-3 gap-2

// Desktop: 3-column comfortable
md:grid-cols-3 md:gap-3

// Desktop shows full labels
<span className="hidden md:inline">User Imported</span>
```

**Philosophy:** Progressive enhancement - mobile gets essential density, desktop gets comfort + clarity.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-13
**Author:** Claude (UI/UX Design Agent)
