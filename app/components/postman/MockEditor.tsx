import { HttpMethod } from "./enums/http-method.enum";
import { RequestTab } from "./enums/request-tab.enum";
import type { KeyValueRow } from "./interfaces/key-value-row.interface";
import type { TabOption } from "./types/tab-option.type";
import { METHODS } from "./utils";
import { KeyValueTable } from "./KeyValueTable";

type MockEditorProps = {
  method: HttpMethod;
  pathInput: string;
  matchParams: KeyValueRow[];
  matchHeaders: KeyValueRow[];
  responseStatus: number;
  responseDelay: number;
  responseHeaders: KeyValueRow[];
  requestTab: RequestTab;
  error: string | null;
  isSaving: boolean;
  isTesting: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onPathChange: (path: string) => void;
  onSave: () => void;
  onTest: () => void;
  onTabChange: (tab: RequestTab) => void;
  onMatchParamsChange: (rows: KeyValueRow[]) => void;
  onMatchHeadersChange: (rows: KeyValueRow[]) => void;
  onResponseStatusChange: (status: number) => void;
  onResponseDelayChange: (delay: number) => void;
  onResponseHeadersChange: (rows: KeyValueRow[]) => void;
};

const EDITOR_TABS: TabOption<RequestTab>[] = [
  [RequestTab.Params, "Match Params"],
  [RequestTab.Headers, "Match Headers"],
  [RequestTab.Body, "Response Headers"],
];

const STATUS_CODES = [
  { value: 200, label: "200 OK" },
  { value: 201, label: "201 Created" },
  { value: 204, label: "204 No Content" },
  { value: 400, label: "400 Bad Request" },
  { value: 401, label: "401 Unauthorized" },
  { value: 403, label: "403 Forbidden" },
  { value: 404, label: "404 Not Found" },
  { value: 500, label: "500 Server Error" },
];

export function MockEditor({
  method,
  pathInput,
  matchParams,
  matchHeaders,
  responseStatus,
  responseDelay,
  responseHeaders,
  requestTab,
  error,
  isSaving,
  isTesting,
  onMethodChange,
  onPathChange,
  onSave,
  onTest,
  onTabChange,
  onMatchParamsChange,
  onMatchHeadersChange,
  onResponseStatusChange,
  onResponseDelayChange,
  onResponseHeadersChange,
}: MockEditorProps) {
  return (
    <section className="border-b border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={method}
          onChange={(event) => onMethodChange(event.target.value as HttpMethod)}
          className="h-11 rounded border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 outline-none focus:border-zinc-500"
        >
          {METHODS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="flex h-11 min-w-[320px] flex-1 items-center rounded border border-zinc-300 bg-white">
          <span className="px-3 text-sm text-zinc-500">/api/mock</span>
          <input
            value={pathInput}
            onChange={(event) => onPathChange(event.target.value)}
            placeholder="/users/:id"
            className="h-full flex-1 border-l border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          />
        </div>

        <select
          value={responseStatus}
          onChange={(event) => onResponseStatusChange(Number(event.target.value))}
          className="h-11 rounded border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 outline-none focus:border-zinc-500"
        >
          {STATUS_CODES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        <div className="flex h-11 items-center gap-1.5 rounded border border-zinc-300 bg-white px-3">
          <label className="text-xs text-zinc-500 whitespace-nowrap">Delay</label>
          <input
            type="number"
            min={0}
            max={60000}
            step={100}
            value={responseDelay}
            onChange={(event) => onResponseDelayChange(Math.min(60000, Math.max(0, Number(event.target.value))))}
            className="w-20 text-right text-sm font-medium text-zinc-700 outline-none"
          />
          <span className="text-xs text-zinc-500">ms</span>
        </div>

        <button
          type="button"
          onClick={onTest}
          disabled={isTesting}
          className="h-11 rounded border border-orange-500 bg-white px-4 text-sm font-semibold text-orange-500 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isTesting ? "Probando..." : "Probar"}
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="h-11 rounded bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Guardando..." : "Guardar Mock"}
        </button>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Endpoint completo: <span className="font-mono text-zinc-700">/api/mock{pathInput.startsWith("/") ? pathInput : `/${pathInput}`}</span>
      </p>

      <div className="mt-4 flex gap-2 border-b border-zinc-200">
        {EDITOR_TABS.map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              requestTab === tab
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {requestTab === RequestTab.Params && (
          <KeyValueTable
            title="Query Params a coincidir (opcional)"
            description="El mock solo responderá si la petición tiene exactamente estos parámetros"
            rows={matchParams}
            onChange={onMatchParamsChange}
          />
        )}

        {requestTab === RequestTab.Headers && (
          <KeyValueTable
            title="Headers a coincidir (opcional)"
            description="El mock solo responderá si la petición tiene exactamente estos headers"
            rows={matchHeaders}
            onChange={onMatchHeadersChange}
          />
        )}

        {requestTab === RequestTab.Body && (
          <KeyValueTable
            title="Response Headers"
            description="Headers que se incluirán en la respuesta del mock"
            rows={responseHeaders}
            onChange={onResponseHeadersChange}
          />
        )}
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
