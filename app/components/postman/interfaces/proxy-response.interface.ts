export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
  body: string;
  durationMs: number;
  sizeBytes: number;
}
