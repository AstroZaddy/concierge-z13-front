import type { APIRoute } from 'astro';

// Ensure this route is not prerendered (server-side only)

// Backend API URL (server-side only, not exposed to browser)
const BACKEND_API_URL = import.meta.env.BACKEND_API_URL || 'http://127.0.0.1:9002';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Get cookies from the incoming request
    const cookieHeader = request.headers.get('cookie');
    
    // Construct backend URL
    const backendUrl = `${BACKEND_API_URL}/natal-data`;
    
    // Fetch from FastAPI backend (server-side)
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
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

    // Return the data as JSON
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in natal-data GET API endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get natal data',
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

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get request body
    const body = await request.json();
    
    // Get cookies from the incoming request
    const cookieHeader = request.headers.get('cookie');
    
    // Construct backend URL
    const backendUrl = `${BACKEND_API_URL}/natal-data`;
    
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

    // Return the data as JSON
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in natal-data POST API endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create natal data',
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

