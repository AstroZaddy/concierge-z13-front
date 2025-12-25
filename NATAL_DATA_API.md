# Natal Data API - Frontend Developer Guide

## Overview

The `/natal-data` endpoints provide CRUD operations for managing stored birth chart data (natal data) for authenticated users. These endpoints are **stateful** and require authentication via cookie-based sessions.

**Important**: These endpoints are separate from the stateless chart computation endpoint (`POST /charts/natal`). The `/natal-data` endpoints manage **saved** birth data records, while `/charts/natal` computes a chart from provided data.

## Base URL

All endpoints are under `/natal-data`:

- `POST /natal-data` - Create a natal data record
- `GET /natal-data` - List all natal data records for current user
- `GET /natal-data/{natal_id}` - Get a specific natal data record
- `PATCH /natal-data/{natal_id}` - Update a natal data record
- `DELETE /natal-data/{natal_id}` - Archive (soft delete) a natal data record

## Authentication

**All endpoints require authentication** via the session cookie (`z13_session`). See `AUTH_API_FRONTEND.md` for authentication details.

- Use `credentials: "include"` (Fetch) or `withCredentials: true` (Axios)
- The browser automatically sends the cookie with requests
- Unauthenticated requests return `401 Unauthorized`

## Data Model

### Natal Data Record

```typescript
interface NatalData {
  id: string;                    // UUID
  name: string;                  // Display name (e.g., "My Birth Chart")
  birth_datetime_utc: string;    // ISO-8601 datetime in UTC (timezone-aware)
  birth_timezone: string;        // IANA timezone (e.g., "America/New_York")
  birth_place_name: string;      // Human-readable place name
  birth_lat: number;             // Latitude in decimal degrees [-90, 90]
  birth_lon: number;             // Longitude in decimal degrees [-180, 180]
  is_default: boolean;           // Whether this is the user's default chart
  created_at: string;            // ISO-8601 datetime
  updated_at: string;            // ISO-8601 datetime
  archived_at: string | null;    // ISO-8601 datetime (null if not archived)
}
```

## Endpoints

### POST /natal-data

Create a new natal data record for the current user.

**Request Body:**
```json
{
  "name": "My Birth Chart",
  "birth_datetime_utc": "2000-01-01T13:30:00+00:00",
  "birth_timezone": "America/New_York",
  "birth_place_name": "New York, NY, USA",
  "birth_lat": 40.7128,
  "birth_lon": -74.0060,
  "is_default": false
}
```

**Validation Rules:**
- `name`: Required, non-empty string
- `birth_datetime_utc`: Required, timezone-aware ISO-8601 datetime (must be UTC or converted to UTC)
- `birth_timezone`: Required, non-empty IANA timezone string
- `birth_place_name`: Required, non-empty string
- `birth_lat`: Required, number between -90 and 90
- `birth_lon`: Required, number between -180 and 180
- `is_default`: Optional boolean (default: `false`)

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Birth Chart",
  "birth_datetime_utc": "2000-01-01T13:30:00+00:00",
  "birth_timezone": "America/New_York",
  "birth_place_name": "New York, NY, USA",
  "birth_lat": 40.7128,
  "birth_lon": -74.0060,
  "is_default": false,
  "created_at": "2025-01-15T10:30:00+00:00",
  "updated_at": "2025-01-15T10:30:00+00:00",
  "archived_at": null
}
```

**Behavior:**
- If `is_default` is `true`, any existing default records for this user are automatically unset
- The new record is created and returned

**Errors:**
- `401 Unauthorized` - Not authenticated
- `422 Unprocessable Entity` - Validation error (invalid datetime format, out-of-range coordinates, etc.)

---

### GET /natal-data

List all non-archived natal data records for the current user.

**Request:** No body required (cookie is sent automatically)

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Birth Chart",
    "birth_datetime_utc": "2000-01-01T13:30:00+00:00",
    "birth_timezone": "America/New_York",
    "birth_place_name": "New York, NY, USA",
    "birth_lat": 40.7128,
    "birth_lon": -74.0060,
    "is_default": true,
    "created_at": "2025-01-15T10:30:00+00:00",
    "updated_at": "2025-01-15T10:30:00+00:00",
    "archived_at": null
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Partner's Chart",
    "birth_datetime_utc": "1995-06-15T08:00:00+00:00",
    "birth_timezone": "Europe/London",
    "birth_place_name": "London, UK",
    "birth_lat": 51.5074,
    "birth_lon": -0.1278,
    "is_default": false,
    "created_at": "2025-01-14T15:20:00+00:00",
    "updated_at": "2025-01-14T15:20:00+00:00",
    "archived_at": null
  }
]
```

