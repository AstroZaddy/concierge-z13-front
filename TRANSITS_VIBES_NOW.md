# `/transits/vibes/now` Endpoint Documentation

## Overview

Synthesizes "Vibes of the Day" and "General Cosmic Season" summaries from transiting-to-natal aspects. The endpoint computes transiting planetary positions server-side for the current UTC time, finds all aspects within the specified orb, scores them using two lenses (inner planets for daily vibes, outer planets for cosmic season), and generates deterministic headlines and summaries using template-based language.

**Endpoint:** `POST /transits/vibes/now`  
**Authentication:** None required (public endpoint)  
**Rate Limit:** 10 requests per minute  
**Content-Type:** `application/json`

---

## Request

### Request Body

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

### Request Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `natal_longitudes` | `object` | ✅ Yes | - | Dict mapping body names to ecliptic longitudes (degrees). See valid bodies below. |
| `orb_deg` | `number` | No | `2.0` | Maximum orb in degrees for aspect detection (must be ≥ 0) |
| `max_hits` | `integer` | No | `100` | Maximum number of aspects to consider (1-720) |
| `include_debug` | `boolean` | No | `false` | Include raw theme scores in `meta.debug` field |

### Valid Natal Body Names

The following 12 bodies are supported:
- `Sun`, `Moon`, `Mercury`, `Venus`, `Mars`
- `Jupiter`, `Saturn`, `Uranus`, `Neptune`, `Pluto`
- `Chiron`, `Lilith`

**Important:**
- Invalid body names are **silently ignored** (not an error)
- You must provide **at least one valid body** or you'll get a 400 error
- Longitude values are automatically normalized to [0, 360) range
- Missing bodies are not an error - you can provide any subset

---

## Response

### Success Response (200 OK)

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

### Response Fields

#### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `ok` | `boolean` | Always `true` for successful responses |
| `timestamp_utc` | `string` | UTC timestamp when transiting positions were computed (ISO-8601) |
| `orb_deg` | `number` | Orb used for aspect detection |
| `max_hits` | `integer` | Maximum hits limit applied |
| `vibes_of_the_day` | `object` | Daily vibes summary (inner planet lens) - see below |
| `cosmic_season` | `object` | Cosmic season summary (outer planet lens) - see below |
| `meta` | `object` | Metadata and statistics - see below |
| `aspects_found` | `array` | List of all aspects found (same structure as `/transits/aspects/now`) |

#### Vibes Block Structure

Both `vibes_of_the_day` and `cosmic_season` have the same structure:

| Field | Type | Description |
|-------|------|-------------|
| `lens` | `string` | `"inner"` for day vibes, `"outer"` for cosmic season |
| `tone` | `string` | Overall tone: `"supportive"`, `"challenging"` (day only), `"intense"` (season only), or `"dynamic"` |
| `confidence` | `number` | Confidence score (0.0 to 1.0) based on number and strength of aspects |
| `headline` | `string` | Template-generated headline |
| `summary` | `string` | Template-generated summary text |
| `themes` | `array` | Top 3 themes with normalized weights (0-1, sum to 1.0) |
| `themes[].name` | `string` | Theme name |
| `themes[].weight` | `number` | Normalized weight (0.0 to 1.0) |
| `keywords` | `array` | Top 3 keywords (strings) |
| `anchors` | `array` | Top 2 anchor aspects (highest strength) |
| `anchors[].transiting_body` | `string` | Transiting body name |
| `anchors[].aspect` | `string` | Aspect type |
| `anchors[].aspect` | `string` | Natal body name |
| `anchors[].delta_from_exact_deg` | `number` | Distance from exact aspect |
| `anchors_source` | `string` | `"lens"` (filtered by planet set) or `"fallback"` (best available if no filtered anchors) |
| `energy_profile` | `object` | Energy breakdown (sums to 1.0) |
| `energy_profile.supportive` | `number` | Proportion of supportive energy (0.0 to 1.0) |
| `energy_profile.challenging` | `number` | Proportion of challenging energy (0.0 to 1.0) |
| `energy_profile.neutral` | `number` | Proportion of neutral energy (0.0 to 1.0) |

