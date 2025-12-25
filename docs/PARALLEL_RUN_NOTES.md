# Parallel Run: SessionBootstrapContext + UserDataProvider

## Overview

During the migration period, both `SessionBootstrapContext` and `UserDataProvider` run in parallel. To avoid duplicate API calls and maintain a single source of truth, **UserDataProvider's data fetching is disabled**.

## Data Fetching Responsibility

**SessionBootstrapContext** handles ALL API calls:
- ✅ `/api/auth/me` - Auth check
- ✅ `/api/positions` - Sky positions
- ✅ `/api/lunar_events` - Lunar events
- ✅ `/api/charts/default` - Default chart
- ✅ `/api/charts` - Chart list
- ✅ `/api/transits/vibes/now` - Transit vibes
- ✅ `/api/interpretations/transiting_to_natal` - Interpretations

**UserDataProvider** is DISABLED (no API calls):
- ❌ `/api/auth/me` - **NOT fetched** (avoid duplicate)
- ❌ `/api/natal-data` - **NOT fetched** (avoid duplicate)
- ⚠️ Provides empty/default state for backwards compatibility only

## Why This Approach?

1. **Avoid Duplicate Calls**: Prevents both providers from calling `/api/auth/me` simultaneously
2. **Single Source of Truth**: SessionBootstrapContext with TanStack Query is the canonical data source
3. **Backwards Compatibility**: Existing components using `useUserData()` won't break (they'll just get empty state)
4. **Clear Migration Path**: Components should migrate to `useSessionBootstrap()` to get actual data

## Migration Status

- ✅ **New components**: Use `useSessionBootstrap()` from SessionBootstrapContext
- ⚠️ **Legacy components**: Still using `useUserData()` will receive empty/default state
- 🔄 **In progress**: Migrate legacy components to use `useSessionBootstrap()`

## What UserDataProvider Provides During Parallel Run

```javascript
{
  isAuthenticated: false,     // Always false (no fetching)
  authChecked: true,          // Always true (immediate)
  user: null,                 // Always null
  natalDataList: [],          // Always empty array
  defaultNatal: null,         // Always null
  loading: false,             // Always false (no loading)
  refreshNatalData: () => {}  // No-op function
}
```

## Re-enabling UserDataProvider

If you need to remove SessionBootstrapProvider and use UserDataProvider independently:

1. Remove `SessionBootstrapProvider` from `ClientLayoutWrapper`
2. Uncomment the fetch code in `UserDataContext.jsx` (marked with comments)
3. Remove the early return that disables fetching

## API Endpoint Mapping

| Old (UserDataProvider) | New (SessionBootstrapContext) |
|------------------------|-------------------------------|
| `/api/natal-data` (GET) | `/api/charts` (GET) |
| `/api/natal-data` (POST) | `/api/charts` (POST) |
| `/api/auth/me` | `/api/auth/me` (same, but cached) |

## Notes

- TanStack Query in SessionBootstrapContext provides automatic request deduplication
- All cached data is available via `useSessionBootstrap()` hook
- Chart mutations should invalidate cache using `bootstrapQueryKeys` (see SESSION_BOOTSTRAP.md)

