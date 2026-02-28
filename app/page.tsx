"use client";

import { useCallback, useEffect, useState } from "react";
import { MockEditor } from "./components/postman/MockEditor";
import { SaveMockModal } from "./components/postman/SaveMockModal";
import { Sidebar } from "./components/postman/Sidebar";
import { HttpMethod } from "./components/postman/enums/http-method.enum";
import { RequestTab } from "./components/postman/enums/request-tab.enum";
import type { KeyValueRow } from "./components/postman/interfaces/key-value-row.interface";
import type { MockCollection, MockDefinition } from "./components/postman/interfaces/mock-definition.interface";
import {
  cloneRows,
  makeRow,
  upsertTrailingEmptyRow,
} from "./components/postman/utils";

export default function Home() {
  const [method, setMethod] = useState<HttpMethod>(HttpMethod.GET);
  const [pathInput, setPathInput] = useState("");
  const [matchParams, setMatchParams] = useState<KeyValueRow[]>([makeRow()]);
  const [matchHeaders, setMatchHeaders] = useState<KeyValueRow[]>([makeRow()]);
  const [responseBody, setResponseBody] = useState("");
  const [responseStatus, setResponseStatus] = useState(200);
  const [responseDelay, setResponseDelay] = useState(0);
  const [responseHeaders, setResponseHeaders] = useState<KeyValueRow[]>([makeRow()]);
  const [requestTab, setRequestTab] = useState<RequestTab>(RequestTab.Params);
  const [collections, setCollections] = useState<MockCollection[]>([]);
  const [selectedMockId, setSelectedMockId] = useState<string | null>(null);
  const [selectedMockTitle, setSelectedMockTitle] = useState("Nuevo Mock");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: number;
    body: string;
    headers: [string, string][];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Track loading state for sidebar actions: "create-collection", "rename-collection:id", "delete-collection:id", etc.
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Load collections from server
  const loadCollections = useCallback(async () => {
    try {
      const response = await fetch("/api/mocks");
      if (!response.ok) {
        throw new Error("Error loading mocks");
      }
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading mocks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Save collections to server
  const saveCollections = useCallback(async (newCollections: MockCollection[]) => {
    try {
      const response = await fetch("/api/mocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collections: newCollections }),
      });
      
      if (!response.ok) {
        throw new Error("Error saving mocks");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving mocks");
    }
  }, []);

  const restoreMock = (mock: MockDefinition) => {
    setMethod(mock.method);
    setPathInput(mock.path);
    setMatchParams(upsertTrailingEmptyRow(cloneRows(mock.matchParams)));
    setMatchHeaders(upsertTrailingEmptyRow(cloneRows(mock.matchHeaders)));
    setResponseBody(mock.responseBody);
    setResponseStatus(mock.responseStatus || 200);
    setResponseDelay(mock.responseDelay ?? 0);
    setResponseHeaders(upsertTrailingEmptyRow(cloneRows(mock.responseHeaders)));
    setSelectedMockId(mock.id);
    setSelectedMockTitle(mock.name || mock.path || "Mock sin nombre");
    setTestResult(null);
    setError(null);
  };

  const createSnapshot = (collectionId?: string): MockDefinition => ({
    id: crypto.randomUUID(),
    name: `${method} ${pathInput || "/nuevo-endpoint"}`,
    collectionId,
    method,
    path: pathInput.startsWith("/") ? pathInput : `/${pathInput}`,
    matchParams: cloneRows(matchParams.filter((r) => r.key.trim())),
    matchHeaders: cloneRows(matchHeaders.filter((r) => r.key.trim())),
    responseBody,
    responseStatus,
    responseDelay,
    responseHeaders: cloneRows(responseHeaders.filter((r) => r.key.trim())),
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const clearForm = () => {
    setMethod(HttpMethod.GET);
    setPathInput("");
    setMatchParams([makeRow()]);
    setMatchHeaders([makeRow()]);
    setResponseBody("");
    setResponseStatus(200);
    setResponseDelay(0);
    setResponseHeaders([makeRow()]);
    setSelectedMockId(null);
    setSelectedMockTitle("Nuevo Mock");
    setTestResult(null);
    setError(null);
  };

  const createCollection = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoadingAction("create-collection");
    try {
      const newCollection: MockCollection = {
        id: crypto.randomUUID(),
        name: trimmed,
        mocks: [],
        createdAt: Date.now(),
      };

      const newCollections = [newCollection, ...collections];
      setCollections(newCollections);
      await saveCollections(newCollections);
    } finally {
      setLoadingAction(null);
    }
  };

  const saveMock = async () => {
    if (!pathInput.trim()) {
      setError("El path del endpoint es requerido");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let newCollections: MockCollection[];

      if (selectedMockId) {
        // Update existing mock
        newCollections = collections.map((collection) => ({
          ...collection,
          mocks: collection.mocks.map((mock) =>
            mock.id === selectedMockId
              ? {
                  ...createSnapshot(mock.collectionId),
                  id: mock.id,
                  createdAt: mock.createdAt,
                }
              : mock
          ),
        }));
      } else {
        // New mock — open collection picker modal
        setIsSaving(false);
        setIsSaveModalOpen(true);
        return;
      }

      setCollections(newCollections);
      await saveCollections(newCollections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModalConfirm = async (collectionId: string, name: string) => {
    setIsSaving(true);
    setError(null);
    try {
      let newCollections: MockCollection[];

      if (collections.length === 0 || !collections.find((c) => c.id === collectionId)) {
        // Fallback: create a default collection if not found
        const snapshot = createSnapshot();
        const defaultCollection: MockCollection = {
          id: crypto.randomUUID(),
          name: "Mocks",
          mocks: [{ ...snapshot, name }],
          createdAt: Date.now(),
        };
        newCollections = [defaultCollection, ...collections];
        setSelectedMockId(defaultCollection.mocks[0].id);
        setSelectedMockTitle(name);
      } else {
        const snapshot = createSnapshot(collectionId);
        const namedSnapshot = { ...snapshot, name };
        newCollections = collections.map((collection) =>
          collection.id === collectionId
            ? { ...collection, mocks: [namedSnapshot, ...collection.mocks] }
            : collection
        );
        setSelectedMockId(namedSnapshot.id);
        setSelectedMockTitle(name);
      }

      setCollections(newCollections);
      await saveCollections(newCollections);
      setIsSaveModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const renameCollection = async (collectionId: string, nextName: string) => {
    const trimmed = nextName.trim();
    if (!trimmed) return;

    setLoadingAction(`rename-collection:${collectionId}`);
    try {
      const newCollections = collections.map((collection) =>
        collection.id === collectionId ? { ...collection, name: trimmed } : collection
      );

      setCollections(newCollections);
      await saveCollections(newCollections);
    } finally {
      setLoadingAction(null);
    }
  };

  const deleteCollection = async (collectionId: string) => {
    setLoadingAction(`delete-collection:${collectionId}`);
    try {
      const target = collections.find((c) => c.id === collectionId);
      if (target && selectedMockId && target.mocks.some((m) => m.id === selectedMockId)) {
        clearForm();
      }

      const newCollections = collections.filter((c) => c.id !== collectionId);
      setCollections(newCollections);
      await saveCollections(newCollections);
    } finally {
      setLoadingAction(null);
    }
  };

  const renameMockInCollection = async (
    collectionId: string,
    mockId: string,
    nextName: string
  ) => {
    const trimmed = nextName.trim();
    if (!trimmed) return;

    setLoadingAction(`rename-mock:${mockId}`);
    try {
      const newCollections = collections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              mocks: collection.mocks.map((mock) =>
                mock.id === mockId ? { ...mock, name: trimmed, updatedAt: Date.now() } : mock
              ),
            }
          : collection
      );

      setCollections(newCollections);
      if (selectedMockId === mockId) {
        setSelectedMockTitle(trimmed);
      }
      await saveCollections(newCollections);
    } finally {
      setLoadingAction(null);
    }
  };

  const duplicateMockInCollection = async (collectionId: string, mockId: string) => {
    setLoadingAction(`duplicate-mock:${mockId}`);
    try {
      const newCollections = collections.map((collection) => {
        if (collection.id !== collectionId) return collection;

        const target = collection.mocks.find((m) => m.id === mockId);
        if (!target) return collection;

        const duplicate: MockDefinition = {
          ...target,
          id: crypto.randomUUID(),
          name: `${target.name} (copia)`,
          matchParams: cloneRows(target.matchParams),
          matchHeaders: cloneRows(target.matchHeaders),
          responseHeaders: cloneRows(target.responseHeaders),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        return { ...collection, mocks: [duplicate, ...collection.mocks] };
      });

      setCollections(newCollections);
      await saveCollections(newCollections);
    } finally {
      setLoadingAction(null);
    }
  };

  const deleteMockInCollection = async (collectionId: string, mockId: string) => {
    setLoadingAction(`delete-mock:${mockId}`);
    try {
      const newCollections = collections.map((collection) =>
        collection.id === collectionId
          ? { ...collection, mocks: collection.mocks.filter((m) => m.id !== mockId) }
          : collection
      );

      if (selectedMockId === mockId) {
        clearForm();
      }

      setCollections(newCollections);
      await saveCollections(newCollections);
    } finally {
      setLoadingAction(null);
    }
  };

  const toggleMockEnabled = async (collectionId: string, mockId: string) => {
    setLoadingAction(`toggle-mock:${mockId}`);
    try {
      const newCollections = collections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              mocks: collection.mocks.map((mock) =>
                mock.id === mockId
                  ? { ...mock, enabled: !mock.enabled, updatedAt: Date.now() }
                  : mock
              ),
            }
          : collection
      );

      setCollections(newCollections);
      await saveCollections(newCollections);
    } finally {
      setLoadingAction(null);
    }
  };

  const testMock = async () => {
    if (!pathInput.trim()) {
      setError("El path del endpoint es requerido para probar");
      return;
    }

    setIsTesting(true);
    setError(null);
    setTestResult(null);

    try {
      // Build query string from matchParams
      const params = new URLSearchParams();
      for (const row of matchParams) {
        if (row.enabled && row.key.trim()) {
          params.append(row.key, row.value);
        }
      }

      const queryString = params.toString();
      const path = pathInput.startsWith("/") ? pathInput : `/${pathInput}`;
      const testUrl = `/api/mock${path}${queryString ? `?${queryString}` : ""}`;

      // Build headers
      const headers: Record<string, string> = {};
      for (const row of matchHeaders) {
        if (row.enabled && row.key.trim()) {
          headers[row.key] = row.value;
        }
      }

      const response = await fetch(testUrl, {
        method,
        headers,
      });

      const body = await response.text();
      const responseHeadersArray: [string, string][] = [];
      response.headers.forEach((value, key) => {
        responseHeadersArray.push([key, value]);
      });

      setTestResult({
        status: response.status,
        body,
        headers: responseHeadersArray,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al probar el mock");
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-100">
        <p className="text-sm text-zinc-500">Cargando mocks...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-zinc-100 text-zinc-900">
      <Sidebar
        collections={collections}
        selectedMockId={selectedMockId}
        loadingAction={loadingAction}
        onRestoreMock={restoreMock}
        onCreateCollection={createCollection}
        onRenameCollection={renameCollection}
        onDeleteCollection={deleteCollection}
        onRenameMockInCollection={renameMockInCollection}
        onDuplicateMockInCollection={duplicateMockInCollection}
        onDeleteMockInCollection={deleteMockInCollection}
        onToggleMockEnabled={toggleMockEnabled}
        onNewMock={clearForm}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
          <p className="text-sm font-semibold">{selectedMockTitle}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearForm}
              className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Nuevo
            </button>
          </div>
        </header>

        <MockEditor
          method={method}
          pathInput={pathInput}
          matchParams={matchParams}
          matchHeaders={matchHeaders}
          responseStatus={responseStatus}
          responseDelay={responseDelay}
          responseHeaders={responseHeaders}
          requestTab={requestTab}
          error={error}
          isSaving={isSaving}
          isTesting={isTesting}
          onMethodChange={setMethod}
          onPathChange={setPathInput}
          onSave={saveMock}
          onTest={testMock}
          onTabChange={setRequestTab}
          onMatchParamsChange={setMatchParams}
          onMatchHeadersChange={setMatchHeaders}
          onResponseStatusChange={setResponseStatus}
          onResponseDelayChange={setResponseDelay}
          onResponseHeadersChange={setResponseHeaders}
        />

        <section className="min-h-0 flex-1 border-t border-zinc-200 bg-white p-4">
          <div className="flex h-full flex-col rounded border border-zinc-200 bg-zinc-50">
            <div className="border-b border-zinc-200 px-3 py-2">
              <p className="text-sm font-medium text-zinc-700">Response Body (lo que devolverá el mock)</p>
            </div>
            <textarea
              value={responseBody}
              onChange={(event) => setResponseBody(event.target.value)}
              placeholder='{"message": "Hello from mock!", "data": []}'
              className="flex-1 resize-none bg-white px-3 py-2 font-mono text-sm outline-none"
            />
          </div>
        </section>

        {testResult && (
          <section className="border-t border-zinc-200 bg-white p-4">
            <div className="rounded border border-zinc-200 bg-zinc-50">
              <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                <p className="text-sm font-medium text-zinc-700">Resultado del Test</p>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    testResult.status >= 200 && testResult.status < 300
                      ? "bg-green-100 text-green-800"
                      : testResult.status >= 400
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {testResult.status}
                </span>
              </div>
              <div className="max-h-48 overflow-auto p-3">
                <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-700">
                  {testResult.body}
                </pre>
              </div>
            </div>
          </section>
        )}
      </main>

      {isSaveModalOpen && (
        <SaveMockModal
          collections={collections}
          initialName={`${method} ${pathInput || "/nuevo-endpoint"}`}
          isLoading={isSaving}
          isCreatingCollection={loadingAction === "create-collection"}
          onCancel={() => setIsSaveModalOpen(false)}
          onConfirm={handleSaveModalConfirm}
          onCreateCollection={createCollection}
        />
      )}
    </div>
  );
}