#### Meta Fields

| Field | Type | Description |
|-------|------|-------------|
| `hits_total` | `integer` | Total number of unique aspects found (len(aspects_found)) |
| `hits_used_for_scoring_day` | `integer` | Number of aspects used in day lens scoring |
| `hits_used_for_scoring_season` | `integer` | Number of aspects used in season lens scoring |
| `theme_assignments_used_day` | `integer` | Total count of (theme, hit) additions in day lens |
| `theme_assignments_used_season` | `integer` | Total count of (theme, hit) additions in season lens |
| `algorithm_version` | `string` | Algorithm version identifier (currently `"vibes_v1"`) |
| `debug` | `object` (optional) | Debug information (only if `include_debug=true`) |
| `debug.theme_scores_raw` | `object` | Raw theme scores before normalization |
| `debug.theme_scores_raw.day` | `object` | Raw scores for day lens |
| `debug.theme_scores_raw.season` | `object` | Raw scores for season lens |

---

## Key Features

### 1. Two Scoring Lenses

The endpoint uses two different scoring systems:

**Vibes of the Day (Inner Planets):**
- Focuses on inner planets: Moon (1.25), Mercury (1.15), Venus (1.10), Mars (1.10), Sun (1.00)
- Outer planets weighted at 0.25, Chiron/Lilith at 0.40
- Represents daily energy and immediate influences

**Cosmic Season (Outer Planets):**
- Focuses on outer planets: Pluto (1.25), Neptune (1.20), Uranus (1.20), Saturn (1.15), Jupiter (1.00)
- Chiron (0.80), Lilith (0.60), inner planets at 0.15
- Represents longer-term patterns and transformative cycles

### 2. Normalized Theme Weights

- Theme weights are **normalized to 0-1 range** within each block (day/season)
- Top 3 themes are selected, then normalized so they **sum to 1.0**
- This makes it easy to display as percentages or progress bars
- Raw scores available in `meta.debug.theme_scores_raw` when `include_debug=true`

### 3. Lens-Pure Anchors

- **Day vibes anchors** are filtered to inner planets only: Sun, Moon, Mercury, Venus, Mars
- **Cosmic season anchors** are filtered to outer planets only: Jupiter, Saturn, Uranus, Neptune, Pluto
- Chiron/Lilith excluded from anchors by default
- If no anchors exist in filtered set, falls back to best available and sets `anchors_source: "fallback"`
- Check `anchors_source` to know if anchors are lens-pure or fallback

### 4. Tone Calculation

Tone is determined from weighted aspect polarity:
- **Supportive** (`tone > +0.25`): More trines/sextiles than squares/oppositions
- **Challenging** (`tone < -0.25`): More squares/oppositions than trines/sextiles
  - Day vibes use `"challenging"`
  - Cosmic season uses `"intense"`
- **Dynamic** (else): Mixed or neutral energy

### 5. Deterministic Output

- Same inputs → same output (no AI/LLM usage)
- Template-based headlines and summaries
- Useful for caching and testing

---

## Error Responses

### 400 Bad Request

```json
{
  "detail": "No valid natal bodies provided. Valid bodies: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, Lilith"
}
```

**Cause:** Empty `natal_longitudes` object or all provided bodies were invalid.

### 422 Unprocessable Entity

```json
{
  "detail": [
    {
      "type": "greater_than_equal",
      "loc": ["body", "orb_deg"],
      "msg": "Input should be greater than or equal to 0",
      "input": -1.0
    }
  ]
}
```

**Cause:** Invalid request parameters (e.g., negative `orb_deg`, `max_hits` out of range).

### 500 Internal Server Error

```json
{
  "detail": "Internal server error"
}
```

**Cause:** Server-side error during computation.

---

## Example Usage

### JavaScript/TypeScript

