# Z13 Astrology API Documentation

**Version:** 0.1.2  
**Base URL:** `http://127.0.0.1:9002` (local development)  
**Content-Type:** `application/json`  
**API Format:** RESTful JSON API

## Table of Contents

1. [General Information](#general-information)
2. [Authentication](#authentication)
3. [Security Features](#security-features)
4. [Common Patterns](#common-patterns)
5. [Error Handling](#error-handling)
6. [Endpoints](#endpoints)
   - [Meta](#meta-endpoints)
   - [Positions](#positions-endpoints)
   - [Lunar Events](#lunar-events-endpoint)
   - [Location Search](#location-search-endpoint)
   - [Natal Chart](#natal-chart-endpoint)
   - [Chart Snapshots](#chart-snapshots-endpoints)
   - [Transits](#transits-endpoints)
   - [Interpretations](#interpretations-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Natal Data](#natal-data-endpoints)
   - [Admin](#admin-endpoints)

---

## General Information

### Date/Time Handling
- All timestamps are ISO-8601 format
- UTC timezone is assumed if timezone is missing from datetime strings
- Date-only values (e.g., `2000-01-01`) default to noon local time (or UTC if no location provided)

### Zodiac Systems
The API supports two zodiac systems:
- **`z13`** (default) - True-sky zodiac system
- **`tropical`** - Traditional tropical zodiac
- **`both`** - Returns data in both systems (available for `/positions` and `/lunar_events` endpoints)

---

## Authentication

**Configurable API Key Authentication**

API key authentication is configurable via the `REQUIRE_API_KEY` setting (default: `true`).

**When `REQUIRE_API_KEY=true` (default):**
All endpoints (except health check endpoints) require API key authentication via the `X-API-Key` header.

**When `REQUIRE_API_KEY=false`:**
All endpoints are accessible without authentication. This is useful for localhost-only deployments where network isolation provides sufficient security.

**Configuration:**
Set `REQUIRE_API_KEY=false` in your `.env` file to disable API key authentication. When disabled, all endpoints (except health checks) are accessible without authentication.

**Request Header (when REQUIRE_API_KEY=true):**
```
X-API-Key: your-api-key-here
```

**Public Endpoints (Never Require Authentication):**
- `/meta/ping` - Basic health check endpoint
- `/meta/health/live` - Liveness probe for container orchestration
- `/meta/health/ready` - Readiness probe for container orchestration

**Protected Endpoints (when REQUIRE_API_KEY=true):**
- `/positions` and `/positions/now`
- `/lunar_events`
- `/location/search`
- `/charts/natal`
- `/transits/today`
- `/interpretations` (all endpoints)

**Public Endpoints (No Authentication Required):**
- `/transits/aspects/now` - Compute transiting-to-natal aspects at current time
- `/transits/vibes/now` - Compute vibes of the day and cosmic season from transiting-to-natal aspects

**Example (when REQUIRE_API_KEY=true):**
```bash
curl -H "X-API-Key: your-api-key-here" http://127.0.0.1:9002/positions
```

**Example (when REQUIRE_API_KEY=false):**
```bash
curl http://127.0.0.1:9002/positions
```

**Using Swagger UI:**
The interactive API documentation at `/docs` includes built-in API key authentication:
1. Visit `http://127.0.0.1:9002/docs` in your browser
2. Click the "Authorize" button (lock icon) at the top right of the page
3. Enter your API key in the `X-API-Key` field
4. Click "Authorize" and then "Close"
5. All protected endpoints will now automatically include your API key when you test them from Swagger UI

**Error Response (403 Forbidden):**
```json
{
  "detail": "Not authorized"
}
```

---

## Security Features

The API implements multiple security layers to protect against abuse and ensure secure operation.

### Rate Limiting

All endpoints are protected by rate limiting to prevent abuse and ensure fair usage. Rate limits vary by endpoint complexity:

| Endpoint | Rate Limit | Reason |
|----------|------------|--------|
| `/meta/ping` | 100/minute | Health check, lightweight |
| `/interpretations/*` | 60/minute | Read-only data access |
| `/positions`, `/location/search` | 30/minute | Moderate computation |
| `/lunar_events` | 20/minute | Moderate computation |
| `/charts/natal`, `/transits/today`, `/transits/aspects/now`, `/transits/vibes/now` | 10/minute | Expensive computation |

**Rate Limit Response:**
- HTTP Status: `429 Too Many Requests`
- Response includes `Retry-After: 60` header
- Example response:
  ```json
  {
    "error": "Rate limit exceeded",
    "detail": "10/minute"
  }
  ```

### Request Size Limits

- **Maximum request body size:** 1MB (1,048,576 bytes)
- Configurable via `MAX_REQUEST_SIZE` environment variable
- Oversized requests return HTTP `413 Request Entity Too Large`

### Request Timeouts

Expensive operations have timeout protection to prevent resource exhaustion:

- **`/charts/natal` endpoint:** 30 seconds (configurable via `TIMEOUT_NATAL_SECONDS`)
- **`/transits/today` endpoint:** 30 seconds (configurable via `TIMEOUT_TRANSITS_SECONDS`)

Timeout exceeded returns HTTP `504 Gateway Timeout` with a message suggesting simpler parameters.

### Security Headers

All responses include security headers:

- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking attacks
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Content-Security-Policy: default-src 'self'` - Basic CSP for API
- `Strict-Transport-Security` - HSTS (production only, when HTTPS is configured)

### Error Message Sanitization

**Production Environment:**
- Error messages are sanitized to prevent information disclosure
- Generic messages are returned (e.g., "Invalid input provided")
- No internal details, file paths, or stack traces are exposed
- Full error details are logged server-side for debugging

**Development Environment:**
- Detailed error messages are returned for debugging
- Full exception information is available

### CORS Configuration

- **Development:** Allows localhost access (configurable)
- **Production:** Only explicitly configured origins (no localhost)
- Credentials support enabled for authenticated requests

### Logging and Monitoring

All security events are logged:
- Authentication failures
- Rate limit violations
- Oversized request attempts
- Operation timeouts
- All errors with full context

Logs are structured (JSON in production) for easy analysis and monitoring.

### Request Correlation IDs

Every request receives a unique request ID for correlation and tracing:
- **Header:** `X-Request-ID` (automatically generated if not provided)
- **Usage:** Included in all log entries and error responses
- **Benefits:** 
  - Trace requests across distributed systems
  - Correlate logs for debugging
  - Track request flow through middleware and handlers
- **Upstream Support:** If a request includes `X-Request-ID` header, it will be preserved and used

**Example:**
```bash
# Request ID is automatically added
curl -H "X-API-Key: your-api-key" http://127.0.0.1:9002/positions

# Response includes X-Request-ID header
# X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

---

## Common Patterns

### Response Format
All successful responses return JSON with the following structure:
```json
{
  "field1": "...",
  "field2": [...],
  ...
}
```

### Error Response Format
Errors return JSON with status codes:
```json
{
  "detail": "Error message or object"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Common Scenarios |
|------|---------|------------------|
| `200` | Success | Successful request |
| `400` | Bad Request | Invalid parameters, unsupported mode, missing required fields |
| `403` | Forbidden | Invalid or missing API key |
| `404` | Not Found | City not found, interpretation not found, category not found |
| `409` | Conflict | Ambiguous city (multiple candidates) |
| `413` | Request Entity Too Large | Request body exceeds maximum size (1MB default) |
| `422` | Unprocessable Entity | Validation errors, missing query parameters |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side errors, date out of range |
| `504` | Gateway Timeout | Operation timed out (30 seconds for expensive operations) |

### Example Error Responses

**400 Bad Request:**
```json
{
  "detail": "Unsupported mode 'invalid'. Expected 'z13' or 'tropical'."
}
```

**403 Forbidden (Authentication Failed):**
```json
{
  "detail": "Not authorized"
}
```

**404 Not Found:**
```json
{
  "detail": {
    "error": "City not found",
    "query": "atlantis"
  }
}
```

**409 Conflict:**
```json
{
  "detail": {
    "error": "Ambiguous city",
    "candidates": [
      {"city": "Springfield", "region": "Illinois", "country": "US"},
      {"city": "Springfield", "region": "Massachusetts", "country": "US"}
    ]
  }
}
```

**413 Request Entity Too Large:**
```json
{
  "detail": "Request body too large. Maximum size: 1048576 bytes"
}
```

**422 Unprocessable Entity:**
```json
{
  "detail": "Invalid input provided"
}
```

**429 Too Many Requests (Rate Limit Exceeded):**
```json
{
  "error": "Rate limit exceeded",
  "detail": "10/minute"
}
```
*Response includes `Retry-After: 60` header*

**504 Gateway Timeout:**
```json
{
  "detail": "Operation 'natal_chart_computation' timed out after 30.0 seconds. Please try again with simpler parameters."
}
```

### Error Message Sanitization

**Production Environment:**
- Error messages are sanitized to prevent information disclosure
- Generic messages are returned (e.g., "Invalid input provided")
- No internal details, file paths, or stack traces are exposed
- Full error details are logged server-side for debugging

**Development Environment:**
- Detailed error messages are returned for debugging
- Full exception information is available

---

---

## Endpoints

## Meta Endpoints

### GET `/meta/ping`

Basic health check endpoint for uptime monitoring and version verification.

**Request:**
- Method: `GET`
- Parameters: None
- Authentication: Not required

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.2",
  "timestamp": "2025-11-12T10:00:00Z"
}
```

**Fields:**
- `status` (string) - Always `"ok"` for successful health check
- `version` (string) - Application semantic version
- `timestamp` (datetime) - Server timestamp when response was generated (ISO-8601 UTC)

**Example:**
```bash
# No authentication required for health check
curl http://127.0.0.1:9002/meta/ping
```

### GET `/meta/health/live`

Liveness probe endpoint for Kubernetes/Docker health checks. Returns 200 if the server is running.

**Request:**
- Method: `GET`
- Parameters: None
- Authentication: Not required

**Response:**
```json
{
  "status": "alive",
  "timestamp": "2025-11-12T10:00:00Z"
}
```

**Fields:**
- `status` (string) - Always `"alive"` when server is running
- `timestamp` (string) - Server timestamp (ISO-8601 UTC)

**Use Case:** Kubernetes liveness probe - indicates the container is running and should not be restarted.

**Example:**
```bash
curl http://127.0.0.1:9002/meta/health/live
```

### GET `/meta/health/ready`

Readiness probe endpoint for Kubernetes/Docker health checks. Verifies all critical dependencies are available.

**Request:**
- Method: `GET`
- Parameters: None
- Authentication: Not required

**Response (200 OK - Healthy):**
```json
{
  "status": "healthy",
  "dependencies": [
    {
      "name": "ephemeris_current_cache",
      "status": "healthy",
      "message": "File accessible with 1,234,567 rows",
      "details": {
        "path": "data/ephemeris/current/current.parquet",
        "rows": 1234567
      }
    },
    {
      "name": "lunar_phase_cache",
      "status": "healthy",
      "message": "File accessible with 50,000 rows",
      "details": {
        "path": "data/cache/lunar_phase_cache.parquet",
        "rows": 50000
      }
    }
  ],
  "timestamp": "2025-11-12T10:00:00Z"
}
```

**Response (503 Service Unavailable - Unhealthy):**
```json
{
  "status": "unhealthy",
  "dependencies": [
    {
      "name": "ephemeris_current_cache",
      "status": "unhealthy",
      "message": "File not found: data/ephemeris/current/current.parquet",
      "details": {
        "path": "data/ephemeris/current/current.parquet"
      }
    }
  ],
  "timestamp": "2025-11-12T10:00:00Z"
}
```

**Fields:**
- `status` (string) - Overall status: `"healthy"`, `"degraded"`, or `"unhealthy"`
- `dependencies` (array) - List of dependency statuses
  - `name` (string) - Dependency name
  - `status` (string) - Dependency status: `"healthy"`, `"degraded"`, or `"unhealthy"`
  - `message` (string) - Human-readable status message
  - `details` (object, optional) - Additional details (path, row count, etc.)
- `timestamp` (string) - Server timestamp (ISO-8601 UTC)

**Status Codes:**
- `200` - All dependencies healthy or degraded (service is ready)
- `503` - One or more dependencies unhealthy (service is not ready)

**Checked Dependencies:**
- `ephemeris_current_cache` - Current ephemeris data cache
- `lunar_phase_cache` - Lunar phase events cache
- `lunar_ingress_z13_cache` - Z13 lunar ingress events cache
- `lunar_ingress_tropical_cache` - Tropical lunar ingress events cache
- `cities_cache` - Cities location cache

**Use Case:** Kubernetes readiness probe - indicates the service is ready to accept traffic. Traffic is routed only when status is 200.

**Example:**
```bash
curl http://127.0.0.1:9002/meta/health/ready
```

---

## Positions Endpoints

### GET `/positions`

Get planetary positions for a specific datetime.

**Request:**
- Method: `GET`
- Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `datetime` | string | No | current UTC time | ISO-8601 timestamp. UTC assumed if timezone missing |
| `mode` | string | No | `z13` | `z13` (true-sky), `tropical`, or `both` |
| `bodies` | string[] | No | all planets | Repeat parameter for multiple (e.g., `bodies=Sun&bodies=Moon`) |

**Response (when `mode` is `z13` or `tropical`):**
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
      "sign": "Sagittarius",
      "source": "current cache"
    }
  ]
}
```

**Response (when `mode` is `both`):**
```json
{
  "positions_z13": [
    {
      "body": "Sun",
      "mode": "z13",
      "longitude": 280.13,
      "latitude": 0.0,
      "speed": 0.99,
      "retrograde": false,
      "distance_km": 149600000.0,
      "sign": "Sagittarius",
      "source": "current cache"
    }
  ],
  "positions_tropical": [
    {
      "body": "Sun",
      "mode": "tropical",
      "longitude": 280.13,
      "latitude": 0.0,
      "speed": 0.99,
      "retrograde": false,
      "distance_km": 149600000.0,
      "sign": "Capricorn",
      "source": "current cache"
    }
  ]
}
```

**Fields (when `mode` is `z13` or `tropical`):**
- `positions` (array) - List of position objects
  - `body` (string) - Celestial body name (e.g., "Sun", "Moon", "Mars")
  - `mode` (string) - Zodiac system used (`z13` or `tropical`)
  - `longitude` (float) - Ecliptic longitude in degrees
  - `latitude` (float | null) - Ecliptic latitude in degrees
  - `speed` (float | null) - Daily motion in degrees/day
  - `retrograde` (boolean | null) - Retrograde flag (null when not applicable)
  - `distance_km` (float | null) - Approximate distance from Earth in kilometers
  - `sign` (string) - Formatted placement label for the selected mode
  - `source` (string | null) - Ephemeris tier used for lookup

**Fields (when `mode` is `both`):**
- `positions_z13` (array) - List of position objects in Z13 (true-sky) zodiac system
- `positions_tropical` (array) - List of position objects in tropical zodiac system
- Each position object has the same structure as above, with `mode` set to the respective system

**Examples:**
```bash
# Current positions (z13 mode, default)
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/positions"

# Specific datetime, tropical mode
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/positions?datetime=2025-01-01T00:00:00Z&mode=tropical"

# Both zodiac systems
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/positions?mode=both"

# Only Sun and Moon in both systems
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/positions?bodies=Sun&bodies=Moon&mode=both"
```

### GET `/positions/now`

Get planetary positions at the current UTC time.

**Request:**
- Method: `GET`
- Query Parameters: Same as `/positions` (except `datetime` is ignored)

**Response:** Same as `/positions` (supports `mode=both` with grouped response)

**Examples:**
```bash
# Current positions, tropical mode
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/positions/now?mode=tropical"

# Current positions in both systems
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/positions/now?mode=both"
```

---

## Lunar Events Endpoint

### GET `/lunar_events`

Get upcoming lunar phases and ingresses, enriched with micro-interpretations.

**Request:**
- Method: `GET`
- Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `datetime` | string | No | current UTC | Start of window (UTC ISO-8601) |
| `days` | integer | No | 14 | Range length (1-90 days) |
| `mode` | string | No | `z13` | `z13` (true-sky), `tropical`, or `both` |

**Response (when `mode` is `z13` or `tropical`):**
```json
{
  "start": "2025-01-01T00:00:00Z",
  "end": "2025-01-15T00:00:00Z",
  "mode": "z13",
  "events": [
    {
      "datetime": "2025-01-02T12:34:00Z",
      "event_type": "phase",
      "sign": "Sagittarius",
      "phase": "first_quarter",
      "description": "First quarter moon in Sagittarius invites exploration...",
      "notes": "Ideal time for initiating travel plans...",
      "keywords": ["exploration", "adventure", "movement"]
    },
    {
      "datetime": "2025-01-03T08:21:00Z",
      "event_type": "ingress",
      "sign": "Capricorn",
      "phase": null,
      "description": "Moon enters Capricorn, bringing focus to structure...",
      "notes": "Time to set practical goals...",
      "keywords": ["structure", "discipline", "ambition"]
    }
  ]
}
```

**Response (when `mode` is `both`):**
```json
{
  "start": "2025-01-01T00:00:00Z",
  "end": "2025-01-15T00:00:00Z",
  "mode": "both",
  "events_z13": [
    {
      "datetime": "2025-01-02T12:34:00Z",
      "event_type": "phase",
      "sign": "Sagittarius",
      "phase": "first_quarter",
      "description": "First quarter moon in Sagittarius invites exploration...",
      "notes": "Ideal time for initiating travel plans...",
      "keywords": ["exploration", "adventure", "movement"]
    }
  ],
  "events_tropical": [
    {
      "datetime": "2025-01-02T12:34:00Z",
      "event_type": "phase",
      "sign": "Capricorn",
      "phase": "first_quarter",
      "description": "First quarter moon in Capricorn invites structure...",
      "notes": "Ideal time for setting goals...",
      "keywords": ["structure", "discipline", "focus"]
    }
  ]
}
```

**Fields (when `mode` is `z13` or `tropical`):**
- `start` (datetime) - Inclusive UTC start of the query window
- `end` (datetime) - Exclusive UTC end of the query window
- `mode` (string) - Zodiac system used (`z13` or `tropical`)
- `events` (array) - List of lunar event objects

**Fields (when `mode` is `both`):**
- `start` (datetime) - Inclusive UTC start of the query window
- `end` (datetime) - Exclusive UTC end of the query window
- `mode` (string) - Always `"both"`
- `events_z13` (array) - List of lunar events in Z13 (true-sky) zodiac system
- `events_tropical` (array) - List of lunar events in tropical zodiac system
  - `datetime` (datetime) - UTC timestamp for the event
  - `event_type` (string) - Either `"phase"` or `"ingress"`
  - `sign` (string) - Sign associated with the event
  - `phase` (string | null) - Phase key for phase events (`new`, `first_quarter`, `full`, `last_quarter`) or `null` for ingresses
  - `description` (string) - Micro-interpretation description
  - `notes` (string | null) - Supplementary notes or rituals
  - `keywords` (array) - Associated keywords

**Examples:**
```bash
# Default (next 14 days, z13 mode)
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/lunar_events"

# 30 days, tropical mode
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/lunar_events?days=30&mode=tropical"

# Both zodiac systems
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/lunar_events?mode=both"

# Specific start date, 7 days, both systems
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/lunar_events?datetime=2025-06-01T00:00:00Z&days=7&mode=both"
```

---

## Location Search Endpoint

### GET `/location/search`

Search for cities used in natal chart calculations. Returns cached results when available, falls back to geopy otherwise.

**Request:**
- Method: `GET`
- Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Partial or full city name (case-insensitive) |
| `limit` | integer | No | 10 | Maximum number of results (1-25) |

**Response:**
```json
{
  "query": "toron",
  "count": 2,
  "results": [
    {
      "city": "Toronto",
      "region": "Ontario",
      "country": "Canada",
      "latitude": 43.6532,
      "longitude": -79.3832,
      "timezone": "America/Toronto"
    },
    {
      "city": "Toroni",
      "region": "Central Macedonia",
      "country": "Greece",
      "latitude": 40.0000,
      "longitude": 23.9333,
      "timezone": "Europe/Athens"
    }
  ],
  "source": "cache"
}
```

**Fields:**
- `query` (string) - The search query used
- `count` (integer) - Number of results returned
- `results` (array) - List of city records
  - `city` (string) - City name
  - `region` (string | null) - Region, state, or subdivision name
  - `country` (string | null) - Country name
  - `latitude` (float | null) - Latitude in decimal degrees
  - `longitude` (float | null) - Longitude in decimal degrees
  - `timezone` (string | null) - IANA timezone identifier
- `source` (string) - Data source: `"cache"`, `"geopy"`, or `"none"`
- `message` (string | null) - Optional message (e.g., when no results found)

**Error Responses:**
- `422` - Missing `q` parameter
- `404` - No matching location found (returns `source: "none"` with message)

**Examples:**
```bash
# Basic search
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/location/search?q=toron"

# Limit results
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/location/search?q=new&limit=5"
```

---

## Natal Chart Endpoint

### POST `/charts/natal`

Compute a natal chart with planetary positions and chart angles (ASC, DSC, MC, IC).

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Request Body:

```json
{
  "datetime": "2000-01-01T08:30:00-05:00",
  "mode": "z13",
  "return_both_systems": false,
  "location": {
    "latitude": 40.0,
    "longitude": -75.0,
    "timezone": "America/New_York"
  },
  "include_nodes": true,
  "include_lilith": true,
  "bodies": null,
  "house_system": "whole_sign"
}
```

**Request Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `datetime` | string | Yes | - | ISO-8601 datetime. Date-only accepted; defaults to noon local |
| `location` | object | * | - | Location coordinates (required if no `city`) |
| `location.latitude` | float | * | - | Latitude in decimal degrees |
| `location.longitude` | float | * | - | Longitude in decimal degrees |
| `location.timezone` | string | * | - | IANA timezone (e.g., `America/New_York`) |
| `city` | string | * | - | City name (alternative to `location` coordinates) |
| `mode` | string | No | `z13` | `z13` (true-sky) or `tropical` |
| `return_both_systems` | boolean | No | `false` | Include both Z13 and tropical placements |
| `include_nodes` | boolean | No | `true` | Include North/South Node |
| `include_lilith` | boolean | No | `true` | Include Lilith |
| `bodies` | array | No | all | Filter to specific bodies (e.g., `["Sun", "Moon"]`) |
| `house_system` | string | No | `whole_sign` | House system (currently only `whole_sign` supported) |

*Either `location` coordinates or `city` must be provided.

**Response:**
```json
{
  "metadata": {
    "datetime_local": "2000-01-01T08:30:00-05:00",
    "datetime_utc": "2000-01-01T13:30:00Z",
    "time_inferred": false,
    "location": {
      "latitude": 40.0,
      "longitude": -75.0,
      "timezone": "America/New_York",
      "name": "Philadelphia, US",
      "source": "cache"
    },
    "mode": "z13",
    "capabilities": ["planets", "angles"],
    "confidence": {
      "planets": "high",
      "moon": "high",
      "angles": "high",
      "houses": "none"
    }
  },
  "positions": [
    {
      "body": "Sun",
      "longitude": 280.13,
      "placement": {
        "sign": "Sagittarius",
        "sign_degree": 10.13,
        "label": "Sagittarius (10.13°)"
      },
      "placement_alt": null
    }
  ],
  "angles": [
    {
      "angle": "ASC",
      "longitude": 273.84,
      "placement": {
        "sign": "Sagittarius",
        "sign_degree": 6.78,
        "label": "Sagittarius (6.78°)"
      },
      "placement_alt": null
    },
    {
      "angle": "DSC",
      "longitude": 93.84,
      "placement": {
        "sign": "Gemini",
        "sign_degree": 5.97,
        "label": "Gemini (5.97°)"
      },
      "placement_alt": null
    },
    {
      "angle": "MC",
      "longitude": 203.60,
      "placement": {
        "sign": "Virgo",
        "sign_degree": 30.71,
        "label": "Virgo (30.71°)"
      },
      "placement_alt": null
    },
    {
      "angle": "IC",
      "longitude": 23.60,
      "placement": {
        "sign": "Pisces",
        "sign_degree": 34.31,
        "label": "Pisces (34.31°)"
      },
      "placement_alt": null
    }
  ],
  "houses": null,
  "notes": null
}
```

**Response Fields:**

- `metadata` (object) - Chart metadata
  - `datetime_local` (string) - Local birth datetime (ISO-8601)
  - `datetime_utc` (string) - UTC birth datetime (ISO-8601)
  - `time_inferred` (boolean) - Whether time was inferred (defaulted to noon)
  - `location` (object) - Location information
    - `latitude` (float) - Latitude
    - `longitude` (float) - Longitude
    - `timezone` (string) - IANA timezone
    - `name` (string | null) - Resolved city name (if city was provided)
    - `source` (string) - Location source (`"cache"` or `"geopy"`)
  - `mode` (string) - Zodiac system used
  - `capabilities` (array) - Available features: `["planets", "angles", "houses"]`
  - `confidence` (object) - Confidence levels for each feature (`"high"`, `"medium"`, `"low"`, `"none"`)
- `positions` (array) - Planetary positions
  - `body` (string) - Body name
  - `longitude` (float) - Ecliptic longitude
  - `placement` (object) - Primary placement (matches requested mode)
    - `sign` (string) - Zodiac sign
    - `sign_degree` (float) - Degree within sign
    - `label` (string) - Formatted label
  - `placement_alt` (object | null) - Alternate placement (only if `return_both_systems: true`)
- `angles` (array | null) - Chart angles (ASC, DSC, MC, IC) - computed when location provided
  - `angle` (string) - Angle name (`"ASC"`, `"DSC"`, `"MC"`, `"IC"`)
  - `longitude` (float) - Ecliptic longitude
  - `placement` (object) - Placement in primary system
  - `placement_alt` (object | null) - Placement in alternate system (if `return_both_systems: true`)
- `houses` (array | null) - House cusps (currently not implemented, returns `null`)
- `notes` (array | null) - Optional notes about inferred data or limitations

**Error Responses:**
- `400` - Invalid mode, missing location/city
- `404` - City not found
- `409` - Ambiguous city (multiple candidates)
- `422` - Validation errors, invalid datetime format
- `500` - Date out of range, server errors

**Key Behaviors:**
- If `city` is supplied without `location`, the service uses `/location/search` internally
- Date-only requests default to 12:00 local time
- Angles (ASC, DSC, MC, IC) are computed when location is provided
- Angles respect `return_both_systems` for alternate placements
- Houses computation is pending (returns `null`)

**Examples:**
```bash
# Using coordinates
curl -X POST http://127.0.0.1:9002/charts/natal \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "datetime": "2000-01-01T08:30:00-05:00",
    "location": {
      "latitude": 40.0,
      "longitude": -75.0,
      "timezone": "America/New_York"
    }
  }'

# Using city name
curl -X POST http://127.0.0.1:9002/charts/natal \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "datetime": "1966-10-28T09:30:00",
    "city": "Edmonton",
    "mode": "z13"
  }'

# With both zodiac systems
curl -X POST http://127.0.0.1:9002/charts/natal \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "datetime": "2000-01-01T08:30:00-05:00",
    "location": {
      "latitude": 40.0,
      "longitude": -75.0,
      "timezone": "America/New_York"
    },
    "return_both_systems": true
  }'
```

**Note:** This endpoint has a 30-second timeout. Complex requests may time out if processing takes too long.

---

## Chart Snapshots Endpoints

### GET `/charts/snapshots/{snapshot_key}/placements`

Get placements computed from a stored chart snapshot. This endpoint reads absolute ecliptic longitudes from a chart snapshot and computes sign/degree placements for the requested zodiac system(s). It does NOT call the heavy natal computation pipeline.

**Request:**
- Method: `GET`
- Path Parameters:
  - `snapshot_key` (string) - Snapshot key (usually "natal")
- Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `natal_id` | uuid | No | - | Natal data ID (uses user's default if not provided) |
| `zodiac` | string | No | `z13` | Zodiac system: `"z13"`, `"tropical"`, or `"both"` |
| `include_angles` | boolean | No | `true` | Include angles (ASC, MC, etc.) in response |
| `include_houses` | boolean | No | `false` | Include houses in response (requires valid angles and birth time) |
| `house_system` | string | No | - | House system (currently only `"whole-sign"` is supported) |

**Authentication:** Required (cookie-based session)

**Response:**
```json
{
  "snapshot_key": "natal",
  "natal_id": "550e8400-e29b-41d4-a716-446655440000",
  "computed_at": "2025-01-15T10:30:00Z",
  "zodiac_requested": "z13",
  "placements": {
    "z13": {
      "positions": [
        {
          "body": "Sun",
          "abs": {
            "lon": 123.45,
            "lat": 0.0,
            "retrograde": false
          },
          "placement": {
            "sign": "Leo",
            "sign_degree": 13.45,
            "label": "Leo (13.45°)",
            "house": 5
          }
        }
      ],
      "angles": [
        {
          "angle": "ASC",
          "abs": {
            "lon": 101.86
          },
          "placement": {
            "sign": "Cancer",
            "sign_degree": 7.71,
            "label": "Cancer (7.71°)",
            "house": 1
          }
        }
      ],
      "houses": [
        {
          "house": 1,
          "abs": {
            "lon": 101.86
          },
          "placement": {
            "sign": "Cancer",
            "sign_degree": 7.71,
            "label": "Cancer (7.71°)",
            "house": 1
          }
        }
      ]
    }
  }
}
```

**Response Fields:**
- `snapshot_key` (string) - Snapshot key (usually "natal")
- `natal_id` (uuid) - Natal data ID
- `computed_at` (datetime | null) - Snapshot computation timestamp (ISO-8601 UTC)
- `zodiac_requested` (string) - Zodiac system requested (`"z13"`, `"tropical"`, or `"both"`)
- `placements` (object) - Placements by zodiac system
  - Keys: `"z13"`, `"tropical"`, or both if `zodiac="both"`
  - Each value contains:
    - `positions` (array) - Body placements
      - `body` (string) - Body name (Sun, Moon, etc.)
      - `abs` (object) - Absolute position
        - `lon` (float) - Longitude in degrees (0-360)
        - `lat` (float | null) - Latitude in degrees
        - `retrograde` (boolean | null) - Retrograde status
      - `placement` (object) - Placement information
        - `sign` (string) - Sign name
        - `sign_degree` (float) - Degrees within sign
        - `label` (string) - Formatted label (e.g., "Leo (13.45°)")
        - `house` (integer | null) - House number (1-12) if houses are computed
    - `angles` (array | null) - Angle placements (null if not available)
      - Same structure as positions, with `angle` field instead of `body`
      - `angle` (string) - Angle name (ASC, MC, DSC, IC)
    - `houses` (array | null) - House placements (null if not computed)
      - `house` (integer) - House number (1-12)
      - `abs` (object) - Absolute position (lon only)
      - `placement` (object) - Placement information

**Key Behaviors:**
- If `natal_id` is not provided, uses the user's default natal data (`is_default=true`)
- When `zodiac="z13"` or `zodiac="tropical"`, only that key is returned in `placements`
- When `zodiac="both"`, both `"z13"` and `"tropical"` keys are returned
- `angles` is `null` (not empty array) when angles are not valid/available
- `houses` is `null` (not empty array) when houses are not computed
- `placement.house` is populated for positions and angles when houses are computed
- House computation requires valid angles (ASC) and birth time (`birth_time_provided=true`)

**Error Responses:**
- `401` - Not authenticated (missing or invalid session cookie)
- `404` - Natal data not found, snapshot not found, or no default natal data
- `422` - House computation not possible/implemented (e.g., invalid house_system, missing angles)

**Examples:**
```bash
# Get placements for default natal (z13)
curl -b cookies.txt "http://127.0.0.1:9002/charts/snapshots/natal/placements"

# Get placements for specific natal (tropical)
curl -b cookies.txt "http://127.0.0.1:9002/charts/snapshots/natal/placements?natal_id=550e8400-e29b-41d4-a716-446655440000&zodiac=tropical"

# Get both zodiac systems with houses
curl -b cookies.txt "http://127.0.0.1:9002/charts/snapshots/natal/placements?zodiac=both&include_houses=true&house_system=whole-sign"

# Get placements without angles
curl -b cookies.txt "http://127.0.0.1:9002/charts/snapshots/natal/placements?include_angles=false"
```

**Note:** This endpoint is fast and does not read ephemeris files or call the heavy natal computation pipeline. It only performs placement math on stored absolute longitudes.

---

## Transits Endpoint

### GET `/transits/today`

Compute top transits to a natal chart. Returns the most significant transiting aspects currently active, ranked by orb tightness, aspect type, and planet significance.

**Request:**
- Method: `GET`
- Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `natal_datetime` | string | Yes | - | ISO-8601 birth datetime. Date-only accepted; defaults to noon local |
| `natal_location_latitude` | float | * | - | Birth latitude (required if no city provided) |
| `natal_location_longitude` | float | * | - | Birth longitude (required if no city provided) |
| `natal_location_timezone` | string | * | - | Birth timezone (e.g., `America/New_York`) |
| `natal_city` | string | * | - | Birth city name (alternative to lat/lon/timezone) |
| `mode` | string | No | `z13` | `z13` (true-sky) or `tropical` |
| `when` | string | No | current UTC | ISO-8601 datetime for transiting positions |
| `limit` | integer | No | 5 | Maximum number of transits to return (1-20) |
| `include_nodes` | boolean | No | `true` | Include North/South Node aspects |
| `include_lilith` | boolean | No | `true` | Include Lilith aspects |

*Either location coordinates (`latitude`, `longitude`, `timezone`) or `city` must be provided.

**Response:**
```json
{
  "datetime": "2025-11-12T12:00:00Z",
  "mode": "z13",
  "count": 5,
  "transits": [
    {
      "transiting_planet": "Sun",
      "natal_planet": "Sun",
      "aspect": "Conjunction",
      "orb": 1.5,
      "interpretation": {
        "title": "Transiting Sun Conjunct Natal Sun",
        "short": "A personal new year begins. Your vitality and identity align for fresh self-expression.",
        "full": "This is your solar return...",
        "keywords": ["identity", "renewal", "vitality"],
        "themes": ["personal"],
        "tone": "neutral",
        "category": "personal",
        "duration": {
          "approx_days": 4,
          "approx_label": "~4 days"
        }
      }
    }
  ]
}
```

**Response Fields:**
- `datetime` (string) - Timestamp for transiting positions (UTC ISO-8601)
- `mode` (string) - Zodiac system used (`z13` or `tropical`)
- `count` (integer) - Number of transits returned
- `transits` (array) - List of transit objects
  - `transiting_planet` (string) - Name of transiting planet
  - `natal_planet` (string) - Name of natal planet being aspected
  - `aspect` (string) - Aspect type (e.g., `"Conjunction"`, `"Opposition"`, `"Square"`, `"Trine"`, `"Sextile"`)
  - `orb` (float) - Orb in degrees (smaller = tighter aspect)
  - `interpretation` (object | null) - Transit interpretation
    - `title` (string) - Interpretation title
    - `short` (string) - Short description
    - `full` (string) - Full interpretation text
    - `keywords` (array) - Associated keywords
    - `themes` (array) - Thematic categories
    - `tone` (string) - Tone of the transit (`"positive"`, `"neutral"`, `"challenging"`)
    - `category` (string) - Category (e.g., `"personal"`, `"relationship"`)
    - `duration` (object) - Duration information
      - `approx_days` (integer) - Approximate duration in days
      - `approx_label` (string) - Human-readable duration label

**Error Responses:**
- `400` - Invalid mode, missing location/city, invalid `when` datetime format, `timezone` required with lat/lon
- `404` - City not found
- `409` - Ambiguous city
- `500` - Failed to compute transits

**Examples:**
```bash
# Using coordinates
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/transits/today?natal_datetime=2000-01-01T08:30:00-05:00&natal_location_latitude=40.0&natal_location_longitude=-75.0&natal_location_timezone=America/New_York"

# Using city name
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/transits/today?natal_datetime=2000-01-01T08:30:00-05:00&natal_city=Philadelphia"

# Top 10 transits
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/transits/today?natal_datetime=2000-01-01T08:30:00-05:00&natal_city=Philadelphia&limit=10"

# Future date
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/transits/today?natal_datetime=2000-01-01T08:30:00-05:00&natal_city=Philadelphia&when=2025-12-25T00:00:00Z"

# Exclude nodes and Lilith
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/transits/today?natal_datetime=2000-01-01T08:30:00-05:00&natal_city=Philadelphia&include_nodes=false&include_lilith=false"
```

**Note:** This endpoint has a 30-second timeout. Complex transit calculations may time out if processing takes too long.

### POST `/transits/aspects/now`

Compute transiting-to-natal aspects for the current UTC time. This endpoint accepts partial natal longitudes from the client and computes transiting positions server-side.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Authentication: Not required (public endpoint)
- Request Body:

```json
{
  "natal_longitudes": {
    "Sun": 123.45,
    "Moon": 210.11,
    "Mars": 14.22
  },
  "orb_deg": 2.0,
  "max_hits": 100,
  "include_delta": true
}
```

**Request Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `natal_longitudes` | object | Yes | - | Dict mapping natal body names to ecliptic longitudes (degrees). Valid bodies: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, Lilith |
| `orb_deg` | float | No | 2.0 | Maximum orb in degrees for aspect detection (must be >= 0) |
| `max_hits` | integer | No | 100 | Maximum number of aspects to return (1-720) |
| `include_delta` | boolean | No | true | Include delta_from_exact_deg in response (informational, always included) |

**Response:**
```json
{
  "ok": true,
  "timestamp_utc": "2025-12-20T18:05:00Z",
  "orb_deg": 2.0,
  "max_hits": 100,
  "bodies_used": {
    "transiting": 12,
    "natal": 3
  },
  "aspects_found": [
    {
      "transiting_body": "Mars",
      "natal_body": "Moon",
      "aspect": "square",
      "separation_deg": 89.12,
      "delta_from_exact_deg": 0.88
    },
    {
      "transiting_body": "Venus",
      "natal_body": "Sun",
      "aspect": "trine",
      "separation_deg": 120.34,
      "delta_from_exact_deg": 0.34
    }
  ],
  "stats": {
    "pairs_checked": 36,
    "hits_total": 9,
    "hits_returned": 9
  }
}
```

**Response Fields:**
- `ok` (boolean) - Always `true` for successful responses
- `timestamp_utc` (string) - UTC timestamp when transiting positions were computed (ISO-8601)
- `orb_deg` (float) - Orb used for aspect detection
- `max_hits` (integer) - Maximum hits limit applied
- `bodies_used` (object) - Count of bodies used in computation
  - `transiting` (integer) - Number of transiting bodies (always 12)
  - `natal` (integer) - Number of valid natal bodies provided
- `aspects_found` (array) - List of detected aspects, sorted by delta_from_exact_deg (tightest first)
  - `transiting_body` (string) - Name of transiting body
  - `natal_body` (string) - Name of natal body
  - `aspect` (string) - Aspect type: `"conjunction"`, `"sextile"`, `"square"`, `"trine"`, or `"opposition"`
  - `separation_deg` (float) - Angular separation in degrees (0-180)
  - `delta_from_exact_deg` (float) - Distance from exact aspect angle in degrees
- `stats` (object) - Computation statistics
  - `pairs_checked` (integer) - Total number of transiting/natal pairs checked
  - `hits_total` (integer) - Total number of aspects found within orb
  - `hits_returned` (integer) - Number of aspects returned (after max_hits truncation)

**Supported Aspects:**
- `conjunction` (0°)
- `sextile` (60°)
- `square` (90°)
- `trine` (120°)
- `opposition` (180°)

**Validation:**
- Invalid body names are silently ignored (not an error)
- If no valid natal bodies are provided, returns `400` error
- Longitudes are normalized to [0, 360) range
- Missing bodies are not an error

**Sorting:**
Results are sorted by:
1. `delta_from_exact_deg` ascending (tightest aspects first)
2. `transiting_body` alphabetically
3. `natal_body` alphabetically

**Error Responses:**
- `400` - No valid natal bodies provided
- `422` - Validation errors (invalid orb_deg, max_hits out of range, etc.)
- `500` - Server error during computation

**Examples:**
```bash
# Basic request with 2 natal bodies
curl -X POST "http://127.0.0.1:9002/transits/aspects/now" \
  -H "Content-Type: application/json" \
  -d '{
    "natal_longitudes": {
      "Sun": 123.45,
      "Moon": 210.11
    }
  }'

# Custom orb and max hits
curl -X POST "http://127.0.0.1:9002/transits/aspects/now" \
  -H "Content-Type: application/json" \
  -d '{
    "natal_longitudes": {
      "Sun": 123.45,
      "Moon": 210.11,
      "Venus": 45.67,
      "Mercury": 90.12
    },
    "orb_deg": 5.0,
    "max_hits": 20
  }'
```

**Note:** This endpoint does not require API key authentication. Transiting positions are computed server-side for the current UTC time.

### POST `/transits/vibes/now`

Synthesize "Vibes of the Day" and "General Cosmic Season" summaries from transiting-to-natal aspects. This endpoint computes transiting planetary positions server-side, finds all aspects within the specified orb, scores them using two lenses (inner planets for daily vibes, outer planets for cosmic season), and generates deterministic headlines and summaries using template-based language.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Authentication: Not required (public endpoint)
- Request Body:

```json
{
  "natal_longitudes": {
    "Sun": 123.45,
    "Moon": 210.11,
    "Mars": 14.22
  },
  "orb_deg": 2.0,
  "max_hits": 100,
  "include_debug": false
}
```

**Request Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `natal_longitudes` | object | Yes | - | Dict mapping natal body names to ecliptic longitudes (degrees). Valid bodies: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, Lilith |
| `orb_deg` | float | No | 2.0 | Maximum orb in degrees for aspect detection (must be >= 0) |
| `max_hits` | integer | No | 100 | Maximum number of aspects to consider (1-720) |
| `include_debug` | boolean | No | false | Include raw theme scores in `meta.debug` field |

**Response:**
```json
{
  "ok": true,
  "timestamp_utc": "2025-12-20T18:05:00Z",
  "orb_deg": 2.0,
  "max_hits": 100,
  "vibes_of_the_day": {
    "lens": "inner",
    "tone": "dynamic",
    "confidence": 0.78,
    "headline": "Dynamic and clarifying ⚡",
    "summary": "Energy shifts and opportunities emerge. Communication, transformation themes create a dynamic landscape for action and awareness.",
    "themes": [
      {"name": "communication", "weight": 0.36},
      {"name": "transformation", "weight": 0.28},
      {"name": "structure", "weight": 0.36}
    ],
    "keywords": ["honesty", "momentum", "clarity"],
    "anchors": [
      {
        "transiting_body": "Mars",
        "aspect": "square",
        "natal_body": "Moon",
        "delta_from_exact_deg": 0.88
      }
    ],
    "anchors_source": "lens",
    "energy_profile": {
      "supportive": 0.42,
      "challenging": 0.44,
      "neutral": 0.14
    }
  },
  "cosmic_season": {
    "lens": "outer",
    "tone": "intense",
    "confidence": 0.86,
    "headline": "A transformation-and-structure chapter 🌑",
    "summary": "Cosmic forces align for change. Healing, structure themes shape a dynamic period of evolution and integration.",
    "themes": [
      {"name": "healing", "weight": 0.31},
      {"name": "structure", "weight": 0.25},
      {"name": "transformation", "weight": 0.44}
    ],
    "keywords": ["release", "integration"],
    "anchors": [
      {
        "transiting_body": "Pluto",
        "aspect": "opposition",
        "natal_body": "Saturn",
        "delta_from_exact_deg": 1.12
      }
    ],
    "anchors_source": "lens",
    "energy_profile": {
      "supportive": 0.15,
      "challenging": 0.75,
      "neutral": 0.10
    }
  },
  "meta": {
    "hits_total": 9,
    "hits_used_for_scoring_day": 7,
    "hits_used_for_scoring_season": 5,
    "theme_assignments_used_day": 14,
    "theme_assignments_used_season": 10,
    "algorithm_version": "vibes_v1"
  },
  "aspects_found": [
    {
      "transiting_body": "Mars",
      "natal_body": "Moon",
      "aspect": "square",
      "separation_deg": 89.12,
      "delta_from_exact_deg": 0.88
    }
  ]
}
```

**Response Fields:**
- `ok` (boolean) - Always `true` for successful responses
- `timestamp_utc` (string) - UTC timestamp when transiting positions were computed (ISO-8601)
- `orb_deg` (float) - Orb used for aspect detection
- `max_hits` (integer) - Maximum hits limit applied
- `vibes_of_the_day` (object) - Daily vibes summary (inner planet lens)
  - `lens` (string) - Always `"inner"` for daily vibes
  - `tone` (string) - Overall tone: `"supportive"`, `"challenging"`, or `"dynamic"`
  - `confidence` (float) - Confidence score (0.0 to 1.0) based on number and strength of aspects
  - `headline` (string) - Template-generated headline
  - `summary` (string) - Template-generated summary text
  - `themes` (array) - Top 3 themes with normalized weights (0-1, sum to 1.0)
    - `name` (string) - Theme name
    - `weight` (float) - Normalized weight (0.0 to 1.0)
  - `keywords` (array) - Top 3 keywords (strings)
  - `anchors` (array) - Top 2 anchor aspects (highest strength)
    - `transiting_body` (string) - Transiting body name
    - `aspect` (string) - Aspect type
    - `natal_body` (string) - Natal body name
    - `delta_from_exact_deg` (float) - Distance from exact aspect
  - `anchors_source` (string) - Source of anchors: `"lens"` (filtered by inner planets) or `"fallback"` (best available if no inner planet anchors)
  - `energy_profile` (object) - Energy breakdown
    - `supportive` (float) - Proportion of supportive energy (0.0 to 1.0)
    - `challenging` (float) - Proportion of challenging energy (0.0 to 1.0)
    - `neutral` (float) - Proportion of neutral energy (0.0 to 1.0)
- `cosmic_season` (object) - Cosmic season summary (outer planet lens)
  - Same structure as `vibes_of_the_day`, but:
    - `lens` (string) - Always `"outer"` for cosmic season
    - `tone` (string) - Can be `"supportive"`, `"intense"`, or `"dynamic"` (uses "intense" instead of "challenging")
    - `anchors` filtered to outer planets only (Jupiter, Saturn, Uranus, Neptune, Pluto)
- `meta` (object) - Metadata and statistics
  - `hits_total` (integer) - Total number of unique aspects found (len(aspects_found))
  - `hits_used_for_scoring_day` (integer) - Number of aspects used in day lens scoring
  - `hits_used_for_scoring_season` (integer) - Number of aspects used in season lens scoring
  - `theme_assignments_used_day` (integer) - Total count of (theme, hit) additions in day lens
  - `theme_assignments_used_season` (integer) - Total count of (theme, hit) additions in season lens
  - `algorithm_version` (string) - Algorithm version identifier
  - `debug` (object, optional) - Debug information (only if `include_debug=true`)
    - `theme_scores_raw` (object) - Raw theme scores before normalization
      - `day` (object) - Raw scores for day lens
      - `season` (object) - Raw scores for season lens
- `aspects_found` (array) - List of all aspects found (same structure as `/transits/aspects/now`)

**Scoring System:**

The endpoint uses two scoring lenses:

**Lens A: Vibes of the Day (Inner Planets)**
- Focuses on inner planets: Moon (1.25), Mercury (1.15), Venus (1.10), Mars (1.10), Sun (1.00)
- Outer planets weighted at 0.25, Chiron/Lilith at 0.40

**Lens B: Cosmic Season (Outer Planets)**
- Focuses on outer planets: Pluto (1.25), Neptune (1.20), Uranus (1.20), Saturn (1.15), Jupiter (1.00)
- Chiron (0.80), Lilith (0.60), inner planets at 0.15

**Shared Scoring:**
- Orb weight: `(1 - delta / orb_deg) ** 2`
- Aspect weights: conjunction (1.15), opposition (1.05), square (1.00), trine (0.90), sextile (0.80)
- Final strength: `orb_weight × aspect_weight × planet_weight`

**Tone Calculation:**
- Polarity per aspect: trine (+1.0), sextile (+0.7), square (-1.0), opposition (-0.8), conjunction (0.0)
- Weighted mean polarity:
  - > +0.25 → `"supportive"`
  - < -0.25 → `"challenging"` (inner) or `"intense"` (outer)
  - else → `"dynamic"`

**Theme Normalization:**
- Theme weights are normalized to 0-1 range within each block (day/season)
- Top 3 themes are selected, then normalized so they sum to 1.0
- Raw scores available in `meta.debug.theme_scores_raw` when `include_debug=true`

**Anchor Filtering:**
- Day vibes anchors filtered to inner planets only: Sun, Moon, Mercury, Venus, Mars
- Cosmic season anchors filtered to outer planets only: Jupiter, Saturn, Uranus, Neptune, Pluto
- Chiron/Lilith excluded from anchors by default
- If no anchors exist in filtered set, falls back to best available and sets `anchors_source: "fallback"`

**Validation:**
- Invalid body names are silently ignored (not an error)
- If no valid natal bodies are provided, returns `400` error
- Longitudes are normalized to [0, 360) range
- Missing bodies are not an error

**Error Responses:**
- `400` - No valid natal bodies provided
- `422` - Validation errors (invalid orb_deg, max_hits out of range, etc.)
- `500` - Server error during computation

**Examples:**
```bash
# Basic request
curl -X POST "http://127.0.0.1:9002/transits/vibes/now" \
  -H "Content-Type: application/json" \
  -d '{
    "natal_longitudes": {
      "Sun": 123.45,
      "Moon": 210.11,
      "Mars": 14.22
    }
  }'

# With custom orb and debug info
curl -X POST "http://127.0.0.1:9002/transits/vibes/now" \
  -H "Content-Type: application/json" \
  -d '{
    "natal_longitudes": {
      "Sun": 123.45,
      "Moon": 210.11,
      "Venus": 45.67,
      "Mercury": 90.12
    },
    "orb_deg": 5.0,
    "max_hits": 50,
    "include_debug": true
  }'
```

**Note:** This endpoint does not require API key authentication. It synthesizes daily vibes and cosmic season summaries using deterministic scoring and template-based language generation (no AI/LLM usage). The output is deterministic: same inputs produce the same output.

---

## Interpretations Endpoints

### Category-based Interpretations

### GET `/interpretations`

List all available interpretation categories.

**Request:**
- Method: `GET`
- Parameters: None

**Response:**
```json
{
  "categories": [
    "planet_in_sign",
    "planet_in_house",
    "angle_in_sign",
    "node_in_sign",
    "node_in_house",
    "lunar_phase_in_sign"
  ],
  "count": 6
}
```

**Fields:**
- `categories` (array) - List of category names
- `count` (integer) - Number of categories

**Categories:**
- `planet_in_sign` - Planet placements in zodiac signs (155 files)
- `planet_in_house` - Planet placements in houses (157 files)
- `angle_in_sign` - Angle placements in signs (ASC, MC, etc.) (52 files)
- `node_in_sign` - Node placements in signs (26 files)
- `node_in_house` - Node placements in houses (26 files)
- `lunar_phase_in_sign` - Lunar phase interpretations by sign (117 files)

**Example:**
```bash
curl -H "X-API-Key: your-api-key-here" http://127.0.0.1:9002/interpretations
```

### GET `/interpretations/{category}`

List all items (interpretations) in a specific category.

**Request:**
- Method: `GET`
- Path Parameters:
  - `category` (string) - Category name (case-insensitive)

**Response:**
```json
{
  "category": "planet_in_sign",
  "items": [
    "sun_in_leo",
    "moon_in_cancer",
    "mars_in_aries",
    ...
  ],
  "count": 155
}
```

**Fields:**
- `category` (string) - The category name
- `items` (array) - List of item names (interpretation identifiers)
- `count` (integer) - Number of items

**Error Responses:**
- `404` - Category not found

**Examples:**
```bash
curl -H "X-API-Key: your-api-key-here" http://127.0.0.1:9002/interpretations/planet_in_sign
curl -H "X-API-Key: your-api-key-here" http://127.0.0.1:9002/interpretations/planet_in_house
curl -H "X-API-Key: your-api-key-here" http://127.0.0.1:9002/interpretations/angle_in_sign
```

### GET `/interpretations/{category}/{item}`

Get a specific interpretation JSON by category and item.

**Request:**
- Method: `GET`
- Path Parameters:
  - `category` (string) - Category name (case-insensitive)
  - `item` (string) - Item name (case-insensitive)
- Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | string | No | `null` | Optional: `micro` returns only micro section, `macro` returns only macro section |

**Response:**
```json
{
  "context": {
    "category": "planet_in_sign",
    "item": "sun_in_leo"
  },
  "pattern": {
    "description": "Sun in Leo",
    "elements": ["fire", "fixed"]
  },
  "micro": {
    "description": "A bold, radiant presence...",
    "keywords": ["confidence", "creativity", "leadership"]
  },
  "macro": {
    "description": "In the broader context...",
    "themes": ["identity", "expression"]
  },
  "metadata": {
    "version": "2.0",
    "updated": "2025-01-01"
  }
}
```

**Fields:**
- Full interpretation JSON structure with `context`, `pattern`, `micro`, `macro`, and `metadata` sections
- If `format=micro` is provided, only the `micro` section is returned
- If `format=macro` is provided, only the `macro` section is returned

**Error Responses:**
- `400` - Invalid `format` parameter (must be `micro` or `macro`)
- `404` - Category or item not found

**Examples:**
```bash
# Full interpretation
curl -H "X-API-Key: your-api-key-here" http://127.0.0.1:9002/interpretations/planet_in_sign/sun_in_leo

# Micro only
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/interpretations/planet_in_sign/sun_in_leo?format=micro"

# Macro only
curl -H "X-API-Key: your-api-key-here" "http://127.0.0.1:9002/interpretations/planet_in_sign/sun_in_leo?format=macro"

# Other examples
curl -H "X-API-Key: your-api-key-here" http://127.0.0.1:9002/interpretations/planet_in_house/moon_in_7
curl -H "X-API-Key: your-api-key-here" http://127.0.0.1:9002/interpretations/angle_in_sign/asc_in_aries
curl -H "X-API-Key: your-api-key-here" http://127.0.0.1:9002/interpretations/node_in_sign/nn_in_scorpio
curl -H "X-API-Key: your-api-key-here" http://127.0.0.1:9002/interpretations/lunar_phase_in_sign/full_moon_in_sagittarius
```

### POST `/interpretations/transiting_to_natal`

Batch lookup of transit-to-natal interpretations from transit interpretation files. Returns normalized micro/macro interpretation payloads for a list of transit-to-natal aspect keys.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Request Body:

```json
{
  "layer": "micro",
  "items": [
    {
      "transiting_body": "Venus",
      "aspect": "square",
      "natal_body": "Lilith"
    },
    {
      "transiting_body": "Lilith",
      "aspect": "conjunction",
      "natal_body": "Chiron"
    }
  ],
  "max_items": 100
}
```

**Request Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `layer` | string | No | `"micro"` | Layer to return: `"micro"`, `"macro"`, or `"both"` |
| `items` | array | Yes | - | List of transit-to-natal keys to look up (non-empty) |
| `items[].transiting_body` | string | Yes | - | Transiting body name (case-sensitive): Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, Lilith |
| `items[].aspect` | string | Yes | - | Aspect type: `"conjunction"`, `"sextile"`, `"square"`, `"trine"`, or `"opposition"` |
| `items[].natal_body` | string | Yes | - | Natal body name (case-sensitive): same as transiting_body options |
| `max_items` | integer | No | 100 | Maximum number of items to process (1-720) |

**Response:**
```json
{
  "ok": true,
  "layer": "micro",
  "results": [
    {
      "key": {
        "transiting_body": "Venus",
        "aspect": "square",
        "natal_body": "Lilith"
      },
      "found": true,
      "micro": {
        "meaning": "Desire tells the truth – beauty bares its teeth.",
        "timeframe": "Active for several days, strongest near the exact aspect.",
        "keywords": ["desire", "self-worth", "pleasure", "authenticity"],
        "themes": ["relationships", "shadow"]
      },
      "macro": null,
      "themes": ["relationships", "shadow"]
    },
    {
      "key": {
        "transiting_body": "Lilith",
        "aspect": "conjunction",
        "natal_body": "Chiron"
      },
      "found": true,
      "micro": {
        "meaning": "A raw meeting with an old wound 🩸 – often one shaped by shame...",
        "timeframe": "Active for several days, strongest near the exact aspect.",
        "keywords": ["exposed wound", "embodied truth", "taboo healing"],
        "themes": ["healing", "shadow"]
      },
      "macro": null,
      "themes": ["healing", "shadow"]
    }
  ],
  "missing": [],
  "stats": {
    "requested": 2,
    "returned": 2,
    "found": 2,
    "missing": 0
  }
}
```

**Response Fields:**
- `ok` (boolean) - Always `true` for successful responses
- `layer` (string) - Layer requested (`"micro"`, `"macro"`, or `"both"`)
- `results` (array) - List of results in the same order as input items
  - `key` (object) - Original request key
    - `transiting_body` (string) - Transiting body name
    - `aspect` (string) - Aspect type
    - `natal_body` (string) - Natal body name
  - `found` (boolean) - Whether interpretation was found
  - `reason` (string | null) - Reason if not found: `"invalid_body_name"`, `"invalid_aspect_name"`, or `"not_found_in_files"`
  - `micro` (object | null) - Normalized micro interpretation (if layer is `"micro"` or `"both"`)
    - `meaning` (string) - Short interpretation text (from `short` field)
    - `timeframe` (string | null) - Timing information (from `timing` field)
    - `keywords` (array) - Keywords array (from `keywords` field)
    - `themes` (array) - Themes array (from `themes` field)
  - `macro` (object | null) - Normalized macro interpretation (if layer is `"macro"` or `"both"`)
    - `overview` (string) - Full interpretation text (from `full` field)
    - `suggestions` (array) - Array of suggestions (from `advice` and `action` fields, max 2)
    - `precautions` (array) - Array of precautions (from `caution` field, max 1)
    - `timeframe` (string | null) - Timing information (from `timing` field)
    - `journal_prompt` (string | null) - Placeholder for future use (currently `null`)
  - `themes` (array) - Themes array (always included at top level)
- `missing` (array) - List of missing keys (currently empty, reserved for future use)
- `stats` (object) - Statistics
  - `requested` (integer) - Number of items requested
  - `returned` (integer) - Number of results returned
  - `found` (integer) - Number of interpretations found
  - `missing` (integer) - Number of interpretations not found

**Normalization Mapping:**

**Micro Payload:**
- `meaning` ← `short` (from JSON file)
- `timeframe` ← `timing` (nullable)
- `keywords` ← `keywords` (default empty array)
- `themes` ← `themes` (default empty array)

**Macro Payload:**
- `overview` ← `full` (from JSON file)
- `suggestions` ← `advice` then `action` if present/non-empty (max 2 items)
- `precautions` ← `caution` if present/non-empty (max 1 item)
- `timeframe` ← `timing` (nullable)
- `journal_prompt` ← `null` (placeholder for future use)

**Validation:**
- Invalid body names are marked with `found=false`, `reason="invalid_body_name"` (does not fail request)
- Invalid aspect names are marked with `found=false`, `reason="invalid_aspect_name"` (does not fail request)
- Missing interpretations are marked with `found=false`, `reason="not_found_in_files"` (does not fail request)
- Results are returned in the same order as input items
- Request is resilient - invalid items don't cause the entire request to fail

**Error Responses:**
- `400` - Invalid layer value (must be "micro", "macro", or "both")
- `422` - Validation errors (empty items array, max_items out of range, etc.)

**Examples:**
```bash
# Micro layer (default)
curl -X POST "http://127.0.0.1:9002/interpretations/transiting_to_natal" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "layer": "micro",
    "items": [
      {
        "transiting_body": "Venus",
        "aspect": "square",
        "natal_body": "Lilith"
      }
    ]
  }'

# Macro layer
curl -X POST "http://127.0.0.1:9002/interpretations/transiting_to_natal" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "layer": "macro",
    "items": [
      {
        "transiting_body": "Mars",
        "aspect": "trine",
        "natal_body": "Sun"
      }
    ]
  }'

# Both layers
curl -X POST "http://127.0.0.1:9002/interpretations/transiting_to_natal" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "layer": "both",
    "items": [
      {
        "transiting_body": "Jupiter",
        "aspect": "opposition",
        "natal_body": "Saturn"
      }
    ]
  }'
```

**Note:** This endpoint optimizes file loading by grouping items by transiting_body and loading each file only once per request. Invalid items are handled gracefully without failing the entire request.

### Transiting-to-Natal Interpretations

---

## Authentication Endpoints

Authentication endpoints use cookie-based sessions. All endpoints require HttpOnly cookies for session management.

### POST `/auth/register`

Register a new user account and automatically log them in.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Request Body:

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "plan_type": "free"
}
```

**Request Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | Yes | - | User email address (lowercased and trimmed) |
| `password` | string | Yes | - | Password (minimum 10 characters) |
| `plan_type` | string | No | `"free"` | User plan: `"free"` or `"premium"` |

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "plan_type": "free"
}
```

**Response Fields:**
- `id` (uuid) - User ID
- `email` (string) - User email (lowercased)
- `plan_type` (string) - User plan type

**Cookie:** Sets `z13_session` cookie (HttpOnly, SameSite=Lax, Secure in prod)

**Error Responses:**
- `409` - Email already registered
- `422` - Validation errors (invalid email format, password too short, invalid plan_type)

**Example:**
```bash
curl -X POST "http://127.0.0.1:9002/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "plan_type": "free"
  }' \
  -c cookies.txt
