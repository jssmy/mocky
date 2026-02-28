import { HttpMethod } from "./enums/http-method.enum";
import { RequestTab } from "./enums/request-tab.enum";
import type { KeyValueRow } from "./interfaces/key-value-row.interface";
import type { TabOption } from "./types/tab-option.type";
import { METHODS } from "./utils";
import { KeyValueTable } from "./KeyValueTable";

type RequestEditorProps = {
  method: HttpMethod;
  urlInput: string;
  resolvedUrl: string;
  params: KeyValueRow[];
  headersRows: KeyValueRow[];
  requestTab: RequestTab;
  requestError: string | null;
  loading: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  onTabChange: (tab: RequestTab) => void;
  onParamsChange: (rows: KeyValueRow[]) => void;
  onHeadersChange: (rows: KeyValueRow[]) => void;
};

const REQUEST_TABS: TabOption<RequestTab>[] = [
  [RequestTab.Params, "Params"],
  [RequestTab.Headers, "Headers"],
];

export function RequestEditor({
  method,
  urlInput,
  resolvedUrl,
  params,
  headersRows,
  requestTab,
  requestError,
  loading,
  onMethodChange,
  onUrlChange,
  onSend,
  onTabChange,
  onParamsChange,
  onHeadersChange,
}: RequestEditorProps) {
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

        <input
          value={urlInput}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://api.example.com/resource"
          className="h-11 min-w-[320px] flex-1 rounded border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={loading}
          className="h-11 rounded bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>

      <p className="mt-2 truncate text-xs text-zinc-500">URL final: {resolvedUrl || "-"}</p>

      <div className="mt-4 flex gap-2 border-b border-zinc-200">
        {REQUEST_TABS.map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              requestTab === tab
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {requestTab === RequestTab.Params && (
          <KeyValueTable title="Query Params" rows={params} onChange={onParamsChange} />
        )}

        {requestTab === RequestTab.Headers && (
          <KeyValueTable title="Headers" rows={headersRows} onChange={onHeadersChange} />
        )}
      </div>

      {requestError && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {requestError}
        </p>
      )}
    </section>
  );
}
