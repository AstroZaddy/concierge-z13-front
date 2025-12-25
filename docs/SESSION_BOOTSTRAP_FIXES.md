# Session Bootstrap Fixes Applied

## Changes Made

### 1. ✅ Stable Query Keys for Transits

**Before:** Query keys used `natalLongitudes` array (unstable, changes on every render)

**After:** Query keys use stable identifiers:
- `chartId` - The default chart's UUID (`defaultChart.meta.id`)
- `dateStr` - Current date string (YYYY-MM-DD) for daily cache invalidation

```javascript
// Before
queryKey: ["transits", "vibes", "now", JSON.stringify(natalLongitudes)]

// After  
queryKey: ["transits", "vibes", "now", chartId, dateStr]
```

**Benefits:**
- Stable cache keys that don't change unnecessarily
- Proper cache invalidation when chart changes or date changes
- Better cache hit rates

### 2. ✅ Private Queries Gated to sessionState

All private queries are properly gated with `enabled` conditions tied to `sessionState`:

- **defaultChartQuery**: `enabled: sessionState === "authenticated_has_chart" && !!hasDefaultChartId`
- **vibesQuery**: `enabled: sessionState === "authenticated_has_chart" && !!defaultChartId && hasNatalLongitudes && defaultChartQuery.isSuccess`
- **interpretationsQuery**: `enabled: sessionState === "authenticated_has_chart" && topAspectKeys.length > 0 && vibesQuery.isSuccess`
- **chartsListQuery**: `enabled: firstPaintComplete && (sessionState === "authenticated_has_chart" || sessionState === "authenticated_no_chart")`

**Benefits:**
- Queries only run when appropriate session state is reached
- Prevents unnecessary API calls
- Better performance and resource usage

### 3. ✅ Interpretations Preload Limited to 15 Aspects

**Before:** Used top 20 aspects

**After:** Uses top 15 aspects (within the 12-20 range)

```javascript
const TOP_ASPECTS_COUNT = 15;
const topAspectKeys = vibesData?.aspects_found?.slice(0, TOP_ASPECTS_COUNT)?.map(...)
```

**Benefits:**
- Reduces API payload size
- Faster interpretation loading
- Still provides good coverage of top aspects

### 4. ✅ 401 Redirect Only on Private Routes

**Before:** Redirected on any 401, even on public routes (could cause redirect loops)

**After:** Redirects only when on private routes (prevents loops on public pages)

```javascript
const isPrivateRoute = useCallback(() => {
  const pathname = window.location.pathname;
  const publicRoutes = [
    "/",
    "/auth/",
    "/positions",
    "/lunar",
    "/about-z13",
    "/the-z13-story",
  ];
  return !publicRoutes.some(route => pathname.startsWith(route));
}, []);
```

**Public Routes (no redirect on 401):**
- `/`
- `/auth/*` (login, register, etc.)
- `/positions`
- `/lunar`
- `/about-z13`
- `/the-z13-story`

**Private Routes (redirect on 401):**
- `/natal/*` (all natal chart pages)
- `/transits/*` (transit pages)
- Any other routes not in the public list

**Benefits:**
- Prevents redirect loops when browsing public pages while logged out
- Users can browse public content without being forced to login
- Better UX - only redirects when accessing protected content

## Query Key Structure

### Transits Vibes
```javascript
bootstrapQueryKeys.transits.vibesNow(chartId, dateStr)
// Example: ["transits", "vibes", "now", "uuid-here", "2025-01-15"]
```

### Interpretations
```javascript
bootstrapQueryKeys.interpretations.transitingToNatal(keys)
// Creates stable hash from sorted aspect keys
// Example: ["interpretations", "transiting_to_natal", 15, "Mars-conjunction-Sun|Venus-square-Moon|..."]
```

## Testing Recommendations

1. **Test query key stability**: Verify cache hits when chartId and date are the same
2. **Test enabled conditions**: Verify queries don't run when sessionState is wrong
3. **Test 401 handling**: 
   - Verify redirect on `/natal/create` when 401 occurs
   - Verify NO redirect on `/positions` when 401 occurs
   - Verify NO redirect loop on `/auth/login` when 401 occurs
4. **Test interpretations count**: Verify only 15 aspect keys are requested