```

### POST `/auth/login`

Login with email and password.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Request Body:

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `password` | string | Yes | User password |

**Response (200 OK):**
```json
{
  "ok": true
}
```

**Cookie:** Sets `z13_session` cookie (HttpOnly, SameSite=Lax, Secure in prod)

**Error Responses:**
- `401` - Invalid credentials (generic message to prevent user enumeration)
- `403` - Account is inactive

**Example:**
```bash
curl -X POST "http://127.0.0.1:9002/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }' \
  -c cookies.txt
```

### POST `/auth/logout`

Logout by revoking the current session.

**Request:**
- Method: `POST`
- Authentication: Required (session cookie)

**Response (200 OK):**
```json
{
  "ok": true
}
```

**Cookie:** Clears `z13_session` cookie

**Error Responses:**
- `401` - Not authenticated

**Example:**
```bash
curl -X POST "http://127.0.0.1:9002/auth/logout" \
  -b cookies.txt \
  -c cookies.txt
```

### GET `/auth/me`

Get current authenticated user information.

**Request:**
- Method: `GET`
- Authentication: Required (session cookie)

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "plan_type": "free"
}
```

**Response Fields:**
- `id` (uuid) - User ID
- `email` (string) - User email
- `plan_type` (string) - User plan type

**Error Responses:**
- `401` - Not authenticated or session invalid/expired

