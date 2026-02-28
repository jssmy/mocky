import { NextRequest, NextResponse } from "next/server";
import { readMockStorage, writeMockStorage } from "../../lib/mock-storage";

export const runtime = "nodejs";

const ALLOWED_ORIGINS = (process.env.MOCK_ADMIN_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  
  // Same-origin requests are always allowed
  if (!origin || origin === request.nextUrl.origin) {
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
  if (!isAllowedOrigin(request)) {
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
  if (!isAllowedOrigin(request)) {
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
