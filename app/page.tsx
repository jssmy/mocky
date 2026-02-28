"use client";

import { useEffect, useMemo, useState } from "react";
import { RequestEditor } from "./components/postman/RequestEditor";
import { Sidebar } from "./components/postman/Sidebar";
import { HttpMethod } from "./components/postman/enums/http-method.enum";
import { RequestTab } from "./components/postman/enums/request-tab.enum";
import type { Collection } from "./components/postman/interfaces/collection.interface";
import type { KeyValueRow } from "./components/postman/interfaces/key-value-row.interface";
import type { ProxyRequest } from "./components/postman/interfaces/proxy-request.interface";
import type { ProxyResponse } from "./components/postman/interfaces/proxy-response.interface";
import type { SavedRequest } from "./components/postman/interfaces/saved-request.interface";
import {
  STORAGE_COLLECTIONS_KEY,
  buildHeaders,
  buildQueryParams,
  cloneRows,
  makeRow,
  upsertTrailingEmptyRow,
} from "./components/postman/utils";

export default function Home() {
  const [method, setMethod] = useState<HttpMethod>(HttpMethod.GET);
  const [urlInput, setUrlInput] = useState("");
  const [params, setParams] = useState<KeyValueRow[]>([makeRow()]);
  const [headersRows, setHeadersRows] = useState<KeyValueRow[]>([makeRow()]);
  const [body, setBody] = useState("");
  const [requestTab, setRequestTab] = useState<RequestTab>(RequestTab.Params);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequestTitle, setSelectedRequestTitle] = useState("Untitled Request");

  useEffect(() => {
    const rawCollections = localStorage.getItem(STORAGE_COLLECTIONS_KEY);

    if (rawCollections) {
      try {
        const parsed = JSON.parse(rawCollections) as unknown;

        if (Array.isArray(parsed)) {
          const hasNestedRequests = parsed.some(
            (item) => typeof item === "object" && item !== null && "requests" in item,
          );

          if (hasNestedRequests) {
            setCollections(parsed as Collection[]);
          } else {
            const migratedRequests = parsed as SavedRequest[];

            if (migratedRequests.length > 0) {
              setCollections([
                {
                  id: crypto.randomUUID(),
                  name: "Colección importada",
                  requests: migratedRequests,
                  createdAt: Date.now(),
                },
              ]);
            } else {
              setCollections([]);
            }
          }
        }
      } catch {
        setCollections([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_COLLECTIONS_KEY, JSON.stringify(collections));
  }, [collections]);

  const resolvedUrl = useMemo(() => {
    const trimmed = urlInput.trim();

    if (!trimmed) {
      return "";
    }

    try {
      const target = new URL(trimmed);
      const query = buildQueryParams(params);
      for (const [key, value] of query.entries()) {
        target.searchParams.append(key, value);
      }
      return target.toString();
    } catch {
      return trimmed;
    }
  }, [urlInput, params]);

  const restoreRequest = (saved: SavedRequest) => {
    setMethod(saved.method);
    setUrlInput(saved.url);
    setParams(upsertTrailingEmptyRow(cloneRows(saved.params)));
    setHeadersRows(upsertTrailingEmptyRow(cloneRows(saved.headers)));
    setBody(saved.body);
    setSelectedRequestId(saved.id);
    setSelectedRequestTitle(saved.name || saved.url || "Untitled Request");
  };

  const createSnapshot = (collectionId?: string): SavedRequest => ({
    id: crypto.randomUUID(),
    name: `${method} ${urlInput || "Nueva request"}`,
    collectionId,
    method,
    url: urlInput,
    params: cloneRows(params),
    headers: cloneRows(headersRows),
    body,
    createdAt: Date.now(),
  });

  const createCollection = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const newCollection: Collection = {
      id: crypto.randomUUID(),
      name: trimmed,
      requests: [],
      createdAt: Date.now(),
    };

    setCollections((current) => [newCollection, ...current]);
  };

  const addCurrentRequestToCollection = (collectionId: string) => {
    const snapshot = createSnapshot(collectionId);

    setCollections((current) =>
      current.map((collection) => {
        if (collection.id !== collectionId) {
          return collection;
        }

        return {
          ...collection,
          requests: [snapshot, ...collection.requests],
        };
      }),
    );
  };

  const renameCollection = (collectionId: string, nextName: string) => {
    const trimmed = nextName.trim();
    if (!trimmed) {
      return;
    }

    setCollections((current) =>
      current.map((collection) => {
        if (collection.id !== collectionId) {
          return collection;
        }

        return {
          ...collection,
          name: trimmed,
        };
      }),
    );
  };

  const deleteCollection = (collectionId: string) => {
    setCollections((current) => {
      const target = current.find((collection) => collection.id === collectionId);
      if (target && selectedRequestId && target.requests.some((request) => request.id === selectedRequestId)) {
        setSelectedRequestId(null);
        setSelectedRequestTitle("Untitled Request");
      }

      return current.filter((collection) => collection.id !== collectionId);
    });
  };

  const renameRequestInCollection = (
    collectionId: string,
    requestId: string,
    nextName: string,
  ) => {
    const trimmed = nextName.trim();
    if (!trimmed) {
      return;
    }

    setCollections((current) =>
      current.map((collection) => {
        if (collection.id !== collectionId) {
          return collection;
        }

        return {
          ...collection,
          requests: collection.requests.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  name: trimmed,
                }
              : request,
          ),
        };
      }),
    );

    if (selectedRequestId === requestId) {
      setSelectedRequestTitle(trimmed);
    }
  };

  const duplicateRequestInCollection = (collectionId: string, requestId: string) => {
    setCollections((current) =>
      current.map((collection) => {
        if (collection.id !== collectionId) {
          return collection;
        }

        const target = collection.requests.find((request) => request.id === requestId);
        if (!target) {
          return collection;
        }

        const duplicate: SavedRequest = {
          ...target,
          id: crypto.randomUUID(),
          name: `${target.name} (copia)`,
          params: cloneRows(target.params),
          headers: cloneRows(target.headers),
          createdAt: Date.now(),
        };

        return {
          ...collection,
          requests: [duplicate, ...collection.requests],
        };
      }),
    );
  };

  const deleteRequestInCollection = (collectionId: string, requestId: string) => {
    setCollections((current) =>
      current.map((collection) => {
        if (collection.id !== collectionId) {
          return collection;
        }

        return {
          ...collection,
          requests: collection.requests.filter((request) => request.id !== requestId),
        };
      }),
    );

    if (selectedRequestId === requestId) {
      setSelectedRequestId(null);
      setSelectedRequestTitle("Untitled Request");
    }
  };

  const sendRequest = async () => {
    setRequestError(null);

    if (!urlInput.trim()) {
      setRequestError("Ingresa una URL válida para enviar la solicitud.");
      return;
    }

    const targetUrl = resolvedUrl;
    setLoading(true);

    try {
      const requestHeaders = buildHeaders(headersRows);
      let payload: string | undefined;

      if (![HttpMethod.GET, HttpMethod.HEAD].includes(method) && body.trim()) {
        payload = body;

        if (!requestHeaders.has("content-type")) {
          requestHeaders.set("content-type", "application/json");
        }
      }

      const proxyPayload: ProxyRequest = {
        method,
        url: targetUrl,
        headers: Object.fromEntries(requestHeaders.entries()),
        body: payload,
      };

      const proxyResponse = await fetch("/api/proxy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(proxyPayload),
      });

      const result = (await proxyResponse.json()) as
        | ProxyResponse
        | {
            error: string;
          };

      if (!proxyResponse.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Error del proxy");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setRequestError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-100 text-zinc-900">
      <Sidebar
        collections={collections}
        selectedRequestId={selectedRequestId}
        onRestoreRequest={restoreRequest}
        onCreateCollection={createCollection}
        onAddCurrentRequestToCollection={addCurrentRequestToCollection}
        onRenameCollection={renameCollection}
        onDeleteCollection={deleteCollection}
        onRenameRequestInCollection={renameRequestInCollection}
        onDuplicateRequestInCollection={duplicateRequestInCollection}
        onDeleteRequestInCollection={deleteRequestInCollection}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-200 bg-white px-4 py-3">
          <p className="text-sm font-semibold">{selectedRequestTitle}</p>
        </header>

        <RequestEditor
          method={method}
          urlInput={urlInput}
          resolvedUrl={resolvedUrl}
          params={params}
          headersRows={headersRows}
          requestTab={requestTab}
          requestError={requestError}
          loading={loading}
          onMethodChange={setMethod}
          onUrlChange={setUrlInput}
          onSend={sendRequest}
          onTabChange={setRequestTab}
          onParamsChange={setParams}
          onHeadersChange={setHeadersRows}
        />

        <section className="min-h-0 flex-1 border-t border-zinc-200 bg-white p-4">
          <div className="h-full rounded border border-zinc-200 bg-zinc-50 p-3">
            <p className="mb-3 text-sm font-medium text-zinc-700">Body (raw)</p>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder='{"hello":"world"}'
              className="h-[calc(100%-2rem)] w-full resize-none rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
