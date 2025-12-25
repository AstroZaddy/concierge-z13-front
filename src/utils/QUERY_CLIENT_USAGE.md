# Using Global QueryClient in React Islands

## Overview

React islands (components with `client:load`) cannot access React Context, but they can access the globally stored QueryClient instance to read cached data that was preloaded by `SessionBootstrapContext`.

## Available Utilities

Import from `src/utils/queryClient.js`:

- `getCachedQueryData(queryKey)` - Get cached data for a query key
- `getCachedQueryState(queryKey)` - Get full query state (data, isLoading, error, etc.)
- `isQueryLoading(queryKey)` - Check if a query is loading
- `subscribeToQueryData(queryKey, callback)` - Subscribe to cache updates

## Query Keys

Import `bootstrapQueryKeys` from `src/contexts/SessionBootstrapContext` to use the same query keys:

```javascript
import { bootstrapQueryKeys } from "../../contexts/SessionBootstrapContext";
import { getCachedQueryData, subscribeToQueryData } from "../../utils/queryClient";

// Get positions
const positionsKey = bootstrapQueryKeys.positions.now("both");
const cachedPositions = getCachedQueryData(positionsKey);

// Get default chart
const defaultChartKey = bootstrapQueryKeys.charts.default();
const cachedChart = getCachedQueryData(defaultChartKey);

// Get lunar events
const lunarEventsKey = bootstrapQueryKeys.lunar.events(5, "z13");
const cachedLunarEvents = getCachedQueryData(lunarEventsKey);

// Get vibes (need chartId and date)
const vibesKey = bootstrapQueryKeys.transits.vibesNow(chartId, dateStr);
const cachedVibes = getCachedQueryData(vibesKey);
```

## Example Usage

### PositionsPage

```javascript
import { getCachedQueryData, subscribeToQueryData } from "../../utils/queryClient";
import { bootstrapQueryKeys } from "../../contexts/SessionBootstrapContext";

export function PositionsPage() {
  const positionsQueryKey = bootstrapQueryKeys.positions.now("both");
  const cachedPositions = getCachedQueryData(positionsQueryKey);
  const [positions, setPositions] = useState(cachedPositions || null);
  
  useEffect(() => {
    // Subscribe to cache updates
    const unsubscribe = subscribeToQueryData(positionsQueryKey, (data) => {
      if (data) {
        setPositions(data);
      }
    });
    
    // Use cached data immediately if available
    if (cachedPositions) {
      setPositions(cachedPositions);
    }
    
    return unsubscribe;
  }, [positionsQueryKey, cachedPositions]);
  
  // ... rest of component
}
```

### DailyVibesPage

```javascript
import { getCachedQueryData, subscribeToQueryData } from "../../utils/queryClient";
import { bootstrapQueryKeys } from "../../contexts/SessionBootstrapContext";

export function DailyVibesPage() {
  const defaultChartKey = bootstrapQueryKeys.charts.default();
  const cachedChart = getCachedQueryData(defaultChartKey);
  
  const [chartId, setChartId] = useState(null);
  const vibesKey = chartId 
    ? bootstrapQueryKeys.transits.vibesNow(chartId, new Date().toISOString().split('T')[0])
    : null;
  const cachedVibes = vibesKey ? getCachedQueryData(vibesKey) : null;
  
  useEffect(() => {
    // Subscribe to chart updates
    const unsubscribe = subscribeToQueryData(defaultChartKey, (data) => {
      if (data?.chart?.meta?.id) {
        setChartId(data.chart.meta.id);
      }
    });
    
    if (cachedChart?.chart?.meta?.id) {
      setChartId(cachedChart.chart.meta.id);
    }
    
    return unsubscribe;
  }, [defaultChartKey, cachedChart]);
  
  // ... rest of component
}
```

## Where to Use This

### Currently Implemented:
- ✅ `PositionsPage` - Uses cached positions
- ✅ `LunarEventsPage` - Uses cached lunar events
- ✅ `DailyVibesPage` - Uses cached default chart and vibes

### Could Be Enhanced:
- `BirthChartPage` - Could use cached default chart instead of fetching
- `TransitsPage` - Could use cached default chart and vibes
- Any other page that needs preloaded data

## Benefits

1. **No Duplicate Requests**: Islands can read data that was already fetched by `SessionBootstrapContext`
2. **Instant Display**: Cached data is available immediately, no loading spinner
3. **Automatic Updates**: Subscriptions notify islands when cache updates
4. **Fallback Support**: If cache is empty, components can still fetch directly

