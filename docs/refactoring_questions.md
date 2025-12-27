# Refactoring questions

## api

Anonymous user: what calls?
Registered no chart: what calls?
Registered with chart: what calls?
Editing chart: what calls?

## Database

What tables?
What fields in each table?

Absolutely. Here’s a clean, drop-in Markdown summary that keeps everything anchored to the user story and the actual frontend↔backend conversations.

---

## Z13 User Story → API Conversation Map

Everything flows from what the user is doing. APIs exist only to support those conversations.

---

### User Story (North Star)
	1.	Anonymous user → Registered user
	2.	Registered user → Charts / snapshots saved
	3.	Charts saved → Daily user
	4.	Daily user → Premium subscriber (future)

---

### Frontend User States & Behaviors

#### Anonymous User

What they do
* Land on marketing page
* Try a demo chart
* Register or log in

UI behavior
* Marketing content
* “Try a chart” demo
* Prominent Register / Login CTA

---

#### Registered User (No Chart Yet)

What they do
* Complete onboarding (birth data form)
* Save their first chart

UI behavior
* Onboarding form auto-shown after registration
* Confirmation → redirect to Daily Vibes

---

#### Registered User (Chart Saved = Daily User)

What they do
* Land on Daily Vibes
* View natal placements
* View personalized transits/aspects
* Occasionally edit chart data

UI behavior
* Personalized landing page
* Collapsible cards, filters, modals
* “Edit chart” option

---

#### Premium User (Future)

What they do
* Exceed limits or access premium-only features
* Upgrade plan

UI behavior
* Soft paywalls
* Upgrade CTAs

---

### Frontend ↔ Backend Conversations

Site Load (Authenticated Check)

Purpose: “Who am I?”

API
* GET /auth/me

Returns

{ "id": "...", "email": "...", "plan_type": "free" }

Used by
* Navbar
* Landing page routing
* Global user context

---

Demo Chart (Stateless)

Purpose: “Compute a chart for this input”

API
* POST /charts/natal

Input
* Date/time
* Timezone
* Location (lat/lon/place)
* Mode (z13)
* return_both_systems

Returns
* Full computed natal chart (no DB writes)

Notes
* Used by anonymous users and previews
* No persistence

---

Registration

Purpose: “Create my account and log me in”

API
* POST /auth/register

Returns
* Session cookie

Frontend
* Redirects immediately to onboarding

---

Save Natal Data (Creates Snapshot Automatically)

Purpose: “Save this chart to my account”

API
* POST /natal-data

Input
* Name
* birth_datetime_utc
* birth_timezone
* place name + lat/lon
* birth_time_provided
* birth_place_provided
* is_default (true if first chart)

Backend behavior
* Creates natal_data
* Automatically creates chart_snapshot (natal)

---

Load Saved Charts

Purpose: “What charts do I have?”

API
* GET /natal-data

Returns
* Array of natal_data records
* Default chart inferred in frontend (or later backend)

---

Daily Vibes / Placements

Purpose: “Give me my personalized astrology”

APIs
* GET /charts/snapshots/natal/placements
* Transits/aspects endpoints (current + natal)

Input
* natal_id (optional; default inferred)

Returns
* Placements (z13 / tropical / both)
* Angles (if valid)
* Transits & aspects

---

Edit Chart Data

Purpose: “Fix my birth data”

API
* PATCH /natal-data/{id}

Backend
* Updates natal_data
* (Optionally) triggers snapshot regeneration

---

Regenerate Snapshot (Explicit)

Purpose: “Rebuild this snapshot”

API (recommended)
* POST /natal-data/{id}/snapshots/natal/regenerate

Why
* Clean recovery path
* Future-proofing
* Avoids hidden side effects

---

### Minimal API Set for Steps 1–3

Auth
* POST /auth/register
* POST /auth/login
* POST /auth/logout
* GET /auth/me

Compute (Stateless)
* POST /charts/natal

Persistence
* POST /natal-data
* GET /natal-data
* PATCH /natal-data/{id}
* DELETE /natal-data/{id} (archive)

Snapshot / Placement Plumbing
* GET /charts/snapshots/natal/placements
* POST /natal-data/{id}/snapshots/natal/regenerate

---

### Design Principle (The Rule of Sanity)

If an endpoint does not support a specific user action in the story, it doesn’t belong (yet).

This gives you:
* Fewer endpoints
* Cleaner frontend logic
* Easier future refactors
* Clear premium expansion paths