**Example:**
```bash
curl -b cookies.txt "http://127.0.0.1:9002/auth/me"
```

**Note:** All authentication endpoints use server-side sessions stored in PostgreSQL. Session cookies are HttpOnly, SameSite=Lax, and Secure in production. Session TTL defaults to 30 days (configurable via `AUTH_SESSION_TTL_DAYS`).

---

## Natal Data Endpoints

Natal data endpoints allow authenticated users to manage their stored natal chart data. All endpoints require cookie-based authentication.

### POST `/natal-data`

Create a natal data record for the current user.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Authentication: Required (session cookie)
- Request Body:

```json
{
  "name": "My Birth Chart",
  "birth_datetime_utc": "2000-01-01T13:30:00Z",
  "birth_timezone": "America/New_York",
  "birth_place_name": "Philadelphia, PA",
  "birth_lat": 40.0,
  "birth_lon": -75.0,
  "is_default": true,
  "birth_time_provided": true,
  "birth_place_provided": true
}
```

**Request Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | - | Chart name (non-empty) |
| `birth_datetime_utc` | datetime | Yes | - | Birth datetime in UTC (timezone-aware, ISO-8601) |
| `birth_timezone` | string | Yes | - | IANA timezone (e.g., "America/New_York") |
| `birth_place_name` | string | Yes | - | Birth place name (non-empty) |
| `birth_lat` | float | Yes | - | Birth latitude (-90 to 90) |
| `birth_lon` | float | Yes | - | Birth longitude (-180 to 180) |
| `is_default` | boolean | No | `false` | Set as default chart (unsets other defaults) |
| `birth_time_provided` | boolean | No | `true` | Whether user provided birth time (vs. date-only) |
| `birth_place_provided` | boolean | No | `true` | Whether user provided birth place coordinates |

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "My Birth Chart",
  "birth_datetime_utc": "2000-01-01T13:30:00Z",
  "birth_timezone": "America/New_York",
  "birth_place_name": "Philadelphia, PA",
  "birth_lat": 40.0,
  "birth_lon": -75.0,
  "is_default": true,
  "birth_time_provided": true,
  "birth_place_provided": true,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "archived_at": null
}
```

**Note:** Creating natal data automatically generates a chart snapshot (stored in `chart_snapshots` table with `snapshot_key="natal"`). Snapshot generation does not block natal creation if it fails.

**Error Responses:**
- `401` - Not authenticated
- `422` - Validation errors (invalid coordinates, missing fields, etc.)

**Example:**
```bash
curl -X POST "http://127.0.0.1:9002/natal-data" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "My Birth Chart",
    "birth_datetime_utc": "2000-01-01T13:30:00Z",
    "birth_timezone": "America/New_York",
    "birth_place_name": "Philadelphia, PA",
    "birth_lat": 40.0,
    "birth_lon": -75.0,
    "is_default": true
  }'
