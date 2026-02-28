import { NextRequest, NextResponse } from "next/server";
import { findMatchingMock } from "../../../lib/mock-storage";

export const runtime = "nodejs";

// Allowed origins for mock consumption (separate from admin)
const ALLOWED_MOCK_ORIGINS = (process.env.MOCK_CONSUMER_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const MOCK_API_KEYS = (process.env.MOCK_API_KEYS ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

function isAuthorized(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  
  // Same-origin requests are always allowed (for testing from the UI)
  if (!origin || origin === request.nextUrl.origin) {
    return true;
  }
  
  // Check API key
  const apiKey = request.headers.get("x-api-key");
  if (apiKey && MOCK_API_KEYS.includes(apiKey)) {
    return true;
  }
  
  // Check allowed origins
  if (ALLOWED_MOCK_ORIGINS.length > 0 && ALLOWED_MOCK_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Development mode: allow localhost with warning
  if (process.env.NODE_ENV === "development") {
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return true;
    }
  }
  
  return false;
}

function buildCorsHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const origin = request.headers.get("origin");
  
  if (origin) {
    // Only set CORS headers if origin is present
    const isAllowed = 
      origin === request.nextUrl.origin ||
      (ALLOWED_MOCK_ORIGINS.length > 0 && ALLOWED_MOCK_ORIGINS.includes(origin)) ||
      (process.env.NODE_ENV === "development" && (origin.includes("localhost") || origin.includes("127.0.0.1")));
    
    if (isAllowed) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");
      headers.set("Access-Control-Max-Age", "86400");
      headers.set("Vary", "Origin");
    }
  }
  
  return headers;
}

async function handleMockRequest(
  request: NextRequest,
  params: { path: string[] },
): Promise<NextResponse> {
  const corsHeaders = buildCorsHeaders(request);
  
  // Check authorization
  if (!isAuthorized(request)) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized. Provide X-API-Key header or use allowed origin." }),
      { status: 401, headers: { ...Object.fromEntries(corsHeaders), "Content-Type": "application/json" } }
    );
  }
  
  // Build the path from segments
  const pathname = "/" + params.path.join("/");
  const method = request.method;
  const queryParams = request.nextUrl.searchParams;
  
  try {
    // If testing a specific mock from the UI, use that mock directly
    const testMockId = request.headers.get("X-Mocky-Test-Mock-Id");
    let mock: Awaited<ReturnType<typeof findMatchingMock>> = null;
    
    if (testMockId) {
      const { readMockStorage } = await import("../../../lib/mock-storage");
      const storage = await readMockStorage();
      for (const collection of storage.collections) {
        const found = collection.mocks.find((m) => m.id === testMockId);
        if (found) {
          mock = found;
          break;
        }
      }
    } else {
      mock = await findMatchingMock(method, pathname, queryParams, request.headers);
    }
    
    if (!mock) {
      return new NextResponse(
        JSON.stringify({ 
          error: "No matching mock found",
          method,
          path: pathname,
          hint: "Create a mock definition for this endpoint in the Mocky UI"
        }),
        { 
          status: 404, 
          headers: { ...Object.fromEntries(corsHeaders), "Content-Type": "application/json" } 
        }
      );
    }
    
    // Build response headers from mock definition
    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set("X-Mocky-Mock-Id", mock.id);
    responseHeaders.set("X-Mocky-Mock-Name", encodeURIComponent(mock.name));
    
    // Add custom response headers from mock definition
    for (const header of mock.responseHeaders) {
      if (header.enabled && header.key.trim()) {
        responseHeaders.set(header.key, header.value);
      }
    }
    
    // Try to detect content type from response body
    if (!responseHeaders.has("Content-Type")) {
      const trimmedBody = mock.responseBody.trim();
      if (trimmedBody.startsWith("{") || trimmedBody.startsWith("[")) {
        responseHeaders.set("Content-Type", "application/json");
      } else if (trimmedBody.startsWith("<")) {
        responseHeaders.set("Content-Type", "text/html");
      } else {
        responseHeaders.set("Content-Type", "text/plain");
      }
    }
    
    // Apply artificial delay if configured
    if (mock.responseDelay && mock.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, mock.responseDelay));
    }

    return new NextResponse(mock.responseBody, {
      status: mock.responseStatus || 200,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal mock server error";
    return new NextResponse(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...Object.fromEntries(corsHeaders), "Content-Type": "application/json" } 
      }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsHeaders = buildCorsHeaders(request);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleMockRequest(request, params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleMockRequest(request, params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleMockRequest(request, params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleMockRequest(request, params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleMockRequest(request, params);
}

export async function HEAD(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleMockRequest(request, params);
}
