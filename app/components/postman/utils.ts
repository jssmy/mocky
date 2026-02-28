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

export function makeRow(): KeyValueRow {
  return {
    id: crypto.randomUUID(),
    key: "",
    value: "",
    enabled: true,
  };
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
