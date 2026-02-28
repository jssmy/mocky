import { HttpMethod } from "./enums/http-method.enum";
import type { KeyValueRow } from "./interfaces/key-value-row.interface";

export const METHODS: HttpMethod[] = [
  HttpMethod.GET,
  HttpMethod.POST,
  HttpMethod.PUT,
  HttpMethod.PATCH,
  HttpMethod.DELETE,
  HttpMethod.HEAD,
  HttpMethod.OPTIONS,
];

export const STORAGE_HISTORY_KEY = "mocky_history_v1";
export const STORAGE_COLLECTIONS_KEY = "mocky_collections_v1";

export function makeRow(): KeyValueRow {
  return {
    id: crypto.randomUUID(),
    key: "",
    value: "",
    enabled: true,
  };
}

export function buildQueryParams(rows: KeyValueRow[]) {
  const params = new URLSearchParams();

  for (const row of rows) {
    const key = row.key.trim();
    if (!row.enabled || !key) {
      continue;
    }

    params.append(key, row.value);
  }

  return params;
}

export function buildHeaders(rows: KeyValueRow[]) {
  const headers = new Headers();

  for (const row of rows) {
    const key = row.key.trim();
    if (!row.enabled || !key) {
      continue;
    }

    headers.set(key, row.value);
  }

  return headers;
}

export function upsertTrailingEmptyRow(rows: KeyValueRow[]) {
  const hasEmptyRow = rows.some((row) => !row.key && !row.value);
  if (hasEmptyRow) {
    return rows;
  }

  return [...rows, makeRow()];
}

export function cloneRows(rows: KeyValueRow[]) {
  return rows.map((row) => ({ ...row }));
}
