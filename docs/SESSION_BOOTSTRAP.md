# Session Bootstrap System

## Overview

The Session Bootstrap system provides automatic authentication checking and data preloading on app initialization. It uses TanStack Query (React Query) for intelligent caching, deduplication, and cache invalidation.

## Architecture

### Provider Structure

```jsx
<ZodiacModeProvider>
  <SessionBootstrapProvider>  {/* New - runs in parallel with UserDataProvider */}
    <UserDataProvider>
      {/* Your app */}
    </UserDataProvider>
  </SessionBootstrapProvider>
</ZodiacModeProvider>
```

### Boot Sequence

The system executes the following sequence on app load:

#### A) Public Preload (immediate, no auth required)
1. `GET /api/positions?mode=both` - Sky positions for "Sky Now"
2. `GET /api/lunar_events?days=5&mode=z13` - Lunar events for "Lunar Today"

#### B) Auth Check (gates private preload)
3. `GET /api/auth/me` - Check authentication status
   - If 401: Set `sessionState = "anonymous"`, clear private cache
   - If 200: Extract user data, determine if default chart exists

#### C) Private Preload (only when authenticated with default chart)
4. `GET /api/charts/default` - Load default chart
5. `POST /api/transits/vibes/now` - Calculate vibes for default chart
6. `POST /api/interpretations/transiting_to_natal` - Preload interpretations for top aspects

#### D) Deferred (after first paint)
7. `GET /api/charts?include_archived=false` - Load chart list for picker

## Session States

The system manages three session states:

- `"anonymous"` - User is not authenticated
- `"authenticated_no_chart"` - User is authenticated but has no default chart
- `"authenticated_has_chart"` - User is authenticated and has a default chart loaded

## Usage

### Basic Hook

```jsx
import { useSessionBootstrap } from '@/contexts/SessionBootstrapContext';

function MyComponent() {
  const {
    sessionState,
    hasCheckedAuth,
    user,
    positions,
    lunarEvents,
    defaultChart,
    vibesNow,
    chartsList,
    // ... loading states, errors, refetch functions
  } = useSessionBootstrap();

  if (!hasCheckedAuth) {
    return <div>Loading...</div>;
  }

  if (sessionState === "anonymous") {
    return <div>Please log in</div>;
  }

  // Use cached data
  return <div>Welcome {user?.display_name}</div>;
}
```

### Available Data

The context provides:

**Session State:**
- `sessionState` - Current session state enum
- `hasCheckedAuth` - Whether initial auth check completed
- `user` - Current user object (from `/auth/me`)

**Public Data (always available):**
- `positions` - Sky positions data
- `positionsLoading` - Loading state
- `positionsError` - Error state
- `lunarEvents` - Lunar events data
- `lunarEventsLoading` - Loading state
- `lunarEventsError` - Error state

**Private Data (only when authenticated):**
- `defaultChart` - User's default chart (full payload)
- `defaultChartLoading` - Loading state
- `defaultChartError` - Error state
- `vibesNow` - Current transit vibes for default chart
- `vibesNowLoading` - Loading state
- `vibesNowError` - Error state
- `interpretations` - Preloaded interpretations cache
- `interpretationsLoading` - Loading state
- `chartsList` - List of user charts
- `chartsListLoading` - Loading state
- `chartsListError` - Error state

**Utilities:**
- `queryClient` - TanStack Query client for manual cache operations
- `refetchPositions()`, `refetchLunarEvents()`, etc. - Manual refetch functions

## Cache Configuration

### Stale Times
- `/auth/me`: 5 minutes
- `/positions`: 1 minute
- `/lunar_events`: 5 minutes
- `/charts/default`: 5 minutes
- `/transits/vibes/now`: 2 minutes
- `/charts`: 5 minutes
- Interpretations: Infinity (entire session)

### Cache Invalidation

After mutations that modify charts, invalidate the cache:

```jsx
import { useBootstrapQueryClient } from '@/contexts/SessionBootstrapContext';
import { bootstrapQueryKeys } from '@/contexts/SessionBootstrapContext';

function useChartMutations() {
  const queryClient = useBootstrapQueryClient();

  const createChart = async (chartData) => {
    const response = await fetch('/api/charts', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chartData),
    });
    
    // Invalidate and refetch
    await queryClient.invalidateQueries({ 
      queryKey: bootstrapQueryKeys.charts.all(false) 
    });
    await queryClient.invalidateQueries({ 
      queryKey: bootstrapQueryKeys.charts.default() 
    });
    await queryClient.invalidateQueries({ 
      queryKey: ['transits', 'vibes', 'now'] 
    });
    
    return response.json();
  };
}
```

## 401 Error Handling

- **On `/auth/me` 401**: Set session to anonymous, clear private cache, allow browsing public pages
- **On private endpoint 401**: Clear private cache, set session to anonymous, redirect to login (unless on public/auth page)

## API Endpoints Created

The following API proxy endpoints were created:

- `/api/lunar_events` - GET (proxies to backend `/lunar_events`)
- `/api/positions` - GET (proxies to backend `/positions`)
- `/api/charts` - GET, POST (proxies to backend `/charts`)
- `/api/charts/default` - GET (proxies to backend `/charts/default`)

## Migration Notes

- This system runs **in parallel** with the existing `UserDataProvider`
- Components can gradually migrate from `useUserData()` to `useSessionBootstrap()`
- The old `UserDataProvider` can be removed once all components are migrated
- Query keys are exported as `bootstrapQueryKeys` for cache invalidation in mutations

## Query Keys Reference

```javascript
import { bootstrapQueryKeys } from '@/contexts/SessionBootstrapContext';

// Auth
bootstrapQueryKeys.auth.me

// Positions
bootstrapQueryKeys.positions.now("both")

// Lunar
bootstrapQueryKeys.lunar.events(5, "z13")

// Charts
bootstrapQueryKeys.charts.all(false)
bootstrapQueryKeys.charts.default()
bootstrapQueryKeys.charts.detail(chartId)

// Transits
bootstrapQueryKeys.transits.vibesNow(natalLongitudes)

// Interpretations
bootstrapQueryKeys.interpretations.categories()
bootstrapQueryKeys.interpretations.categoryItems(category)
bootstrapQueryKeys.interpretations.item(category, item, format)
bootstrapQueryKeys.interpretations.transitingToNatal(keys)
```

