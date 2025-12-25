import type { APIRoute } from 'astro';

// Ensure this route is not prerendered (server-side only)

// Backend API URL (server-side only, not exposed to browser)
const BACKEND_API_URL = import.meta.env.BACKEND_API_URL || 'http://127.0.0.1:9002';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get cookies from the incoming request
    const cookieHeader = request.headers.get('cookie');
    
    // Construct backend URL
    const backendUrl = `${BACKEND_API_URL}/auth/logout`;
    
    // Fetch from FastAPI backend (server-side)
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: `Backend API error: ${response.status} ${response.statusText}`,
          detail: responseData.detail || responseData
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Forward cookies from backend response (for clearing the cookie)
    const cookies = response.headers.get('set-cookie');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (cookies) {
      headers['Set-Cookie'] = cookies;
    }

    // Return the data as JSON with cookies
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Error in auth/logout API endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to logout',
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

