import type { HttpMethod } from "../enums/http-method.enum";

export interface ProxyRequest {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}
