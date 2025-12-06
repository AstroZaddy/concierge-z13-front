# Using Zodiac Mode in API Calls

## In React Components

```jsx
import { useZodiacMode } from "../contexts/ZodiacModeContext";
import { buildApiUrl, apiRequest } from "../utils/api";

function MyComponent() {
  const { mode } = useZodiacMode();
  
  // Use buildApiUrl to create URLs with mode parameter
  const url = buildApiUrl("/positions", { datetime: "2025-01-01T00:00:00Z" }, mode);
  
  // Or use apiRequest for complete fetch calls
  const fetchData = async () => {
    const response = await apiRequest(
      "/positions",
      { method: "GET" },
      { datetime: "2025-01-01T00:00:00Z" },
      mode
    );
    const data = await response.json();
    return data;
  };
  
  return <div>Current mode: {mode}</div>;
}
```

## Access Mode Directly

```jsx
import { useZodiacMode } from "../contexts/ZodiacModeContext";

function MyComponent() {
  const { mode, setMode } = useZodiacMode();
  
  // Read current mode
  console.log(mode); // "z13" or "tropical"
  
  // Change mode programmatically
  const switchToTropical = () => setMode("tropical");
  
  return <button onClick={switchToTropical}>Switch to Tropical</button>;
}
```

## Manual API Calls

For non-React code, you can read directly from localStorage:

```javascript
const mode = localStorage.getItem("z13-zodiac-mode") || "z13";
const url = `http://localhost:8000/positions?mode=${mode}`;
```

