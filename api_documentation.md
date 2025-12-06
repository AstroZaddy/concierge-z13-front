# Z13 Astrology API Documentation

**Version:** 0.1.2  
**Base URL:** `http://localhost:8000` (local development)  
**Content-Type:** `application/json`  
**API Format:** RESTful JSON API

## Table of Contents

1. [General Information](#general-information)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
   - [Meta](#meta-endpoints)
   - [Positions](#positions-endpoints)
   - [Lunar Events](#lunar-events-endpoint)
   - [Location Search](#location-search-endpoint)
   - [Natal Chart](#natal-chart-endpoint)
   - [Transits](#transits-endpoint)
   - [Interpretations](#interpretations-endpoints)

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

Currently, no authentication is required. All endpoints are publicly accessible.

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
| `404` | Not Found | City not found, interpretation not found, category not found |
| `409` | Conflict | Ambiguous city (multiple candidates) |
| `422` | Unprocessable Entity | Validation errors, missing query parameters |
| `500` | Internal Server Error | Server-side errors, date out of range |

### Example Error Responses

**400 Bad Request:**
```json
{
  "detail": "Unsupported mode 'invalid'. Expected 'z13' or 'tropical'."
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

**422 Unprocessable Entity:**
```json
{
  "detail": "Query parameter 'q' is required"
}
```

---

## Endpoints

## Meta Endpoints

### GET `/meta/ping`

Health check endpoint for uptime monitoring and version verification.

**Request:**
- Method: `GET`
- Parameters: None

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
curl http://localhost:8000/meta/ping
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
curl "http://localhost:8000/positions"

# Specific datetime, tropical mode
curl "http://localhost:8000/positions?datetime=2025-01-01T00:00:00Z&mode=tropical"

# Both zodiac systems
curl "http://localhost:8000/positions?mode=both"

# Only Sun and Moon in both systems
curl "http://localhost:8000/positions?bodies=Sun&bodies=Moon&mode=both"
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
curl "http://localhost:8000/positions/now?mode=tropical"

# Current positions in both systems
curl "http://localhost:8000/positions/now?mode=both"
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
curl "http://localhost:8000/lunar_events"

# 30 days, tropical mode
curl "http://localhost:8000/lunar_events?days=30&mode=tropical"

# Both zodiac systems
curl "http://localhost:8000/lunar_events?mode=both"

# Specific start date, 7 days, both systems
curl "http://localhost:8000/lunar_events?datetime=2025-06-01T00:00:00Z&days=7&mode=both"
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
curl "http://localhost:8000/location/search?q=toron"

# Limit results
curl "http://localhost:8000/location/search?q=new&limit=5"
```

---

## Natal Chart Endpoint

### POST `/natal`

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
curl -X POST http://localhost:8000/natal \
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
curl -X POST http://localhost:8000/natal \
  -H "Content-Type: application/json" \
  -d '{
    "datetime": "1966-10-28T09:30:00",
    "city": "Edmonton",
    "mode": "z13"
  }'

# With both zodiac systems
curl -X POST http://localhost:8000/natal \
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
curl "http://localhost:8000/transits/today?natal_datetime=2000-01-01T08:30:00-05:00&natal_location_latitude=40.0&natal_location_longitude=-75.0&natal_location_timezone=America/New_York"

# Using city name
curl "http://localhost:8000/transits/today?natal_datetime=2000-01-01T08:30:00-05:00&natal_city=Philadelphia"

# Top 10 transits
curl "http://localhost:8000/transits/today?natal_datetime=2000-01-01T08:30:00-05:00&natal_city=Philadelphia&limit=10"

# Future date
curl "http://localhost:8000/transits/today?natal_datetime=2000-01-01T08:30:00-05:00&natal_city=Philadelphia&when=2025-12-25T00:00:00Z"

# Exclude nodes and Lilith
curl "http://localhost:8000/transits/today?natal_datetime=2000-01-01T08:30:00-05:00&natal_city=Philadelphia&include_nodes=false&include_lilith=false"
```

---

## Interpretations Endpoints

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
curl http://localhost:8000/interpretations
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
curl http://localhost:8000/interpretations/planet_in_sign
curl http://localhost:8000/interpretations/planet_in_house
curl http://localhost:8000/interpretations/angle_in_sign
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
curl http://localhost:8000/interpretations/planet_in_sign/sun_in_leo

# Micro only
curl "http://localhost:8000/interpretations/planet_in_sign/sun_in_leo?format=micro"

# Macro only
curl "http://localhost:8000/interpretations/planet_in_sign/sun_in_leo?format=macro"

# Other examples
curl http://localhost:8000/interpretations/planet_in_house/moon_in_7
curl http://localhost:8000/interpretations/angle_in_sign/asc_in_aries
curl http://localhost:8000/interpretations/node_in_sign/nn_in_scorpio
curl http://localhost:8000/interpretations/lunar_phase_in_sign/full_moon_in_sagittarius
```

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

### Performance
- `/meta/ping` can be used for health checks before making requests
- Consider caching interpretation data locally (533 total files)
- `/positions/now` is optimized for current-time queries

### Zodiac Systems
- Default to `z13` (true-sky) unless user prefers `tropical`
- Allow users to toggle between systems for comparison
- Use `mode=both` in `/positions` endpoints to get both systems in one request
- `return_both_systems: true` in `/natal` provides both in one request

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
    `http://localhost:8000/positions?${searchParams.toString()}`
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

- **OpenAPI Documentation:** Visit `http://localhost:8000/docs` for interactive API documentation
- **Project State:** See `PROJECT_STATE.md` for roadmap and pending features
- **Data Schema:** See `data/README.md` for information about cache files and data structures