```

### GET `/natal-data`

List all non-archived natal data records for the current user.

**Request:**
- Method: `GET`
- Authentication: Required (session cookie)

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Birth Chart",
    "birth_datetime_utc": "2000-01-01T13:30:00Z",
    "birth_timezone": "America/New_York",
    "birth_place_name": "Philadelphia, PA",
    "birth_lat": 40.0,
    "birth_lon": -75.0,
    "is_default": true,
    "birth_time_provided": true,
    "birth_place_provided": true,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "archived_at": null
  }
]
```

**Ordering:** Results are ordered by `is_default DESC, created_at DESC`

**Example:**
```bash
curl -b cookies.txt "http://127.0.0.1:9002/natal-data"
```

### GET `/natal-data/{natal_id}`

Get a specific natal data record.

**Request:**
- Method: `GET`
- Path Parameters:
  - `natal_id` (uuid) - Natal data ID
- Authentication: Required (session cookie)

**Response (200 OK):**
Same structure as POST response (single object, not array)

**Error Responses:**
- `401` - Not authenticated
- `404` - Record not found, archived, or not owned by user

**Example:**
```bash
curl -b cookies.txt "http://127.0.0.1:9002/natal-data/550e8400-e29b-41d4-a716-446655440000"
```

### PATCH `/natal-data/{natal_id}`