```typescript
interface VibesRequest {
  natal_longitudes: Record<string, number>;
  orb_deg?: number;
  max_hits?: number;
  include_debug?: boolean;
}

interface Theme {
  name: string;
  weight: number;
}

interface AnchorAspect {
  transiting_body: string;
  aspect: string;
  natal_body: string;
  delta_from_exact_deg: number;
}

interface VibesLens {
  lens: string;
  tone: string;
  confidence: number;
  headline: string;
  summary: string;
  themes: Theme[];
  keywords: string[];
  anchors: AnchorAspect[];
  anchors_source: string;
  energy_profile: {
    supportive: number;
    challenging: number;
    neutral: number;
  };
}

interface VibesResponse {
  ok: boolean;
  timestamp_utc: string;
  orb_deg: number;
  max_hits: number;
  vibes_of_the_day: VibesLens;
  cosmic_season: VibesLens;
  meta: {
    hits_total: number;
    hits_used_for_scoring_day: number;
    hits_used_for_scoring_season: number;
    theme_assignments_used_day: number;
    theme_assignments_used_season: number;
    algorithm_version: string;
    debug?: {
      theme_scores_raw: {
        day: Record<string, number>;
        season: Record<string, number>;
      };
    };
  };
  aspects_found: Array<{
    transiting_body: string;
    natal_body: string;
    aspect: string;
    separation_deg: number;
    delta_from_exact_deg: number;
  }>;
}

async function getVibes(
  natalLongitudes: Record<string, number>,
  options?: { orbDeg?: number; maxHits?: number; includeDebug?: boolean }
): Promise<VibesResponse> {
  const response = await fetch('http://127.0.0.1:9002/transits/vibes/now', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      natal_longitudes: natalLongitudes,
      orb_deg: options?.orbDeg ?? 2.0,
      max_hits: options?.maxHits ?? 100,
      include_debug: options?.includeDebug ?? false,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Usage
const vibes = await getVibes({
  Sun: 123.45,
  Moon: 210.11,
  Mars: 14.22,
}, {
  orbDeg: 2.0,
  maxHits: 100,
});

// Display day vibes
console.log(`Day Vibes: ${vibes.vibes_of_the_day.headline}`);
console.log(`Tone: ${vibes.vibes_of_the_day.tone}`);
console.log(`Confidence: ${(vibes.vibes_of_the_day.confidence * 100).toFixed(0)}%`);

// Display themes with weights
vibes.vibes_of_the_day.themes.forEach(theme => {
  console.log(`${theme.name}: ${(theme.weight * 100).toFixed(0)}%`);
});

// Display energy profile
const energy = vibes.vibes_of_the_day.energy_profile;
console.log(`Supportive: ${(energy.supportive * 100).toFixed(0)}%`);
console.log(`Challenging: ${(energy.challenging * 100).toFixed(0)}%`);
console.log(`Neutral: ${(energy.neutral * 100).toFixed(0)}%`);

// Display cosmic season
console.log(`\nCosmic Season: ${vibes.cosmic_season.headline}`);
console.log(`Tone: ${vibes.cosmic_season.tone}`);
```

### React Component Example

