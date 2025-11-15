# Z13 Astrology API — Frontend Integration Guide

**Version:** 0.1.2  
**Last Updated:** 2025

This guide provides everything a frontend developer needs to integrate with the Z13 Astrology API backend. No backend knowledge required.

---

## Table of Contents

1. [API Reference](#1-api-reference-frontend-oriented)
2. [Workflow Maps](#2-workflow-maps)
3. [Client-Side State Expectations](#3-client-side-state-expectations)
4. [UI Data Contracts](#4-ui-data-contracts)
5. [Example Fetch Snippets](#5-example-fetch-snippets)

---

## 1. API Reference (Frontend-Oriented)

### Base URL

All endpoints are relative to your API server. For local development, this is typically:
```
http://localhost:8000
```

Production base URLs will be provided by your deployment team.

---

### `/positions`

#### Purpose
Retrieve planetary positions (Sun, Moon, planets, nodes, etc.) for a specific datetime. Supports both Z13 (true-sky) and tropical zodiac systems.

#### HTTP Method
`GET`

#### URL & Query Parameters

**Endpoint:** `/positions` or `/positions/now`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `datetime` | string | No | current UTC time | ISO-8601 timestamp (e.g., `2025-01-01T12:00:00Z`). UTC assumed if timezone omitted. |
| `mode` | string | No | `z13` | Zodiac system: `z13` or `tropical` |
| `bodies` | string[] | No | all bodies | Filter to specific bodies. Repeat parameter: `?bodies=Sun&bodies=Moon` |

**Note:** `/positions/now` is a convenience endpoint that always uses the current UTC time. It accepts `mode` and `bodies` parameters only.

#### Request Examples

```javascript
// Get all positions for a specific datetime (Z13)
GET /positions?datetime=2025-01-15T14:30:00Z&mode=z13

// Get current positions (tropical)
GET /positions/now?mode=tropical

// Get only Sun and Moon positions
GET /positions?datetime=2025-01-15T00:00:00Z&bodies=Sun&bodies=Moon

// Get positions for now (defaults to Z13)
GET /positions
```

#### Response Examples

```json
{
  "positions": [
    {
      "body": "Sun",
      "mode": "z13",
      "longitude": 280.13,
      "latitude": 0.0,
      "speed": 0.99,
      "retrograde": false,
      "distance_km": 149600000.0,
      "sign": "Sagittarius (10.13°)",
      "source": "current cache"
    },
    {
      "body": "Mars",
      "mode": "z13",
      "longitude": 145.67,
      "latitude": 1.23,
      "speed": 0.52,
      "retrograde": true,
      "distance_km": 225000000.0,
      "sign": "Leo (25.67°)",
      "source": "ephemeris"
    }
  ]
}
```

#### Frontend Responsibilities

- **DateTime Formatting:** Convert user input to ISO-8601 format. If timezone is missing, API assumes UTC.
- **Mode Selection:** Provide UI toggle or preference for `z13` vs `tropical`.
- **Body Filtering:** If implementing a "select planets" feature, pass `bodies` as repeated query parameters.
- **Display:** Parse `sign` field (e.g., `"Sagittarius (10.13°)"`) for UI rendering.

#### Error Conditions

| Status Code | Condition | Response Body |
|-------------|-----------|---------------|
| `400` | Invalid `mode` parameter | `{"detail": "Mode must be 'z13' or 'tropical'."}` |
| `400` | Invalid `datetime` format | `{"detail": "Invalid datetime format: ..."}` |

---

### `/lunar_events`

#### Purpose
Retrieve upcoming lunar phases (new moon, full moon, quarters) and sign ingresses within a specified date range. Includes micro-interpretations and keywords.

#### HTTP Method
`GET`

#### URL & Query Parameters

**Endpoint:** `/lunar_events`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `datetime` | string | No | current UTC time | ISO-8601 timestamp for start of window (UTC). |
| `days` | integer | No | `14` | Number of days to include (1-90). |
| `mode` | string | No | `z13` | Zodiac system: `z13` or `tropical`. |

#### Request Examples

```javascript
// Get next 14 days of lunar events (Z13)
GET /lunar_events?mode=z13

// Get next 30 days starting from a specific date
GET /lunar_events?datetime=2025-02-01T00:00:00Z&days=30&mode=tropical

// Get 7 days from now (defaults to Z13)
GET /lunar_events?days=7
```

#### Response Examples

```json
{
  "start": "2025-01-15T00:00:00Z",
  "end": "2025-01-29T00:00:00Z",
  "mode": "z13",
  "events": [
    {
      "datetime": "2025-01-17T12:34:00Z",
      "event_type": "phase",
      "sign": "Cancer",
      "phase": "full",
      "description": "A time of emotional culmination and release.",
      "notes": "Consider journaling or meditation.",
      "keywords": ["culmination", "release", "emotion"]
    },
    {
      "datetime": "2025-01-20T08:21:00Z",
      "event_type": "ingress",
      "sign": "Leo",
      "phase": null,
      "description": "Moon enters Leo, bringing confidence and creativity.",
      "notes": null,
      "keywords": ["confidence", "creativity", "expression"]
    }
  ]
}
```

#### Frontend Responsibilities

- **Date Range Selection:** Allow users to adjust `days` parameter (1-90).
- **Mode Toggle:** Provide Z13/tropical selector.
- **Event Sorting:** Events are returned chronologically, but you may want to group by date in UI.
- **Display:** Show `event_type` ("phase" vs "ingress") with appropriate icons/styling.
- **Keywords:** Use `keywords` array for tagging, filtering, or search.

#### Error Conditions

| Status Code | Condition | Response Body |
|-------------|-----------|---------------|
| `400` | Invalid `datetime` format | `{"detail": "Invalid datetime parameter."}` |
| `400` | Invalid `mode` | `{"detail": "Mode must be 'z13' or 'tropical'."}` |
| `422` | `days` out of range (validation) | FastAPI validation error |

---

### `/location/search`

#### Purpose
Search for cities by name. Used to resolve location data (latitude, longitude, timezone) needed for natal chart calculations. Results are cached for performance.

#### HTTP Method
`GET`

#### URL & Query Parameters

**Endpoint:** `/location/search`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | **Yes** | - | Partial or full city name (case-insensitive). |
| `limit` | integer | No | `10` | Maximum results (1-25). |

#### Request Examples

```javascript
// Search for cities matching "toron"
GET /location/search?q=toron&limit=5

// Search for "Springfield" (may return multiple results)
GET /location/search?q=Springfield&limit=25
```

#### Response Examples

```json
{
  "query": "toron",
  "count": 1,
  "results": [
    {
      "city": "Toronto",
      "region": "Ontario",
      "country": "Canada",
      "latitude": 43.6532,
      "longitude": -79.3832,
      "timezone": "America/Toronto"
    }
  ],
  "source": "cache",
  "message": null
}
```

**Multiple Results Example:**
```json
{
  "query": "Springfield",
  "count": 3,
  "results": [
    {
      "city": "Springfield",
      "region": "Illinois",
      "country": "US",
      "latitude": 39.7817,
      "longitude": -89.6501,
      "timezone": "America/Chicago"
    },
    {
      "city": "Springfield",
      "region": "Missouri",
      "country": "US",
      "latitude": 37.2089,
      "longitude": -93.2923,
      "timezone": "America/Chicago"
    }
  ],
  "source": "cache"
}
```

#### Frontend Responsibilities

- **Search Input:** Implement debounced search input (recommend 300-500ms delay).
- **Result Display:** Show city, region, country in a user-friendly format (e.g., "Toronto, Ontario, Canada").
- **Selection Handling:** When user selects a city, store the full result object for use in `/natal` requests.
- **Ambiguity Handling:** If `count > 1`, show disambiguation UI. See `/natal` error handling for 409 responses.
- **Caching:** Cache search results client-side to reduce API calls for repeated queries.

#### Error Conditions

| Status Code | Condition | Response Body |
|-------------|-----------|---------------|
| `422` | Missing `q` parameter | FastAPI validation error |

**Note:** Empty results (`count: 0`) return `200` with `source: "none"` and a `message` field.

---

### `/location/resolve`

**⚠️ Note:** This endpoint does not exist in the current API. Location resolution is handled automatically by the `/natal` endpoint when a `city` parameter is provided. See the `/natal` endpoint documentation below.

---

### `/natal`

#### Purpose
Compute a complete natal chart for a given birth date, time, and location. Returns planetary positions, placements (sign/degree), and metadata. Angles and houses are currently pending implementation.

#### HTTP Method
`POST`

#### URL & Query Parameters

**Endpoint:** `/natal`

No query parameters. All data is sent in the request body.

#### Request Examples

**Using explicit location:**
```json
{
  "datetime": "2000-01-01T08:30:00-05:00",
  "mode": "z13",
  "return_both_systems": false,
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timezone": "America/New_York",
    "name": "New York, NY, US",
    "source": "user"
  },
  "house_system": "whole_sign",
  "include_nodes": true,
  "include_lilith": true,
  "bodies": null
}
```

**Using city name (recommended for user input):**
```json
{
  "datetime": "2000-01-01T08:30:00",
  "mode": "z13",
  "city": "New York",
  "include_nodes": true,
  "include_lilith": true
}
```

**Date-only (time inferred as noon local time):**
```json
{
  "datetime": "2000-01-01",
  "mode": "tropical",
  "city": "London",
  "return_both_systems": true
}
```

#### Request Body Schema

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `datetime` | string | **Yes** | - | ISO-8601 datetime. Date-only accepted (defaults to noon). |
| `mode` | string | No | `z13` | Zodiac system: `z13` or `tropical`. |
| `return_both_systems` | boolean | No | `false` | If `true`, includes `placement_alt` with alternate zodiac. |
| `location` | object | No* | - | Explicit location object (see below). |
| `city` | string | No* | - | City name (resolved via `/location/search`). |
| `house_system` | string | No | `whole_sign` | Currently only `whole_sign` supported. |
| `include_nodes` | boolean | No | `true` | Include North Node and South Node. |
| `include_lilith` | boolean | No | `true` | Include Lilith. |
| `bodies` | string[] | No | all | Filter to specific bodies (e.g., `["Sun", "Moon"]`). |

**\* Note:** Either `location` OR `city` must be provided. If both are omitted, houses and angles will be `null`.

**Location Object:**
```typescript
{
  latitude: number;      // Required
  longitude: number;     // Required
  timezone: string;      // Required (IANA timezone, e.g., "America/New_York")
  name?: string;         // Optional display name
  source?: string;       // Optional source identifier
}
```

#### Response Examples

**Successful Response:**
```json
{
  "metadata": {
    "datetime_local": "2000-01-01T08:30:00-05:00",
    "datetime_utc": "2000-01-01T13:30:00Z",
    "time_inferred": false,
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timezone": "America/New_York",
      "name": "New York, New York, US",
      "source": "cache"
    },
    "mode": "z13",
    "capabilities": ["planets"],
    "limitations": ["angles pending implementation", "houses pending implementation"],
    "confidence": {
      "planets": "high",
      "moon": "high",
      "angles": "low",
      "houses": "low"
    },
    "engine": {
      "ephemeris": "JPL DE421 (parquet tiers)",
      "valid_range": "1800–2150",
      "version": "z13-api 0.1.0"
    }
  },
  "positions": [
    {
      "body": "Sun",
      "longitude": 280.13,
      "latitude": 0.0,
      "speed_deg_per_day": 0.99,
      "retrograde": null,
      "distance_km": 149600000.0,
      "placement": {
        "sign": "Sagittarius",
        "sign_degree": 10.13,
        "label": "Sagittarius (10.13°)",
        "house": null
      },
      "placement_alt": null
    },
    {
      "body": "Mars",
      "longitude": 145.67,
      "latitude": 1.23,
      "speed_deg_per_day": 0.52,
      "retrograde": true,
      "distance_km": 225000000.0,
      "placement": {
        "sign": "Leo",
        "sign_degree": 25.67,
        "label": "Leo (25.67°)",
        "house": null
      },
      "placement_alt": null
    }
  ],
  "angles": null,
  "houses": null,
  "notes": [
    "Angles and houses will be included once legacy ports are complete."
  ]
}
```

**With `return_both_systems: true`:**
```json
{
  "metadata": {
    "return_both_systems": true,
    ...
  },
  "positions": [
    {
      "body": "Sun",
      "placement": {
        "sign": "Sagittarius",
        "sign_degree": 10.13,
        "label": "Sagittarius (10.13°)"
      },
      "placement_alt": {
        "sign": "Capricorn",
        "sign_degree": 0.13,
        "label": "Capricorn (00.13°)"
      }
    }
  ]
}
```

#### Frontend Responsibilities

- **Input Collection:** Gather birth date, time (optional), and location (city or coordinates).
- **City Resolution:** If user enters city name, call `/location/search` first to resolve coordinates and timezone.
- **Ambiguity Handling:** If `/location/search` returns multiple results, show disambiguation UI before calling `/natal`.
- **DateTime Normalization:** Convert user input to ISO-8601. Handle timezone conversion if needed.
- **Chart Storage:** Store the full `NatalResponse` for use in transits features (future).
- **Display:** Render planetary positions, signs, degrees. Handle `null` values for houses/angles gracefully.
- **Confidence Indicators:** Use `metadata.confidence` to show data quality indicators in UI.

#### Error Conditions

| Status Code | Condition | Response Body |
|-------------|-----------|---------------|
| `404` | City not found | `{"detail": {"error": "City not found", "query": "Atlantis"}}` |
| `409` | Ambiguous city (multiple matches) | `{"detail": {"error": "Ambiguous city", "candidates": [{"id": "...", "name": "...", "region": "...", "country": "...", "latitude": ..., "longitude": ..., "timezone": "..."}, ...]}}` |
| `422` | Invalid request format | `{"detail": "..."}` |
| `500` | Date out of supported range | `{"detail": {"error": "...", "range_supported": "1800-01-01 to 2150-12-31"}}` |

**Handling 409 (Ambiguous City):**
When the API returns a 409, display the `candidates` array and allow the user to select the correct city. Then retry the `/natal` request with the selected city's data in the `location` object, or use the `city` parameter if you can uniquely identify it.

---

## 2. Workflow Maps

### A. Creating a Natal Chart

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters birth date/time + location                   │
│    - Date: "2000-01-01"                                     │
│    - Time: "08:30" (optional)                              │
│    - Location: "New York" (city name)                       │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend calls /location/search                          │
│    GET /location/search?q=New York&limit=10                 │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Check search results                                      │
│    - If count === 0: Show "City not found" error            │
│    - If count > 1: Show disambiguation UI                  │
│    - If count === 1: Proceed to step 4                      │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User selects city (if ambiguous) or auto-proceed         │
│    - Store selected city data (lat, lng, timezone)          │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Normalize datetime                                        │
│    - Combine date + time (or use noon if time missing)      │
│    - Apply timezone from location                           │
│    - Convert to ISO-8601 format                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Call /natal endpoint                                      │
│    POST /natal                                               │
│    Body: {                                                   │
│      datetime: "2000-01-01T08:30:00-05:00",                 │
│      city: "New York",                                       │
│      mode: "z13"                                             │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Handle response                                           │
│    - If 200: Store response, render chart                   │
│    - If 404: Show "City not found"                          │
│    - If 409: Show disambiguation (shouldn't happen if       │
│              step 3 was handled correctly)                   │
│    - If 422/500: Show error message                          │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Render chart UI                                           │
│    - Display planetary positions                             │
│    - Show signs and degrees                                  │
│    - Display confidence indicators                           │
│    - Show notes (if any)                                     │
│    - Store chart data for future transits feature            │
└─────────────────────────────────────────────────────────────┘
```

**Alternative Flow (Using Explicit Location):**
If the user provides coordinates directly (e.g., from a map picker), skip steps 2-4 and include the `location` object in the `/natal` request instead of `city`.

---

### B. Viewing Lunar Events

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User navigates to lunar events view                      │
│    - Default: Show next 14 days                             │
│    - Mode: User preference (Z13 or tropical)               │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend calls /lunar_events                              │
│    GET /lunar_events?days=14&mode=z13                      │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Render events timeline                                    │
│    - Group events by date                                    │
│    - Display phase events with moon icons                    │
│    - Display ingress events with sign icons                  │
│    - Show descriptions, notes, keywords                      │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User optionally changes date range or mode                │
│    - Adjust days slider (1-90)                               │
│    - Toggle Z13/tropical                                     │
│    - Select different start date                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Re-fetch with new parameters                              │
│    GET /lunar_events?datetime=2025-02-01T00:00:00Z&days=30  │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Update UI with new events                                 │
└─────────────────────────────────────────────────────────────┘
```

---

### C. Viewing Planetary Positions "Now"

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User navigates to "Current Positions" view                │
│    - Mode: User preference (Z13 or tropical)                │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend calls /positions/now                             │
│    GET /positions/now?mode=z13                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Render positions list                                     │
│    - Display body name                                       │
│    - Show sign and degree (e.g., "Sagittarius (10.13°)")    │
│    - Indicate retrograde status (if applicable)              │
│    - Show speed, distance (optional details)                 │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Optional: Auto-refresh                                    │
│    - Poll every 5-10 minutes (positions change slowly)      │
│    - Or provide manual refresh button                        │
└─────────────────────────────────────────────────────────────┘
```

---

### D. Using a Natal Chart to Compute Transiting Aspects

**⚠️ Note:** This feature is not yet implemented in the API. The following describes the expected future workflow.

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User has a stored natal chart (from Workflow A)           │
│    - Chart data stored in local state/storage               │
│    - Contains positions array with longitudes                 │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User selects a date for transits                          │
│    - Default: Today                                          │
│    - Or: Future date (e.g., "Next Full Moon")                │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend calls /positions for transit date                │
│    GET /positions?datetime=2025-02-15T00:00:00Z&mode=z13    │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend computes aspects client-side                      │
│    - Compare natal longitudes vs transit longitudes          │
│    - Calculate angular relationships (conjunction, square,    │
│      trine, opposition, etc.)                                │
│    - Filter by orb tolerance (e.g., 8° for major aspects)   │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Render transit aspects                                    │
│    - Display aspect list (e.g., "Transiting Jupiter          │
│      conjunct Natal Sun")                                    │
│    - Show orb values                                         │
│    - Highlight exact aspects                                 │
└─────────────────────────────────────────────────────────────┘
```

**Future API Endpoint (Expected):**
```
POST /natal/transits
Body: {
  natal_chart: { ... },  // Full natal response
  transit_datetime: "2025-02-15T00:00:00Z",
  mode: "z13"
}
```

Until this endpoint exists, frontend must compute aspects client-side using the positions data.

---

## 3. Client-Side State Expectations

### What to Store Locally

#### 1. **Natal Chart Data** (High Priority)
Store the complete `/natal` response for each user/session:
- **Why:** Needed for transits calculations (even if computed client-side)
- **Storage:** LocalStorage, IndexedDB, or app state (React Context, Redux, etc.)
- **Structure:** Store the full `NatalResponse` object
- **Key Fields to Preserve:**
  - `metadata.datetime_utc` (for reference)
  - `metadata.location` (for display)
  - `positions[]` (for aspect calculations)

**Example Storage:**
```javascript
// LocalStorage example
localStorage.setItem('natalChart', JSON.stringify(natalResponse));

// Or with user ID
localStorage.setItem(`natalChart_${userId}`, JSON.stringify(natalResponse));
```

#### 2. **User Preferences** (Medium Priority)
- Zodiac mode preference (`z13` or `tropical`)
- Default date range for lunar events (e.g., 14 days)
- Last used location/city (for quick re-entry)

#### 3. **Cached Location Search Results** (Low Priority)
- Cache recent `/location/search` results to reduce API calls
- TTL: 24 hours (city data rarely changes)
- Key: search query string

### What Can Always Be Re-computed

- **Planetary Positions:** Always call `/positions` or `/positions/now` (data is ephemeris-based, no user-specific state)
- **Lunar Events:** Always call `/lunar_events` (time-based, no user-specific state)
- **Location Search:** Can be re-queried, but caching improves UX

### Authentication

**Current Status:** The API does **not** require authentication. All endpoints are publicly accessible.

**Future Considerations:**
- If authentication is added, you'll receive API keys or OAuth tokens
- Store tokens securely (never in localStorage if sensitive; use httpOnly cookies or secure storage)
- Include tokens in request headers: `Authorization: Bearer <token>`

### Caching Recommendations

#### 1. **Location Search Results**
```javascript
// Simple in-memory cache
const locationCache = new Map();

async function searchLocation(query, limit = 10) {
  const cacheKey = `${query}_${limit}`;
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey);
  }
  const response = await fetch(`/location/search?q=${query}&limit=${limit}`);
  const data = await response.json();
  locationCache.set(cacheKey, data);
  // Clear cache after 24 hours
  setTimeout(() => locationCache.delete(cacheKey), 24 * 60 * 60 * 1000);
  return data;
}
```

#### 2. **Natal Chart (Per User)**
- Store indefinitely (until user creates a new chart)
- Clear on logout or explicit "clear chart" action

#### 3. **Lunar Events**
- Cache for current date range (events don't change)
- Invalidate when user changes date range or mode
- TTL: Until end of date range

#### 4. **Current Positions**
- Cache for 5-10 minutes (positions change slowly)
- Always allow manual refresh

---

## 4. UI Data Contracts

### Positions Response

#### Field Reference

| Field | Type | Always Present | Nullable | Notes |
|-------|------|----------------|----------|-------|
| `body` | string | ✅ | ❌ | Body name (e.g., "Sun", "Moon", "Mars") |
| `mode` | string | ✅ | ❌ | `"z13"` or `"tropical"` |
| `longitude` | number | ✅ | ❌ | Ecliptic longitude in degrees (0-360) |
| `latitude` | number | ✅ | ✅ | Ecliptic latitude (null for most bodies) |
| `speed` | number | ✅ | ✅ | Daily motion in degrees/day |
| `retrograde` | boolean | ✅ | ✅ | `true` if retrograde, `false` if direct, `null` if N/A |
| `distance_km` | number | ✅ | ✅ | Distance from Earth in km |
| `sign` | string | ✅ | ❌ | Formatted label (e.g., `"Sagittarius (10.13°)"`) |
| `source` | string | ✅ | ✅ | Ephemeris source identifier |

#### Display Guidelines

**Sign/Degree Format:**
- Parse `sign` field: `"Sagittarius (10.13°)"` → Sign: "Sagittarius", Degree: 10.13
- Display options:
  - Full: `"Sagittarius (10.13°)"`
  - Compact: `"Sag 10°13'"`
  - Symbol: `"♐ 10°13'"` (if using Unicode symbols)

**Retrograde Indicator:**
- If `retrograde === true`: Show "R" or "Rx" symbol, or use red/strikethrough styling
- If `retrograde === false`: No indicator needed
- If `retrograde === null`: Omit indicator (not applicable for this body)

**Z13 vs Tropical:**
- `mode` field indicates which system is used
- If `return_both_systems: true` in natal chart, use `placement_alt` for alternate system

---

### Lunar Events Response

#### Field Reference

| Field | Type | Always Present | Nullable | Notes |
|-------|------|----------------|----------|-------|
| `start` | string (ISO-8601) | ✅ | ❌ | Start of query window |
| `end` | string (ISO-8601) | ✅ | ❌ | End of query window |
| `mode` | string | ✅ | ❌ | `"z13"` or `"tropical"` |
| `events[]` | array | ✅ | ❌ | Array of event objects |

**Event Object:**

| Field | Type | Always Present | Nullable | Notes |
|-------|------|----------------|----------|-------|
| `datetime` | string (ISO-8601) | ✅ | ❌ | Event timestamp (UTC) |
| `event_type` | string | ✅ | ❌ | `"phase"` or `"ingress"` |
| `sign` | string | ✅ | ❌ | Sign name (e.g., "Cancer", "Leo") |
| `phase` | string | ✅ | ✅ | Phase key (e.g., `"full"`, `"new"`, `"first_quarter"`) - null for ingresses |
| `description` | string | ✅ | ❌ | Micro-interpretation text |
| `notes` | string | ✅ | ✅ | Supplementary notes or rituals |
| `keywords` | string[] | ✅ | ❌ | Array of keywords (may be empty) |

#### Display Guidelines

**Event Type Icons:**
- `event_type === "phase"`: Use moon phase icon (🌑 new, 🌓 first quarter, 🌕 full, 🌗 last quarter)
- `event_type === "ingress"`: Use sign symbol or arrow icon (→)

**Phase Values:**
- Common values: `"new"`, `"full"`, `"first_quarter"`, `"last_quarter"`, `"waxing_crescent"`, `"waning_crescent"`, etc.
- Map to appropriate icons/colors

**Keywords:**
- Display as tags, chips, or badges
- Use for filtering or search functionality

---

### Natal Chart Response

#### Field Reference

**Top Level:**

| Field | Type | Always Present | Nullable | Notes |
|-------|------|----------------|----------|-------|
| `metadata` | object | ✅ | ❌ | See metadata table below |
| `positions[]` | array | ✅ | ❌ | Array of position objects |
| `angles` | object | ✅ | ✅ | Currently `null` (pending implementation) |
| `houses` | array | ✅ | ✅ | Currently `null` (pending implementation) |
| `notes[]` | array | ✅ | ✅ | Array of informational notes |

**Metadata Object:**

| Field | Type | Always Present | Nullable | Notes |
|-------|------|----------------|----------|-------|
| `datetime_local` | string (ISO-8601) | ✅ | ❌ | Localized birth datetime |
| `datetime_utc` | string (ISO-8601) | ✅ | ❌ | UTC birth datetime |
| `time_inferred` | boolean | ✅ | ❌ | `true` if time was defaulted to noon |
| `location` | object | ✅ | ✅ | Location data (null if no location provided) |
| `mode` | string | ✅ | ❌ | `"z13"` or `"tropical"` |
| `capabilities[]` | array | ✅ | ❌ | Array of capability strings |
| `limitations[]` | array | ✅ | ✅ | Array of limitation strings |
| `confidence` | object | ✅ | ❌ | Confidence levels (see below) |
| `engine` | object | ✅ | ❌ | Ephemeris engine metadata |

**Location Object (in metadata):**

| Field | Type | Always Present | Nullable |
|-------|------|----------------|----------|
| `latitude` | number | ✅ | ❌ |
| `longitude` | number | ✅ | ❌ |
| `timezone` | string | ✅ | ❌ |
| `name` | string | ✅ | ✅ |
| `source` | string | ✅ | ✅ |

**Confidence Object:**

| Field | Type | Always Present | Nullable | Values |
|-------|------|----------------|----------|--------|
| `planets` | string | ✅ | ❌ | `"high"`, `"medium"`, `"low"` |
| `moon` | string | ✅ | ❌ | `"high"`, `"medium"`, `"low"` |
| `angles` | string | ✅ | ❌ | `"high"`, `"medium"`, `"low"` |
| `houses` | string | ✅ | ❌ | `"high"`, `"medium"`, `"low"` |

**Position Object:**

| Field | Type | Always Present | Nullable | Notes |
|-------|------|----------------|----------|-------|
| `body` | string | ✅ | ❌ | Body name |
| `longitude` | number | ✅ | ❌ | Ecliptic longitude (0-360) |
| `latitude` | number | ✅ | ✅ | Ecliptic latitude |
| `speed_deg_per_day` | number | ✅ | ✅ | Daily motion |
| `retrograde` | boolean | ✅ | ✅ | `true`, `false`, or `null` |
| `distance_km` | number | ✅ | ✅ | Distance from Earth |
| `placement` | object | ✅ | ❌ | Primary placement (see below) |
| `placement_alt` | object | ✅ | ✅ | Alternate placement (if `return_both_systems: true`) |

**Placement Object:**

| Field | Type | Always Present | Nullable | Notes |
|-------|------|----------------|----------|-------|
| `sign` | string | ✅ | ❌ | Sign name (e.g., "Sagittarius") |
| `sign_degree` | number | ✅ | ❌ | Degree within sign (0-30) |
| `label` | string | ✅ | ❌ | Formatted label (e.g., `"Sagittarius (10.13°)"`) |
| `house` | integer | ✅ | ✅ | House number (1-12) - currently `null` |

#### Display Guidelines

**Handling Null Angles/Houses:**
- If `angles === null`: Show message: "Angles calculation pending" or hide angles section
- If `houses === null`: Show message: "Houses calculation pending" or hide houses section
- Check `metadata.limitations` array for specific messages

**Confidence Levels:**
- `"high"`: Show green indicator or checkmark
- `"medium"`: Show yellow/orange indicator or warning icon
- `"low"`: Show red indicator or info icon
- Display tooltip explaining why confidence is low (e.g., "Time inferred", "Location from geopy")

**Time Inferred:**
- If `metadata.time_inferred === true`: Show badge or note: "Birth time inferred (noon assumed)"
- Adjust UI styling to indicate lower precision

**Placement Display:**
- Primary: Use `placement.sign` and `placement.sign_degree`
- Alternate: If `placement_alt` exists, show toggle or side-by-side comparison
- Format: `"Sagittarius 10°13'"` or `"♐ 10°13'"`

**Notes Array:**
- Display as informational messages or tooltips
- Common notes:
  - "No location provided; houses and angles omitted."
  - "Angles and houses will be included once legacy ports are complete."
  - "Birth time inferred (no exact time supplied)."

---

## 5. Example Fetch Snippets

### Basic Fetch with Error Handling

```javascript
async function fetchPositions(datetime = null, mode = 'z13', bodies = null) {
  const params = new URLSearchParams();
  if (datetime) params.append('datetime', datetime);
  params.append('mode', mode);
  if (bodies) {
    bodies.forEach(body => params.append('bodies', body));
  }

  try {
    const response = await fetch(`/positions?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.positions;
  } catch (error) {
    console.error('Failed to fetch positions:', error);
    throw error;
  }
}

// Usage
const positions = await fetchPositions('2025-01-15T12:00:00Z', 'z13', ['Sun', 'Moon']);
```

---

### Fetch Current Positions

```javascript
async function fetchCurrentPositions(mode = 'z13') {
  try {
    const response = await fetch(`/positions/now?mode=${mode}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch current positions:', error);
    throw error;
  }
}
```

---

### Fetch Lunar Events

```javascript
async function fetchLunarEvents(startDate = null, days = 14, mode = 'z13') {
  const params = new URLSearchParams();
  if (startDate) params.append('datetime', startDate);
  params.append('days', days.toString());
  params.append('mode', mode);

  try {
    const response = await fetch(`/lunar_events?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch lunar events:', error);
    throw error;
  }
}

// Usage
const events = await fetchLunarEvents('2025-02-01T00:00:00Z', 30, 'z13');
```

---

### Search Locations

```javascript
async function searchLocations(query, limit = 10) {
  if (!query || query.trim() === '') {
    throw new Error('Search query is required');
  }

  const params = new URLSearchParams();
  params.append('q', query.trim());
  params.append('limit', limit.toString());

  try {
    const response = await fetch(`/location/search?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle empty results
    if (data.count === 0) {
      return { results: [], message: data.message || 'No locations found' };
    }
    
    return data;
  } catch (error) {
    console.error('Failed to search locations:', error);
    throw error;
  }
}

// Usage
const results = await searchLocations('Toronto', 5);
if (results.count > 1) {
  // Show disambiguation UI
}
```

---

### Compute Natal Chart (Using City)

```javascript
async function computeNatalChart(birthData) {
  const {
    datetime,
    city,
    mode = 'z13',
    returnBothSystems = false,
    includeNodes = true,
    includeLilith = true,
    houseSystem = 'whole_sign'
  } = birthData;

  const payload = {
    datetime,
    mode,
    return_both_systems: returnBothSystems,
    city,
    house_system: houseSystem,
    include_nodes: includeNodes,
    include_lilith: includeLilith
  };

  try {
    const response = await fetch('/natal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific error cases
      if (response.status === 404) {
        throw new Error(`City not found: ${error.detail.query}`);
      }
      
      if (response.status === 409) {
        // Ambiguous city - return candidates for disambiguation
        return {
          error: 'ambiguous',
          candidates: error.detail.candidates
        };
      }
      
      if (response.status === 500) {
        throw new Error(`Date out of range: ${error.detail.range_supported}`);
      }
      
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const chart = await response.json();
    
    // Store chart for future use
    localStorage.setItem('natalChart', JSON.stringify(chart));
    
    return chart;
  } catch (error) {
    console.error('Failed to compute natal chart:', error);
    throw error;
  }
}

// Usage
const chart = await computeNatalChart({
  datetime: '2000-01-01T08:30:00',
  city: 'New York',
  mode: 'z13'
});
```

---

### Compute Natal Chart (Using Explicit Location)

```javascript
async function computeNatalChartWithLocation(birthData) {
  const {
    datetime,
    location,
    mode = 'z13',
    returnBothSystems = false
  } = birthData;

  const payload = {
    datetime,
    mode,
    return_both_systems: returnBothSystems,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
      name: location.name,
      source: location.source || 'user'
    }
  };

  try {
    const response = await fetch('/natal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to compute natal chart:', error);
    throw error;
  }
}

// Usage (after user selects from location search)
const selectedCity = {
  latitude: 43.6532,
  longitude: -79.3832,
  timezone: 'America/Toronto',
  name: 'Toronto, Ontario, Canada'
};

const chart = await computeNatalChartWithLocation({
  datetime: '2000-01-01T12:00:00',
  location: selectedCity,
  mode: 'z13'
});
```

---

### Handling Ambiguous City (409 Response)

```javascript
async function computeNatalChartWithDisambiguation(birthData) {
  try {
    const chart = await computeNatalChart(birthData);
    return chart;
  } catch (error) {
    // Check if error contains candidates (409 response)
    if (error.candidates) {
      // Show disambiguation UI
      const selectedCity = await showCityDisambiguationUI(error.candidates);
      
      // Retry with explicit location
      return await computeNatalChartWithLocation({
        ...birthData,
        location: {
          latitude: selectedCity.latitude,
          longitude: selectedCity.longitude,
          timezone: selectedCity.timezone,
          name: `${selectedCity.name}, ${selectedCity.region}, ${selectedCity.country}`
        }
      });
    }
    throw error;
  }
}

// Example disambiguation UI helper (pseudo-code)
async function showCityDisambiguationUI(candidates) {
  return new Promise((resolve) => {
    // Show modal or dropdown with candidates
    // User selects one
    // resolve(selectedCandidate)
  });
}
```

---

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useLunarEvents(startDate = null, days = 14, mode = 'z13') {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchLunarEvents(startDate, days, mode);
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [startDate, days, mode]);

  return { events, loading, error };
}

// Usage in component
function LunarEventsView() {
  const { events, loading, error } = useLunarEvents(null, 14, 'z13');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!events) return null;

  return (
    <div>
      <h2>Lunar Events ({events.mode})</h2>
      {events.events.map((event, idx) => (
        <div key={idx}>
          <strong>{event.event_type}</strong>: {event.sign} - {event.description}
        </div>
      ))}
    </div>
  );
}
```

---

### Error Handling Utility

```javascript
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      
      // Map status codes to user-friendly messages
      const statusMessages = {
        400: 'Invalid request',
        404: 'Resource not found',
        409: 'Conflict (ambiguous city)',
        422: 'Validation error',
        500: 'Server error'
      };
      
      throw new Error(error.detail || statusMessages[response.status] || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      throw new Error('Network error: Please check your connection');
    }
    throw error;
  }
}

// Usage
const data = await apiRequest('/positions/now?mode=z13');
```

---

## Appendix: Quick Reference

### Endpoint Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/positions` | GET | Get planetary positions | No |
| `/positions/now` | GET | Get current positions | No |
| `/lunar_events` | GET | Get lunar phases/ingresses | No |
| `/location/search` | GET | Search cities | No |
| `/natal` | POST | Compute natal chart | No |
| `/meta/ping` | GET | Health check | No |

### Common Status Codes

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| `200` | Success | Request completed successfully |
| `400` | Bad Request | Invalid parameters (e.g., wrong mode) |
| `404` | Not Found | City not found |
| `409` | Conflict | Ambiguous city (multiple matches) |
| `422` | Unprocessable Entity | Validation error (missing required field) |
| `500` | Server Error | Date out of range or internal error |

### Zodiac Modes

- **`z13`**: True-sky (Z13) zodiac system (default)
- **`tropical`**: Tropical zodiac system

### Date Range Support

- **Ephemeris Range**: 1800-01-01 to 2150-12-31
- **Lunar Events Window**: 1-90 days

---

**End of Document**