Partially update a natal data record.

**Request:**
- Method: `PATCH`
- Content-Type: `application/json`
- Path Parameters:
  - `natal_id` (uuid) - Natal data ID
- Authentication: Required (session cookie)
- Request Body (all fields optional):

```json
{
  "name": "Updated Chart Name",
  "is_default": true
}
```

**Request Fields (all optional):**
- `name` (string)
- `birth_datetime_utc` (datetime, timezone-aware)
- `birth_timezone` (string)
- `birth_place_name` (string)
- `birth_lat` (float)
- `birth_lon` (float)
- `is_default` (boolean)
- `birth_time_provided` (boolean)
- `birth_place_provided` (boolean)

**Response (200 OK):**
Same structure as GET response (updated record)

**Note:** If `is_default=true`, any other default records for the user are unset.

**Error Responses:**
- `401` - Not authenticated
- `404` - Record not found, archived, or not owned by user
- `422` - Validation errors

**Example:**
```bash
curl -X PATCH "http://127.0.0.1:9002/natal-data/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Updated Chart Name",
    "is_default": true
  }'
```

### DELETE `/natal-data/{natal_id}`

Archive (soft delete) a natal data record.

**Request:**
- Method: `DELETE`
- Path Parameters:
  - `natal_id` (uuid) - Natal data ID
