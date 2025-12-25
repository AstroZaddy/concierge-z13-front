import type { APIRoute } from 'astro';

// Ensure this route is not prerendered (server-side only)

// Backend API URL (server-side only, not exposed to browser)
const BACKEND_API_URL = import.meta.env.BACKEND_API_URL || 'http://127.0.0.1:9002';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Get cookies from the incoming request
    const cookieHeader = request.headers.get('cookie');
    
    // Get query parameters
    const natalId = url.searchParams.get('natal_id');
    const zodiac = url.searchParams.get('zodiac') || 'z13';
    const includeAngles = url.searchParams.get('include_angles') !== 'false';
    const includeHouses = url.searchParams.get('include_houses') === 'true';
    const houseSystem = url.searchParams.get('house_system');
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (natalId) queryParams.set('natal_id', natalId);
    queryParams.set('zodiac', zodiac);
    if (!includeAngles) queryParams.set('include_angles', 'false');
    if (includeHouses) queryParams.set('include_houses', 'true');
    if (houseSystem) queryParams.set('house_system', houseSystem);
    
    // Construct backend URL
    const backendUrl = `${BACKEND_API_URL}/charts/snapshots/natal/placements?${queryParams.toString()}`;
    
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
    console.error('Error in charts/snapshots/natal/placements API endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get snapshot placements',
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

