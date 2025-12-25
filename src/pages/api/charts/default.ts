import type { APIRoute } from 'astro';

export const prerender = false;

// Backend API URL (server-side only, not exposed to browser)
// Note: Ensure BACKEND_API_URL is set in production environment
const BACKEND_API_URL = import.meta.env.BACKEND_API_URL || 'http://127.0.0.1:9002';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Get cookies from the incoming request
    const cookieHeader = request.headers.get('cookie');
    
    // Construct backend URL
    const backendUrl = `${BACKEND_API_URL}/charts/default`;
    
    // Fetch from FastAPI backend (server-side)
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      const errorText = await response.text();
      responseData = { detail: errorText || `HTTP ${response.status}: ${response.statusText}` };
    }

    if (!response.ok) {
      console.error('[API] /charts/default error:', {
        status: response.status,
        statusText: response.statusText,
        detail: responseData
      });
      return new Response(
        JSON.stringify({ 
          error: `Backend API error: ${response.status} ${response.statusText}`,
          detail: responseData.detail || responseData.error || responseData.message || responseData
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return the data as JSON
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in charts/default API endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch default chart',
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