- Authentication: Required (session cookie)

**Response (200 OK):**
```json
{
  "ok": true
}
```

**Note:** This is a soft delete - sets `archived_at` timestamp. Archived records are excluded from GET `/natal-data` list.

**Error Responses:**
- `401` - Not authenticated
- `404` - Record not found, already archived, or not owned by user

**Example:**
```bash
curl -X DELETE "http://127.0.0.1:9002/natal-data/550e8400-e29b-41d4-a716-446655440000" \
  -b cookies.txt
```

**Note:** All natal data endpoints require authentication via session cookie. Ownership violations return 404 (not 403) to prevent information leakage.

---

## Admin Endpoints

Admin endpoints provide administrative and maintenance functions. These endpoints require admin token authentication in non-development environments.

### GET `/admin/validate/transits_to_natal`

Validate transit-to-natal interpretation JSON files for completeness and correctness.

**Request:**
- Method: `GET`
- Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `interp_dir` | string | No | `data/interpretations/transits` | Path to interpretation files directory |
| `aspects` | string | No | `conjunction,sextile,square,trine,opposition` | Comma-separated list of required aspects |
| `strict` | boolean | No | `false` | If true, treats warnings as errors |

**Authentication:**
- **Development environment:** No authentication required
- **Production environment:** Requires `X-Admin-Token` header matching `ADMIN_TOKEN` environment variable