**Ordering:**
- Results are ordered by `is_default` (descending), then `created_at` (descending)
- Default records appear first, then most recently created

**Errors:**
- `401 Unauthorized` - Not authenticated

---

### GET /natal-data/{natal_id}

Get a specific natal data record by ID.

**Request:** No body required (cookie is sent automatically)

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Birth Chart",
  "birth_datetime_utc": "2000-01-01T13:30:00+00:00",
  "birth_timezone": "America/New_York",
  "birth_place_name": "New York, NY, USA",
  "birth_lat": 40.7128,
  "birth_lon": -74.0060,
  "is_default": true,
  "created_at": "2025-01-15T10:30:00+00:00",
  "updated_at": "2025-01-15T10:30:00+00:00",
  "archived_at": null
}
```

**Errors:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Record doesn't exist, is archived, or doesn't belong to current user

**Note:** Returns 404 (not 403) for ownership violations to avoid information leakage.

---

### PATCH /natal-data/{natal_id}

Partially update a natal data record. Only provided fields will be updated.

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "is_default": true
}
```

**Allowed Fields:**
- `name`
- `birth_datetime_utc` (must be timezone-aware)
- `birth_timezone`
- `birth_place_name`
- `birth_lat`
- `birth_lon`
- `is_default`

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Name",
  "birth_datetime_utc": "2000-01-01T13:30:00+00:00",
  "birth_timezone": "America/New_York",
  "birth_place_name": "New York, NY, USA",
  "birth_lat": 40.7128,
  "birth_lon": -74.0060,
  "is_default": true,
  "created_at": "2025-01-15T10:30:00+00:00",
  "updated_at": "2025-01-15T11:00:00+00:00",
  "archived_at": null
}
```

**Behavior:**
- If `is_default` is set to `true`, any existing default records for this user are automatically unset
- Only provided fields are updated; omitted fields remain unchanged
- `updated_at` is automatically updated

**Errors:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Record doesn't exist, is archived, or doesn't belong to current user
- `422 Unprocessable Entity` - Validation error

---

### DELETE /natal-data/{natal_id}

Archive (soft delete) a natal data record by setting `archived_at`.

**Request:** No body required (cookie is sent automatically)

**Response:** `200 OK`
```json
{
  "ok": true
}
```

**Behavior:**
- Sets `archived_at` to current timestamp (soft delete)
- Record is no longer returned in `GET /natal-data` list
- Record cannot be retrieved via `GET /natal-data/{natal_id}` after archiving
- If the archived record was the default, no new default is automatically set

**Errors:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Record doesn't exist, is already archived, or doesn't belong to current user

---

## Frontend Integration Examples

### TypeScript/JavaScript (Fetch API)

```typescript
const API_BASE = "http://localhost:9002";

// Create a natal data record
async function createNatalData(data: {
  name: string;
  birth_datetime_utc: string;
  birth_timezone: string;
  birth_place_name: string;
  birth_lat: number;
  birth_lon: number;
  is_default?: boolean;
}) {
  const response = await fetch(`${API_BASE}/natal-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important: include cookies
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create natal data");
  }

  return await response.json();
}

// List all natal data records
async function listNatalData() {
  const response = await fetch(`${API_BASE}/natal-data`, {
    method: "GET",
    credentials: "include", // Important: include cookies
  });

  if (!response.ok) {
    throw new Error("Failed to list natal data");
  }

  return await response.json();
}

// Get a specific natal data record
async function getNatalData(natalId: string) {
  const response = await fetch(`${API_BASE}/natal-data/${natalId}`, {
    method: "GET",
    credentials: "include", // Important: include cookies
  });

  if (response.status === 404) {
    return null; // Not found
  }

  if (!response.ok) {
    throw new Error("Failed to get natal data");
  }

  return await response.json();
}

// Update a natal data record
async function updateNatalData(
  natalId: string,
  updates: Partial<{
    name: string;
    birth_datetime_utc: string;
    birth_timezone: string;
    birth_place_name: string;
    birth_lat: number;
    birth_lon: number;
    is_default: boolean;
  }>
) {
  const response = await fetch(`${API_BASE}/natal-data/${natalId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important: include cookies
    body: JSON.stringify(updates),
  });

  if (response.status === 404) {
    throw new Error("Natal data record not found");
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update natal data");
  }

  return await response.json();
}

