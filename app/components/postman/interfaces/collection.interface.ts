import type { SavedRequest } from "./saved-request.interface";

export interface Collection {
  id: string;
  name: string;
  requests: SavedRequest[];
  createdAt: number;
}
