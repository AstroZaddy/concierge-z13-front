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