// Archive (soft delete) a natal data record
async function deleteNatalData(natalId: string) {
  const response = await fetch(`${API_BASE}/natal-data/${natalId}`, {
    method: "DELETE",
    credentials: "include", // Important: include cookies
  });

  if (response.status === 404) {
    throw new Error("Natal data record not found");
  }

  if (!response.ok) {
    throw new Error("Failed to delete natal data");
  }

  return await response.json();
}
```

### React Hook Example

```tsx
import { useState, useEffect } from "react";

interface NatalData {
  id: string;
  name: string;
  birth_datetime_utc: string;
  birth_timezone: string;
  birth_place_name: string;
  birth_lat: number;
  birth_lon: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function useNatalData() {
  const [natalDataList, setNatalDataList] = useState<NatalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load natal data on mount
  useEffect(() => {
    loadNatalData();
  }, []);

  const loadNatalData = async () => {
    try {
      setLoading(true);
      const data = await listNatalData();
      setNatalDataList(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load natal data");
    } finally {
      setLoading(false);
    }
  };

  const createNatalData = async (data: Parameters<typeof createNatalData>[0]) => {
    try {
      const newRecord = await createNatalData(data);
      setNatalDataList((prev) => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      throw err;
    }
  };

  const updateNatalData = async (id: string, updates: Partial<NatalData>) => {
    try {
      const updated = await updateNatalData(id, updates);
      setNatalDataList((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteNatalData = async (id: string) => {
    try {
      await deleteNatalData(id);
      setNatalDataList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    natalDataList,
    loading,
    error,
    loadNatalData,
    createNatalData,
    updateNatalData,
    deleteNatalData,
  };
}
```

### Axios Example

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:9002",
  withCredentials: true, // Important: include cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Create
export const createNatalData = async (data: {
  name: string;
  birth_datetime_utc: string;
  birth_timezone: string;
  birth_place_name: string;
  birth_lat: number;
  birth_lon: number;
  is_default?: boolean;
}) => {
  const response = await api.post("/natal-data", data);
  return response.data;
};

// List
export const listNatalData = async () => {
  const response = await api.get("/natal-data");
  return response.data;
};

// Get one
export const getNatalData = async (natalId: string) => {
  try {
    const response = await api.get(`/natal-data/${natalId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Update
export const updateNatalData = async (
  natalId: string,
  updates: Partial<{
    name: string;
    birth_datetime_utc: string;
    birth_timezone: string;
    birth_place_name: string;
    birth_lat: number;
    birth_lon: number;
    is_default: boolean;
  }>
) => {
  const response = await api.patch(`/natal-data/${natalId}`, updates);
  return response.data;
};

// Delete
export const deleteNatalData = async (natalId: string) => {
  const response = await api.delete(`/natal-data/${natalId}`);
  return response.data;
};
```

---

## Important Notes for Frontend Developers

### 1. Authentication Required

All endpoints require authentication. Ensure users are logged in before making requests. Handle `401` responses by redirecting to login.

### 2. Cookie Management

- Always use `credentials: "include"` (Fetch) or `withCredentials: true` (Axios)
- The browser automatically manages the session cookie
- Cookie is HttpOnly (not accessible to JavaScript)

### 3. Default Record Behavior

- Only one record per user can have `is_default = true`
- Setting `is_default = true` on one record automatically unsets it on others
- If the default record is archived, no new default is automatically set

### 4. Soft Delete (Archive)

- DELETE operations are **soft deletes** (sets `archived_at`)
- Archived records are excluded from `GET /natal-data` list
- Archived records return 404 when accessed directly
- Consider showing archived records in a separate UI section if needed

### 5. DateTime Handling

- `birth_datetime_utc` must be timezone-aware
- Use ISO-8601 format with timezone: `"2000-01-01T13:30:00+00:00"`
- Convert user input to UTC before sending
- Example: If user enters "2000-01-01 08:30 EST", convert to UTC: `"2000-01-01T13:30:00+00:00"`

### 6. Error Handling

- `404 Not Found` can mean:
  - Record doesn't exist
  - Record is archived
  - Record belongs to another user
- Use 404 (not 403) to avoid information leakage
- Always check response status before accessing response body

### 7. List Ordering

- Default records appear first (`is_default DESC`)
- Then ordered by creation date, newest first (`created_at DESC`)
- Use this ordering in your UI for consistency

### 8. Partial Updates (PATCH)

- Only send fields that need to be updated
- Omitted fields remain unchanged
- `updated_at` is automatically updated by the server

### 9. Coordinate Validation

- Latitude: `-90` to `90`
- Longitude: `-180` to `180`
- Validate on the frontend before sending to provide immediate feedback

### 10. Relationship to Chart Computation

- These endpoints manage **saved** birth data
- To compute a chart, use `POST /charts/natal` (separate endpoint)
- You can use saved natal data to populate the chart computation request

### 11. Automatic Snapshot Creation

When you create a natal data record (`POST /natal-data`), the API automatically:

- Computes a natal chart using the same engine as `POST /charts/natal`
- Creates a **natal snapshot** stored in the `chart_snapshots` table
- Stores canonical chart data (absolute ecliptic longitudes) for future use

**Key Points:**
- Snapshots are created automatically - no separate API call needed
- Snapshot creation happens in the same request as natal data creation
- If snapshot creation fails, the natal data record is still created (snapshot can be regenerated later)
- Snapshots are immutable and stored with `snapshot_key = "natal"`

**What's Stored in Snapshots:**

Snapshots store **absolute positions only** (no sign/house interpretations):

```typescript
interface NatalSnapshot {
  computed_at: string;              // ISO-8601 UTC timestamp
  snapshot_type: "natal";
  
  birth: {
    datetime_utc: string;
    timezone: string;
    place_name: string;
    lat: number;
    lon: number;
  };
  
  inputs: {
    birth_time_provided: boolean;
    birth_time_inferred: boolean;
    birth_place_provided: boolean;
    location_source: "user" | "city_lookup" | "geopy" | "unknown";
  };
  
  confidence: {
    angles_valid: boolean;
    angles_reason: string | null;
    moon_confidence: "high" | "medium" | "low";
    overall: "high" | "medium" | "low";
  };
  
  positions: {
    [body: string]: {
      lon: number;        // Absolute ecliptic longitude (0-360)
      lat: number;        // Latitude (usually 0 for planets)
      retrograde: boolean;
    };
  };
  
  angles?: {              // Only present if angles_valid = true
    ASC: number;
    DSC: number;
    MC: number;
    IC: number;
  };
}
```

**Important Notes:**
- **No sign names or house numbers** - snapshots store only absolute longitudes
- **Zodiac-system agnostic** - signs/houses are computed dynamically from longitudes
- **Confidence metadata** - indicates data quality (time inferred, location source, etc.)
- **Future-proof** - snapshots can be used for Daily Vibes, transits, and other features without recomputation

**Idempotency:**
- If a snapshot already exists for a natal data record, creation is skipped
- Each natal data record has exactly one natal snapshot (enforced by database constraint)

**Usage:**
- Snapshots are currently used internally by the API
- Future endpoints (e.g., `/me/daily-vibes`) will consume snapshots
- Frontend developers don't need to interact with snapshots directly yet

---

## Testing with cURL

```bash
# 1. Register/Login first (see AUTH_API_FRONTEND.md)
# Save cookies to file: cookies.txt

# 2. Create a natal data record
curl -X POST http://localhost:9002/natal-data \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "My Birth Chart",
    "birth_datetime_utc": "2000-01-01T13:30:00+00:00",
    "birth_timezone": "America/New_York",
    "birth_place_name": "New York, NY, USA",
    "birth_lat": 40.7128,
    "birth_lon": -74.0060,
    "is_default": false
  }'

# 3. List all natal data records
curl -X GET http://localhost:9002/natal-data \
  -b cookies.txt

# 4. Get a specific record (replace {natal_id} with actual ID)
curl -X GET http://localhost:9002/natal-data/{natal_id} \
  -b cookies.txt

# 5. Update a record
curl -X PATCH http://localhost:9002/natal-data/{natal_id} \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Updated Name",
    "is_default": true
  }'

# 6. Archive (soft delete) a record
curl -X DELETE http://localhost:9002/natal-data/{natal_id} \
  -b cookies.txt
```

---

## Summary

- **Authentication**: All endpoints require cookie-based session auth
- **CRUD Operations**: Create, Read, Update, Delete (soft delete via archive)
- **Default Handling**: Only one default per user; setting one unsets others
- **Soft Delete**: Records are archived (not hard deleted)
- **Ordering**: Default first, then by creation date (newest first)
- **Error Handling**: 404 for not found/archived/unauthorized (no information leakage)
- **DateTime**: Must be timezone-aware UTC in ISO-8601 format
- **Coordinates**: Validate latitude [-90, 90] and longitude [-180, 180]
- **Automatic Snapshots**: Natal snapshots are created automatically when natal data is created, storing canonical chart positions (absolute longitudes only) for future features like Daily Vibes

