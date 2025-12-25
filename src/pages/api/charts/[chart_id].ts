import type { APIRoute } from "astro";

export const prerender = false;

const BACKEND_API_URL = import.meta.env.BACKEND_API_URL || "http://127.0.0.1:9002";

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const chartId = params.chart_id;
    if (!chartId) {
      return new Response(
        JSON.stringify({ detail: "Chart ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    
    // Get cookies from the incoming request
    const cookieHeader = request.headers.get("cookie");
    
    // Forward the request to the backend
    const response = await fetch(`${BACKEND_API_URL}/charts/${chartId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(cookieHeader && { Cookie: cookieHeader }),
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
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Forward cookies from backend response
    const cookies = response.headers.get("set-cookie");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (cookies) {
      headers["Set-Cookie"] = cookies;
    }

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("Error proxying PATCH /charts/{chart_id}:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to update chart",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

