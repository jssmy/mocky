import type { HttpMethod } from "../enums/http-method.enum";
import type { KeyValueRow } from "./key-value-row.interface";

export interface SavedRequest {
  id: string;
  name: string;
  collectionId?: string;
  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  body: string;
  createdAt: number;
}
