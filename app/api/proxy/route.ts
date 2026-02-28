import { NextRequest, NextResponse } from "next/server";
import type { ProxyRequest } from "../../components/postman/interfaces/proxy-request.interface";
import type { ProxyResponse } from "../../components/postman/interfaces/proxy-response.interface";

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);
const SUPPORTED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

const API_KEYS = (process.env.PROXY_API_KEYS ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const TARGET_ALLOWLIST = (process.env.PROXY_TARGET_ALLOWLIST ?? "")
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

const CORS_ORIGINS = (process.env.PROXY_CORS_ORIGINS ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

export const runtime = "nodejs";

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  return origin === request.nextUrl.origin;
}

function isAllowedTarget(hostname: string) {
  if (TARGET_ALLOWLIST.length === 0) {
    return true;
  }

  const normalized = hostname.toLowerCase();
  return TARGET_ALLOWLIST.some(
    (allowedHost) => normalized === allowedHost || normalized.endsWith(`.${allowedHost}`),
  );
}

function withCors(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const headers = new Headers();

  if (origin && (origin === request.nextUrl.origin || CORS_ORIGINS.includes(origin))) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type,X-API-Key");
    headers.set("Vary", "Origin");
  }

  return headers;
}

function isAuthorized(request: NextRequest) {
  if (isSameOriginRequest(request)) {
    return true;
  }

  if (API_KEYS.length === 0) {
    return false;
  }

  const provided = request.headers.get("x-api-key")?.trim();
  return !!provided && API_KEYS.includes(provided);
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: withCors(request),
  });
}

export async function POST(request: NextRequest) {
  const corsHeaders = withCors(request);

  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Agrega x-api-key o usa same-origin." },
      { status: 401, headers: corsHeaders },
    );
  }

  try {
    const payload = (await request.json()) as ProxyRequest;

    if (!payload?.url || !payload?.method) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400, headers: corsHeaders });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(payload.url);
    } catch {
      return NextResponse.json({ error: "URL inválida." }, { status: 400, headers: corsHeaders });
    }

    if (!parsedUrl.protocol || !["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Solo se permiten URLs http/https." },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!isAllowedTarget(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "Dominio destino no permitido por la allowlist." },
        { status: 403, headers: corsHeaders },
      );
    }

    const method = String(payload.method).toUpperCase();

    if (!SUPPORTED_METHODS.has(method)) {
      return NextResponse.json(
        { error: `Método no soportado: ${method}` },
        { status: 400, headers: corsHeaders },
      );
    }

    const upstreamHeaders = new Headers(payload.headers ?? {});

    for (const header of HOP_BY_HOP_HEADERS) {
      upstreamHeaders.delete(header);
    }

    const start = performance.now();
    const upstream = await fetch(parsedUrl.toString(), {
      method,
      headers: upstreamHeaders,
      body: METHODS_WITHOUT_BODY.has(method) ? undefined : payload.body,
      cache: "no-store",
      redirect: "follow",
    });
    const durationMs = Math.round(performance.now() - start);

    const responseBody = await upstream.text();
    const response: ProxyResponse = {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: Array.from(upstream.headers.entries()),
      body: responseBody,
      durationMs,
      sizeBytes: new TextEncoder().encode(responseBody).length,
    };

    return NextResponse.json(response, { status: 200, headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del proxy";
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
