import { ResponseTab } from "./enums/response-tab.enum";
import type { ResponseData } from "./interfaces/response-data.interface";
import type { TabOption } from "./types/tab-option.type";

type ResponseViewerProps = {
  responseTab: ResponseTab;
  response: ResponseData | null;
  loading: boolean;
  responsePreview: string;
  onTabChange: (tab: ResponseTab) => void;
};

const RESPONSE_TABS: TabOption<ResponseTab>[] = [
  [ResponseTab.Body, "Body"],
  [ResponseTab.Headers, "Headers"],
];

export function ResponseViewer({
  responseTab,
  response,
  loading,
  responsePreview,
  onTabChange,
}: ResponseViewerProps) {
  return (
    <section className="min-h-0 flex-1 bg-white p-4">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          {RESPONSE_TABS.map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                responseTab === tab
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {response && (
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span>
              Status: <strong>{response.status}</strong> {response.statusText}
            </span>
            <span>Time: {response.durationMs}ms</span>
            <span>Size: {response.sizeBytes} B</span>
          </div>
        )}
      </div>

      <div className="mt-4 h-[calc(100%-3rem)] overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3">
        {!response && !loading && (
          <p className="text-sm text-zinc-500">Envía una request para ver la respuesta.</p>
        )}

        {loading && <p className="text-sm text-zinc-500">Enviando solicitud...</p>}

        {response && responseTab === ResponseTab.Body && (
          <pre className="whitespace-pre-wrap break-words text-sm text-zinc-800">{responsePreview}</pre>
        )}

        {response && responseTab === ResponseTab.Headers && (
          <div className="space-y-2 text-sm text-zinc-700">
            {response.headers.map(([key, value]) => (
              <div
                key={`${key}-${value}`}
                className="grid grid-cols-[220px_1fr] gap-3 border-b border-zinc-200 pb-2"
              >
                <span className="font-medium">{key}</span>
                <span className="break-all">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
