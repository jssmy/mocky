import type { HttpMethod } from "../enums/http-method.enum";
import type { KeyValueRow } from "../interfaces/key-value-row.interface";

export interface ParsedCurl {
  method: HttpMethod;
  path: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  body: string;
}

/**
 * Parse a cURL command string and extract method, path, params, headers, and body
 */
export function parseCurl(curlCommand: string): ParsedCurl | null {
  try {
    // Normalize the command - remove line continuations and extra whitespace
    const normalized = curlCommand
      .replace(/\\\r?\n/g, " ") // Remove line continuations
      .replace(/\s+/g, " ")     // Normalize whitespace
      .trim();

    // Verify it's a curl command
    if (!normalized.toLowerCase().startsWith("curl ")) {
      return null;
    }

    let method: HttpMethod = "GET" as HttpMethod;
    const headers: KeyValueRow[] = [];
    let body = "";
    let url = "";

    // Extract parts using regex
    const parts = tokenize(normalized);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];

      // Method flag
      if ((part === "-X" || part === "--request") && nextPart) {
        method = nextPart.toUpperCase() as HttpMethod;
        i++;
        continue;
      }

      // Header flag
      if ((part === "-H" || part === "--header") && nextPart) {
        const headerValue = unquote(nextPart);
        const colonIndex = headerValue.indexOf(":");
        if (colonIndex > 0) {
          const key = headerValue.substring(0, colonIndex).trim();
          const value = headerValue.substring(colonIndex + 1).trim();
          // Skip certain headers that are auto-generated
          if (!["content-length", "host", "user-agent", "accept-encoding"].includes(key.toLowerCase())) {
            headers.push({
              id: crypto.randomUUID(),
              key,
              value,
              enabled: true,
            });
          }
        }
        i++;
        continue;
      }

      // Data/body flags
      if ((part === "-d" || part === "--data" || part === "--data-raw" || part === "--data-binary") && nextPart) {
        body = unquote(nextPart);
        // If we have a body and method is still GET, change to POST
        if (method === "GET") {
          method = "POST" as HttpMethod;
        }
        i++;
        continue;
      }

      // URL (usually the last argument without a flag, or after certain flags)
      if (part === "--url" && nextPart) {
        url = unquote(nextPart);
        i++;
        continue;
      }

      // Check if this looks like a URL (not a flag)
      if (!part.startsWith("-") && (part.startsWith("http") || part.startsWith("'http") || part.startsWith('"http'))) {
        url = unquote(part);
        continue;
      }

      // Also catch URLs that might be at the end without quotes
      if (!part.startsWith("-") && i === parts.length - 1 && part.includes("/")) {
        url = unquote(part);
        continue;
      }
    }

    // Parse URL
    if (!url) {
      return null;
    }

    const { path, params } = parseUrl(url);

    return {
      method,
      path,
      params,
      headers,
      body,
    };
  } catch (error) {
    console.error("Error parsing cURL:", error);
    return null;
  }
}

/**
 * Tokenize the curl command respecting quotes
 */
function tokenize(command: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  // Skip "curl " prefix
  const chars = command.substring(5).split("");

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      current += char;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === " " && !inSingleQuote && !inDoubleQuote) {
      if (current.trim()) {
        tokens.push(current.trim());
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}

/**
 * Remove surrounding quotes from a string
 */
function unquote(str: string): string {
  const trimmed = str.trim();
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || 
      (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Parse URL and extract path and query params
 */
function parseUrl(urlString: string): { path: string; params: KeyValueRow[] } {
  try {
    const url = new URL(urlString);
    const params: KeyValueRow[] = [];

    // Extract query params
    url.searchParams.forEach((value, key) => {
      params.push({
        id: crypto.randomUUID(),
        key,
        value,
        enabled: true,
      });
    });

    // Return just the path (without domain)
    return {
      path: url.pathname,
      params,
    };
  } catch {
    // If URL parsing fails, try to extract path manually
    const questionMark = urlString.indexOf("?");
    if (questionMark > -1) {
      const pathPart = urlString.substring(0, questionMark);
      const queryPart = urlString.substring(questionMark + 1);
      
      // Extract path from URL-like string
      const path = extractPath(pathPart);
      const params = parseQueryString(queryPart);
      
      return { path, params };
    }

    return {
      path: extractPath(urlString),
      params: [],
    };
  }
}

/**
 * Extract path from a URL string (remove protocol and domain)
 */
function extractPath(urlString: string): string {
  // Remove protocol
  let path = urlString.replace(/^https?:\/\//, "");
  
  // Find the first slash after domain
  const slashIndex = path.indexOf("/");
  if (slashIndex > -1) {
    path = path.substring(slashIndex);
  } else {
    path = "/";
  }

  return path;
}

/**
 * Parse query string into KeyValueRow array
 */
function parseQueryString(queryString: string): KeyValueRow[] {
  const params: KeyValueRow[] = [];
  const pairs = queryString.split("&");

  for (const pair of pairs) {
    const [key, value = ""] = pair.split("=");
    if (key) {
      params.push({
        id: crypto.randomUUID(),
        key: decodeURIComponent(key),
        value: decodeURIComponent(value),
        enabled: true,
      });
    }
  }

  return params;
}
