import type { HttpMethod } from "../enums/http-method.enum";
import type { KeyValueRow } from "./key-value-row.interface";

export interface MockDefinition {
  id: string;
  name: string;
  collectionId?: string;
  /** HTTP method to match (GET, POST, etc.) */
  method: HttpMethod;
  /** Endpoint path (e.g., /api/users, /products/:id) */
  path: string;
  /** Optional query params to match exactly */
  matchParams: KeyValueRow[];
  /** Optional headers to match */
  matchHeaders: KeyValueRow[];
  /** Response body to return when mock is matched */
  responseBody: string;
  /** HTTP status code to return (default: 200) */
  responseStatus: number;
  /** Response headers to include */
  responseHeaders: KeyValueRow[];
  /** Artificial delay in milliseconds before responding */
  responseDelay: number;
  /** Whether this mock is active */
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MockCollection {
  id: string;
  name: string;
  mocks: MockDefinition[];
  createdAt: number;
}
