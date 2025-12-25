import type { APIRoute } from 'astro';

export const prerender = false;

// Backend API URL (server-side only, not exposed to browser)
const BACKEND_API_URL = import.meta.env.BACKEND_API_URL || 'http://127.0.0.1:9002';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get cookies from the incoming request
    const cookieHeader = request.headers.get('cookie');
    
    // Get request body
    const body = await request.json().catch(() => ({}));
    
    // Construct backend URL
    const backendUrl = `${BACKEND_API_URL}/charts/natal`;
    
    // Fetch from FastAPI backend (server-side)
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Extract error message from response
      const errorMessage = responseData.detail || 
                          (typeof responseData === 'string' ? responseData : null) ||
                          responseData.error ||
                          responseData.message ||
                          `Backend API error: ${response.status} ${response.statusText}`;
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          detail: responseData.detail || responseData,
          status: response.status
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
    console.error('Error in charts/natal API endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create natal chart',
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

