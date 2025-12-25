import type { APIRoute } from 'astro';

export const prerender = false;

// Backend API URL (server-side only, not exposed to browser)
const BACKEND_API_URL = import.meta.env.BACKEND_API_URL || 'http://127.0.0.1:9002';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Forward query parameters
    const mode = url.searchParams.get('mode') || 'both';
    const datetime = url.searchParams.get('datetime');
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    const timezone = url.searchParams.get('timezone');
    const keys = url.searchParams.getAll('keys'); // Support multiple keys parameters
    
    // Construct backend URL
    let backendUrl = `${BACKEND_API_URL}/positions?mode=${mode}`;
    if (datetime) {
      backendUrl += `&datetime=${encodeURIComponent(datetime)}`;
    }
    if (lat) {
      backendUrl += `&lat=${lat}`;
    }
    if (lon) {
      backendUrl += `&lon=${lon}`;
    }
    if (timezone) {
      backendUrl += `&timezone=${encodeURIComponent(timezone)}`;
    }
    // Add all keys parameters
    keys.forEach(key => {
      backendUrl += `&keys=${encodeURIComponent(key)}`;
    });
    
    console.log('[API] Fetching positions from backend:', backendUrl);
    
    // Fetch from FastAPI backend (server-side)
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('[API] Backend response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ 
          error: `Backend API error: ${response.status} ${response.statusText}`,
          detail: errorData.detail || errorData
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const data = await response.json();

    // Return the data as JSON
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in positions API endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch positions',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

