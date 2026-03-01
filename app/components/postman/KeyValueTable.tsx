import type { KeyValueRow } from "./interfaces/key-value-row.interface";
import { makeRow, upsertTrailingEmptyRow } from "./utils";

type KeyValueTableProps = {
  title: string;
  description?: string;
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
};

export function KeyValueTable({ title, description, rows, onChange }: KeyValueTableProps) {
  const updateRow = (id: string, patch: Partial<KeyValueRow>) => {
    const nextRows = rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
    onChange(upsertTrailingEmptyRow(nextRows));
  };

  const removeRow = (id: string) => {
    const filtered = rows.filter((row) => row.id !== id);
    onChange(upsertTrailingEmptyRow(filtered.length > 0 ? filtered : [makeRow()]));
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-zinc-700">{title}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        <div className="grid grid-cols-[84px_1fr_1fr_70px] border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <span>Activo</span>
          <span>Key</span>
          <span>Value</span>
          <span className="text-right">Acción</span>
        </div>

        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[84px_1fr_1fr_70px] items-center gap-2 border-b border-zinc-100 px-3 py-2 last:border-b-0"
          >
            <label className="inline-flex items-center gap-2 text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(event) => updateRow(row.id, { enabled: event.target.checked })}
                className="h-4 w-4 rounded border-zinc-300 accent-orange-500"
              />
              On
            </label>
            <input
              value={row.key}
              onChange={(event) => updateRow(row.id, { key: event.target.value })}
              placeholder="header-name"
              className="h-9 rounded border border-zinc-200 px-2 text-sm outline-none ring-0 focus:border-zinc-400"
            />
            <input
              value={row.value}
              onChange={(event) => updateRow(row.id, { value: event.target.value })}
              placeholder="value"
              className="h-9 rounded border border-zinc-200 px-2 text-sm outline-none ring-0 focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="rounded border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Borrar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