**Response:**
```json
{
  "ok": true,
  "required_transiting_bodies": [
    "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter",
    "Saturn", "Uranus", "Neptune", "Pluto", "Chiron", "Lilith"
  ],
  "required_natal_bodies": [
    "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter",
    "Saturn", "Uranus", "Neptune", "Pluto", "Chiron", "Lilith"
  ],
  "required_aspects": [
    "conjunction", "sextile", "square", "trine", "opposition"
  ],
  "stats": {
    "expected_entries": 720,
    "found_entries": 650,
    "missing_entries": 70
  },
  "errors": [
    {
      "transiting_body": "Lilith",
      "file": "lilith_transits.json",
      "missing": {
        "conjunction": ["Chiron"],
        "sextile": ["Chiron"]
      }
    }
  ],
  "warnings": [
    {
      "transiting_body": "Jupiter",
      "file": "jupiter_transits.json",
      "message": "meta.aspects missing required aspect: opposition"
    }
  ]
}
```

**Response Fields:**
- `ok` (boolean) - `true` if validation passed (no errors), `false` otherwise
- `required_transiting_bodies` (array) - List of required transiting body names
- `required_natal_bodies` (array) - List of required natal body names
- `required_aspects` (array) - List of required aspect types
- `stats` (object) - Validation statistics
  - `expected_entries` (integer) - Total expected entries (transiting × natal × aspects)
  - `found_entries` (integer) - Number of entries found
  - `missing_entries` (integer) - Number of missing entries