Z13 API – v1 Endpoint List

🌐 Public / Anonymous (no auth)

These support exploration and curiosity. No persistence.

Sky & lunar exploration
 * GET /positions
 * GET /lunar_events
 	* supports days, datetime, mode

Demo chart (stateless)
 * POST /charts/natal
 	* computes placements from input
 	* no DB write
 	* used for “try it out” before signup

⸻

🔐 Authentication

Session-based (cookie).
 * POST /auth/register
 	* input: email, password, optional display_name
 	* creates user + session
 * POST /auth/login
 * POST /auth/logout
 * GET /auth/me
 	* returns:
 	* id
 	* email
 	* display_name
 	* plan_type
 	* default_natal_data_id

Used by frontend for routing:
 * logged out → explore
 * logged in, no charts → onboarding
 * logged in, has charts → daily view

⸻

🧭 Charts (natal data + placements)

Create chart (onboarding)
 * POST /natal-data 🔐
 	* creates natal_data
 	* automatically generates chart placement snapshot (snapshot_key="natal")
 	* if no default exists → sets users.default_natal_data_id
 	* returns created chart summary

List charts
 	* GET /natal-data 🔐
 	* returns all active charts for user
 	* is_default derived from users.default_natal_data_id

Update chart
 * PATCH /natal-data/{id} 🔐
 	* updates natal inputs only
 	* does not implicitly regenerate placements


Set default chart
 * PATCH /users/me 🔐
 	* body: { "default_natal_data_id": "<uuid>" }
(optional sugar endpoint later)
 	* POST /natal-data/{id}/make-default

⸻

🌅 Daily visit / personalization

* GET /chart 🔐

Purpose: Return the selected chart’s snapshot (astronomy payload) plus derived placement data for both zodiac systems, in one payload.

Param | Type | Required | Default | Notes
chart_id | UUID | No | resolved default | If omitted, resolve chart via rules below
include_snapshot | boolean | No | true | Can turn off later if payload too big



Aggregated daily view (recommended)
 * GET /vibes 🔐
 	* Returns personalized astrological context for a chart, defaulting to the users default chart, at a given moment, defaulting to now.
	* automatically uses default_natal_data_id
 	* returns:
 	* derived natal placements (z13 / tropical / both)
 	* current sky context
 	* lunar day / next 24h events
 	* transit highlights (inner vs outer)

This is the “one request, whole page” endpoint.

Params:
Param |Type | Required | Default | Meaning
chart_id | UUID | No | user’s default chart | Which chart to evaluate
datetime | ISO-8601 string | No | current UTC | Moment to evaluate vibes
mode | string | No | both | z13, tropical, or both
window_hours | int | No | 24 | Look-ahead window for lunar/

### Examples
GET /vibes
GET /vibes?datetime=2025-12-22T08:00:00Z
GET /vibes?chart_id=9a3c...&datetime=2026-03-21T12:00:00Z
GET /vibes?chart_id=9a3c...&mode=z13

	1.	If chart_id is provided:
	•	validate it belongs to the authenticated user
	2.	Else:
	•	resolve users.default_natal_data_id
	3.	If no chart can be resolved:
	•	return 409 or 422 with "no_chart_configured"

This keeps frontend logic simple and predictable.

⸻

Internal behavior (authoritative)
	1.	Identify user via session
	2.	Resolve target chart (explicit or default)
	3.	Load the single canonical snapshot for that chart
	4.	Derive astrological layers at datetime
	5.	Package results into a UI-ready payload

No persistence happens here. /vibes is pure read + compute.


⸻

🛠 Internal / Debug (optional, auth-only)
 * GET /natal-data/{id}/snapshots/{snapshot_key} 🔐
 	* returns raw computed_json (astronomy payload)
 	* useful for debugging / validation

⸻

Minimal v1 Shipping Set (if you want ultra-lean)

Public
 * GET /positions
 * GET /lunar_events

Auth
 * POST /auth/register
 * POST /auth/login
 * POST /auth/logout
 * GET /auth/me

Charts
 * POST /natal-data
 * GET /natal-data
 * PATCH /users/me
 * GET /chart

Daily
 * GET /daily_vibes
 

⸻

Key architectural notes (for the doc)
 * Public endpoints = no auth
 * User-specific endpoints = session auth
 * Placements are astronomical snapshots, zodiac-agnostic
 * Astrology layers are derived at delivery time
 * Default chart lives on the user, not the chart