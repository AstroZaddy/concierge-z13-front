import type { APIRoute } from 'astro';

export const prerender = false;

// Backend API URL (server-side only, not exposed to browser)
const BACKEND_API_URL = import.meta.env.BACKEND_API_URL || 'http://127.0.0.1:9002';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Forward query parameters
    const days = url.searchParams.get('days') || '14';
    const mode = url.searchParams.get('mode') || 'z13';
    const datetime = url.searchParams.get('datetime');
    
    // Construct backend URL
    let backendUrl = `${BACKEND_API_URL}/lunar_events?days=${days}&mode=${mode}`;
    if (datetime) {
      backendUrl += `&datetime=${encodeURIComponent(datetime)}`;
    }
    
    // Fetch from FastAPI backend (server-side)
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

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
    console.error('Error in lunar_events API endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch lunar events',
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

