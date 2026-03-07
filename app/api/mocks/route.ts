import { NextRequest, NextResponse } from "next/server";
import { readMockStorage, writeMockStorage } from "../../lib/mock-storage";

export const runtime = "nodejs";

const ALLOWED_ORIGINS = (process.env.MOCK_ADMIN_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ADMIN_API_KEYS = (process.env.MOCK_ADMIN_API_KEYS ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

function getRequestOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const referer = request.headers.get("referer");
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function hasValidAdminApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key")?.trim();
  if (!apiKey) return false;
  return ADMIN_API_KEYS.includes(apiKey);
}

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = getRequestOrigin(request);

  if (!origin) {
    return false;
  }

  // Same-origin requests are allowed
  if (origin === request.nextUrl.origin) {
    return true;
  }
  
  // Check allowlist
  if (ALLOWED_ORIGINS.length > 0) {
    return ALLOWED_ORIGINS.includes(origin);
  }
  
  // Development mode: allow localhost
  if (process.env.NODE_ENV === "development") {
    return origin.includes("localhost") || origin.includes("127.0.0.1");
  }
  
  return false;
}

function withCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  
  if (origin && isAllowedOrigin(request)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
    response.headers.set("Vary", "Origin");
  }
  
  return response;
}

// Preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  return withCors(request, response);
}

// Get all collections
export async function GET(request: NextRequest) {
  if (!isAllowedOrigin(request) && !hasValidAdminApiKey(request)) {
    return withCors(request, NextResponse.json({ error: "Forbidden" }, { status: 403 }));
  }
  
  try {
    const storage = await readMockStorage();
    return withCors(request, NextResponse.json(storage));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error reading mocks";
    return withCors(request, NextResponse.json({ error: message }, { status: 500 }));
  }
}

// Create or update collections (full replace)
export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request) && !hasValidAdminApiKey(request)) {
    return withCors(request, NextResponse.json({ error: "Forbidden" }, { status: 403 }));
  }
  
  try {
    const body = await request.json();
    
    if (!body || !Array.isArray(body.collections)) {
      return withCors(
        request,
        NextResponse.json({ error: "Invalid payload. Expected { collections: [...] }" }, { status: 400 })
      );
    }
    
    await writeMockStorage({
      collections: body.collections,
      updatedAt: Date.now(),
    });
    
    return withCors(request, NextResponse.json({ success: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error saving mocks";
    return withCors(request, NextResponse.json({ error: message }, { status: 500 }));
  }
}