- `errors` (array) - List of validation errors
  - `transiting_body` (string) - Transiting body name
  - `file` (string) - File name with error
  - `missing` (object) - Missing entries grouped by aspect
- `warnings` (array) - List of non-fatal warnings
  - `transiting_body` (string) - Transiting body name
  - `file` (string) - File name with warning
  - `message` (string) - Warning message

**Error Responses:**
- `403` - Not authorized (invalid or missing admin token in production)
- `500` - Server error during validation

**Examples:**
```bash
# Development environment (no auth required)
curl "http://127.0.0.1:9002/admin/validate/transits_to_natal"

# Production environment (requires admin token)
curl -H "X-Admin-Token: your-admin-token-here" \
  "http://127.0.0.1:9002/admin/validate/transits_to_natal"

# Custom aspects and strict mode
curl -H "X-Admin-Token: your-admin-token-here" \
  "http://127.0.0.1:9002/admin/validate/transits_to_natal?aspects=conjunction,opposition&strict=true"
```

**Note:** This endpoint is also available as a CLI command via `scripts/validate_transits.py`.

---

## Notes for Frontend Integration

### Date Handling
- Always send ISO-8601 formatted datetimes
- Include timezone information when possible
- Date-only strings will be interpreted as noon local time

### City Search vs Coordinates
- Use `/location/search` to help users find cities
- Cache results on the frontend to reduce API calls
- Handle ambiguous city responses (409) by prompting user to select from candidates

### Error Handling
- Always check HTTP status codes
- Display user-friendly error messages from `detail` field
- Handle 409 (ambiguous city) by showing candidate selection UI
- Handle 403 (authentication failed) by prompting for valid API key
- Handle 429 (rate limit) by implementing exponential backoff and respecting `Retry-After` header
- Handle 504 (timeout) by retrying with simpler parameters or informing user of operation complexity
- Handle 413 (request too large) by reducing request payload size

### Performance
- Health check endpoints available for monitoring:
  - `/meta/ping` - Basic uptime check (no authentication required)
  - `/meta/health/live` - Liveness probe for container orchestration
  - `/meta/health/ready` - Readiness probe with dependency verification
- Consider caching interpretation data locally (533 total files)
- `/positions/now` is optimized for current-time queries
- Be aware of rate limits and implement appropriate retry logic
- Expensive operations (`/charts/natal`, `/transits/today`) have 30-second timeouts
- Keep request payloads under 1MB to avoid 413 errors
- Use request IDs (`X-Request-ID` header) for correlation when debugging issues

### Zodiac Systems
- Default to `z13` (true-sky) unless user prefers `tropical`
- Allow users to toggle between systems for comparison
- Use `mode=both` in `/positions` endpoints to get both systems in one request
- `return_both_systems: true` in `/charts/natal` provides both in one request

### Transits
- Transits are ranked by significance (tighter orbs first)
- Interpretation data may be `null` for some transits (not all combinations have interpretations yet)
- Use `include_nodes` and `include_lilith` to filter if needed

---

---

## TypeScript Type Definitions

Type definitions for frontend TypeScript projects:

```typescript
// Zodiac mode type
type ZodiacMode = "z13" | "tropical" | "both";

// Position response (single mode)
interface PositionResponse {
  body: string;
  mode: "z13" | "tropical";
  longitude: number;
  latitude: number | null;
  speed: number | null;
  retrograde: boolean | null;
  distance_km: number | null;
  sign: string;
  source: string | null;
}

// Positions response (single mode)
interface PositionsResponse {
  positions: PositionResponse[];
}

// Positions response (both modes)
interface PositionsBothResponse {
  positions_z13: PositionResponse[];
  positions_tropical: PositionResponse[];
}

// Union type for positions endpoint response
type PositionsEndpointResponse = PositionsResponse | PositionsBothResponse;

// Lunar event
interface LunarEvent {
  datetime: string; // ISO-8601 timestamp
  event_type: "phase" | "ingress";
  sign: string;
  phase: string | null; // Phase key for phase events
  description: string;
  notes: string | null;
  keywords: string[];
}

// Lunar events response (single mode)
interface LunarEventsResponse {
  start: string; // ISO-8601 timestamp
  end: string; // ISO-8601 timestamp
  mode: "z13" | "tropical";
  events: LunarEvent[];
}

// Lunar events response (both modes)
interface LunarEventsBothResponse {
  start: string; // ISO-8601 timestamp
  end: string; // ISO-8601 timestamp
  mode: "both";
  events_z13: LunarEvent[];
  events_tropical: LunarEvent[];
}

// Union type for lunar events endpoint response
type LunarEventsEndpointResponse = LunarEventsResponse | LunarEventsBothResponse;

// Position endpoint request parameters
interface PositionsQueryParams {
  datetime?: string; // ISO-8601 timestamp
  mode?: ZodiacMode; // Default: "z13"
  bodies?: string[]; // Optional body filter
}

// Example usage with fetch
async function getPositions(
  params: PositionsQueryParams = {}
): Promise<PositionsEndpointResponse> {
  const searchParams = new URLSearchParams();
  if (params.datetime) searchParams.set("datetime", params.datetime);
  if (params.mode) searchParams.set("mode", params.mode);
  if (params.bodies) {
    params.bodies.forEach((body) => searchParams.append("bodies", body));
  }

  const response = await fetch(
    `http://127.0.0.1:9002/positions?${searchParams.toString()}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// Type guard to check if response is "both" mode
function isPositionsBothResponse(
  response: PositionsEndpointResponse
): response is PositionsBothResponse {
  return "positions_z13" in response && "positions_tropical" in response;
}

// Usage example
async function example() {
  const result = await getPositions({ mode: "both" });
  
  if (isPositionsBothResponse(result)) {
    // TypeScript knows result has positions_z13 and positions_tropical
    console.log("Z13 positions:", result.positions_z13);
    console.log("Tropical positions:", result.positions_tropical);
  } else {
    // TypeScript knows result has positions
    console.log("Positions:", result.positions);
  }
}
```

---

## Additional Resources

- **OpenAPI Documentation:** Visit `http://127.0.0.1:9002/docs` for interactive API documentation (Swagger UI)
  - Click the "Authorize" button at the top right to enter your API key
  - Once authorized, all protected endpoints will automatically include your API key in requests
  - This allows you to test endpoints directly from the browser without manually adding headers
- **Development Guide:** See `DEVELOPMENT_MANUAL.md` for local setup and development instructions
- **Deployment Guide:** See `DEPLOYMENT_MANUAL.md` for production deployment instructions
- **Project State:** See `PROJECT_STATE.md` for roadmap and pending features
- **Data Schema:** See `data/README.md` for information about cache files and data structures

