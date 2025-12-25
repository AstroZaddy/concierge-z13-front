# Authentication API - Frontend Developer Guide

## Overview

The Z13 API uses **server-side sessions** with **HttpOnly cookies** for authentication. This means:

- Sessions are stored server-side in PostgreSQL
- Authentication tokens are sent via cookies (not accessible to JavaScript)
- Cookies are automatically included in requests by the browser
- No manual token management required on the frontend

## Base URL

All endpoints are under `/auth`:

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout (revoke session)
- `GET /auth/me` - Get current authenticated user info

## Cookie Details

- **Cookie Name**: `z13_session` (configurable via `AUTH_COOKIE_NAME` env var)
- **HttpOnly**: `true` (not accessible to JavaScript)
- **SameSite**: `Lax`
- **Secure**: `true` in production, `false` in development
- **Path**: `/`
- **TTL**: 30 days (configurable via `AUTH_SESSION_TTL_DAYS` env var)

**Important**: The cookie is automatically managed by the browser. You don't need to manually set or read it in JavaScript.

## Endpoints

### POST /auth/register

Register a new user account. Automatically creates a session and sets the authentication cookie.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword123",
  "plan_type": "free"  // optional, defaults to "free"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "plan_type": "free"
}
```

**Errors:**
- `409 Conflict` - Email already registered
- `422 Unprocessable Entity` - Validation error (invalid email format, password too short, invalid plan_type)

**Notes:**
- Email is automatically normalized (lowercased and trimmed)
- Password must be at least 10 characters
- Valid `plan_type` values: `"free"`, `"premium"` (defaults to `"free"` if not provided)
- Cookie is automatically set in the response

---

### POST /auth/login

Login with email and password. Creates a new session and sets the authentication cookie.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword123"
}
```

**Response:** `200 OK`
```json
{
  "ok": true
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials (generic message to prevent user enumeration)
- `403 Forbidden` - Account is inactive

**Notes:**
- Email is automatically normalized (lowercased and trimmed)
- Generic error message prevents user enumeration attacks
- Cookie is automatically set in the response

---

### POST /auth/logout

Logout by revoking the current session. Requires authentication.

**Request:** No body required (cookie is sent automatically)

**Response:** `200 OK`
```json
{
  "ok": true
}
```

**Errors:**
- `401 Unauthorized` - Not authenticated

**Notes:**
- Cookie is automatically cleared in the response
- Session is marked as revoked in the database

---

### GET /auth/me

Get information about the currently authenticated user. Requires authentication.

**Request:** No body required (cookie is sent automatically)

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "plan_type": "free"
}
```

**Errors:**
- `401 Unauthorized` - Not authenticated or session invalid/expired

**Notes:**
- Use this endpoint to check if a user is logged in
- Session is automatically validated on each request
- `last_seen_at` is updated (throttled to once per minute)

---

## Frontend Integration Examples

### TypeScript/JavaScript (Fetch API)

```typescript
// Register a new user
async function register(email: string, password: string, planType = "free") {
  const response = await fetch("http://localhost:9002/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important: include cookies
    body: JSON.stringify({
      email,
      password,
      plan_type: planType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  return await response.json();
}

// Login
async function login(email: string, password: string) {
  const response = await fetch("http://localhost:9002/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important: include cookies
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  return await response.json();
}

// Logout
async function logout() {
  const response = await fetch("http://localhost:9002/auth/logout", {
    method: "POST",
    credentials: "include", // Important: include cookies
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  return await response.json();
}

// Get current user
async function getCurrentUser() {
  const response = await fetch("http://localhost:9002/auth/me", {
    method: "GET",
    credentials: "include", // Important: include cookies
  });

  if (response.status === 401) {
    return null; // Not authenticated
  }

  if (!response.ok) {
    throw new Error("Failed to get user info");
  }

  return await response.json();
}
```

### React Example

```tsx
import { useState, useEffect } from "react";

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    await loginUser(email, password);
    const user = await getCurrentUser();
    setUser(user);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return { user, loading, login, logout };
}
```

### Axios Example

```typescript
import axios from "axios";

// Configure axios to include cookies
const api = axios.create({
  baseURL: "http://localhost:9002",
  withCredentials: true, // Important: include cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Register
export const register = async (email: string, password: string, planType = "free") => {
  const response = await api.post("/auth/register", {
    email,
    password,
    plan_type: planType,
  });
  return response.data;
};

// Login
export const login = async (email: string, password: string) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });
  return response.data;
};

// Logout
export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      return null; // Not authenticated
    }
    throw error;
  }
};
```

---

## Important Notes for Frontend Developers

1. **Always use `credentials: "include"`** (Fetch) or `withCredentials: true` (Axios) to ensure cookies are sent with requests.

2. **Cookie is HttpOnly** - You cannot read or modify the session cookie from JavaScript. This is a security feature.

3. **Automatic Cookie Management** - The browser automatically:
   - Sends the cookie with requests to the same origin
   - Stores the cookie when received in responses
   - Clears the cookie when it expires or is deleted

4. **Session Validation** - Every authenticated request validates the session. If the session is invalid/expired, you'll get a `401` response.

5. **Error Handling** - Login errors are generic ("Invalid credentials") to prevent user enumeration attacks. Don't show specific error messages like "Email not found" or "Password incorrect".

6. **CORS** - If your frontend is on a different origin, ensure CORS is properly configured on the backend to allow credentials.

7. **Checking Auth Status** - Use `GET /auth/me` to check if a user is logged in. A `401` response means not authenticated.

8. **Logout** - Always call `POST /auth/logout` when the user logs out. This revokes the session server-side and clears the cookie.

---

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:9002/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","plan_type":"free"}' \
  -c cookies.txt -v

# Login
curl -X POST http://localhost:9002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt -v

# Get current user (use saved cookies)
curl -X GET http://localhost:9002/auth/me \
  -b cookies.txt -v

# Logout
curl -X POST http://localhost:9002/auth/logout \
  -b cookies.txt -v
```

---

## Summary

- **Authentication**: Server-side sessions with HttpOnly cookies
- **No manual token management**: Browser handles cookies automatically
- **Always include credentials**: Use `credentials: "include"` or `withCredentials: true`
- **Check auth status**: Call `GET /auth/me` to verify authentication
- **Generic error messages**: Login errors don't reveal if email exists
- **Automatic cookie handling**: Cookies are set/cleared automatically by the server

