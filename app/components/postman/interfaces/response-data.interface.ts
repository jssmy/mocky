export interface ResponseData {
  status: number;
  statusText: string;
  durationMs: number;
  sizeBytes: number;
  headers: [string, string][];
  body: string;
}