```tsx
import { useState, useEffect } from 'react';

interface VibesData {
  vibes_of_the_day: {
    headline: string;
    summary: string;
    tone: string;
    confidence: number;
    themes: Array<{ name: string; weight: number }>;
    keywords: string[];
    energy_profile: {
      supportive: number;
      challenging: number;
      neutral: number;
    };
  };
  cosmic_season: {
    headline: string;
    summary: string;
    tone: string;
    confidence: number;
    themes: Array<{ name: string; weight: number }>;
    keywords: string[];
  };
}

function VibesDisplay({ natalLongitudes }: { natalLongitudes: Record<string, number> }) {
  const [vibes, setVibes] = useState<VibesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVibes() {
      try {
        const response = await fetch('http://127.0.0.1:9002/transits/vibes/now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            natal_longitudes: natalLongitudes,
            orb_deg: 2.0,
            max_hits: 100,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setVibes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchVibes();
  }, [natalLongitudes]);

  if (loading) return <div>Loading vibes...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!vibes) return null;

  return (
    <div>
      {/* Day Vibes */}
      <section>
        <h2>{vibes.vibes_of_the_day.headline}</h2>
        <p>{vibes.vibes_of_the_day.summary}</p>
        <div>
          <span>Tone: {vibes.vibes_of_the_day.tone}</span>
          <span>Confidence: {(vibes.vibes_of_the_day.confidence * 100).toFixed(0)}%</span>
        </div>
        
        {/* Themes */}
        <div>
          <h3>Themes</h3>
          {vibes.vibes_of_the_day.themes.map(theme => (
            <div key={theme.name}>
              <span>{theme.name}</span>
              <div style={{ width: `${theme.weight * 100}%`, height: '4px', background: '#333' }} />
            </div>
          ))}
        </div>

        {/* Energy Profile */}
        <div>
          <h3>Energy Profile</h3>
          <div>
            <div>Supportive: {(vibes.vibes_of_the_day.energy_profile.supportive * 100).toFixed(0)}%</div>
            <div>Challenging: {(vibes.vibes_of_the_day.energy_profile.challenging * 100).toFixed(0)}%</div>
            <div>Neutral: {(vibes.vibes_of_the_day.energy_profile.neutral * 100).toFixed(0)}%</div>
          </div>
        </div>
      </section>

      {/* Cosmic Season */}
      <section>
        <h2>{vibes.cosmic_season.headline}</h2>
        <p>{vibes.cosmic_season.summary}</p>
        <div>
          <span>Tone: {vibes.cosmic_season.tone}</span>
          <span>Confidence: {(vibes.cosmic_season.confidence * 100).toFixed(0)}%</span>
        </div>
      </section>
    </div>
  );
}
```

### cURL

```bash
curl -X POST "http://127.0.0.1:9002/transits/vibes/now" \
  -H "Content-Type: application/json" \
  -d '{
    "natal_longitudes": {
      "Sun": 123.45,
      "Moon": 210.11,
      "Mars": 14.22
    },
    "orb_deg": 2.0,
    "max_hits": 100
  }'
```

---

## Key Behaviors

1. **Server-side transiting positions:** All transiting positions are computed server-side for the current UTC time. You only provide natal longitudes.

2. **Partial natal input:** You can provide any subset of the 12 supported bodies. Missing bodies are not an error.

3. **Invalid bodies ignored:** If you include invalid body names (e.g., typos), they're silently ignored. Only valid bodies are used.

4. **Longitude normalization:** All longitudes are automatically normalized to [0, 360) range. You can pass values like `450.0` or `-30.0` and they'll be normalized.

5. **Normalized theme weights:** Theme weights in each block (day/season) are normalized to 0-1 and sum to 1.0. Perfect for displaying as percentages or progress bars.

6. **Lens-pure anchors:** Day vibes anchors come from inner planets only, cosmic season anchors from outer planets only. Check `anchors_source` to see if anchors are filtered or fallback.

7. **Deterministic output:** Same inputs produce the same output (no AI/LLM). Useful for caching and testing.

8. **No authentication:** This endpoint is public and doesn't require API keys or authentication.

9. **Rate limiting:** Limited to 10 requests per minute per client.

---

## Use Cases

- **Daily vibes display:** Show users their daily energy summary with themes and keywords
- **Cosmic season insights:** Display longer-term patterns and transformative cycles
- **Theme visualization:** Use normalized theme weights to create progress bars or pie charts
- **Energy profile charts:** Display supportive/challenging/neutral breakdowns
- **Anchor aspects:** Highlight the most significant aspects driving the vibes
- **Caching:** Since output is deterministic, you can cache results based on natal longitudes and timestamp

---

## Notes

- The `timestamp_utc` field tells you exactly when the transiting positions were computed
- `meta.hits_total` equals `len(aspects_found)` - the total number of unique aspects found
- `meta.hits_used_for_scoring_day` and `meta.hits_used_for_scoring_season` tell you how many aspects were actually used in scoring (may be less than `hits_total` if aspects lacked interpretation metadata)
- Theme weights always sum to 1.0 within each block (within rounding)
- `anchors_source` will be `"lens"` if anchors are filtered by planet set, or `"fallback"` if fallback was used
- The endpoint is idempotent - calling it multiple times with the same input will return the same results (assuming transiting positions haven't changed)
- Use `include_debug: true` to see raw theme scores before normalization (useful for debugging or advanced visualizations)

