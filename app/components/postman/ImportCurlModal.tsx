"use client";

import { useState, useRef } from "react";
import { parseCurl, type ParsedCurl } from "./utils/parse-curl";
import type { MockCollection, MockDefinition } from "./interfaces/mock-definition.interface";

type ImportMode = "curl" | "json";

type ImportModalProps = {
  onCancel: () => void;
  onImportCurl: (parsed: ParsedCurl) => void;
  onImportJson: (collections: MockCollection[]) => void;
};

interface JsonPreview {
  collections: MockCollection[];
  totalMocks: number;
}

// JSON structure types
type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = Record<string, JsonValue>;

interface StorageFormat {
  collections: MockCollection[];
  updatedAt?: number;
}

interface ExportedCollection {
  collection: MockCollection;
  exportedAt: string;
}

interface ExportedMock {
  mock: MockDefinition;
  exportedAt: string;
}

interface CollectionData {
  id?: string;
  name: string;
  mocks: MockDefinition[];
  createdAt?: number;
}

interface MockData {
  method: string;
  path: string;
  name?: string;
  [key: string]: JsonValue;
}

// Helper type guards with proper typing
function isStorageFormat(data: JsonObject): data is StorageFormat {
  return Array.isArray(data.collections);
}

function isCollection(data: JsonObject): data is CollectionData {
  return (
    typeof data.name === "string" &&
    Array.isArray(data.mocks)
  );
}

function isExportedCollection(data: JsonObject): data is ExportedCollection {
  return (
    typeof data.collection === "object" &&
    data.collection !== null &&
    typeof data.exportedAt === "string" &&
    isCollection(data.collection as JsonObject)
  );
}

function isExportedMock(data: JsonObject): data is ExportedMock {
  return (
    typeof data.mock === "object" &&
    data.mock !== null &&
    typeof data.exportedAt === "string" &&
    isMockDefinition(data.mock as JsonObject)
  );
}

function isMockDefinition(data: JsonObject): data is MockData {
  return (
    typeof data.method === "string" &&
    typeof data.path === "string"
  );
}

function extractCollections(data: unknown, timestamp: number): MockCollection[] {
  // Type validation first
  if (typeof data !== "object" || data === null) {
    return [];
  }

  const jsonData = data as JsonObject;

  // Case 1: Full storage format { collections: [...] }
  if (isStorageFormat(jsonData)) {
    return jsonData.collections;
  }

  // Case 2: Single collection { id, name, mocks: [...] }
  if (isCollection(jsonData)) {
    return [jsonData as MockCollection];
  }

  // Case 3: Array of collections
  if (Array.isArray(data) && data.every((item): item is CollectionData => 
    typeof item === "object" && item !== null && isCollection(item as JsonObject)
  )) {
    return data as MockCollection[];
  }

  // Case 4: Exported collection format { collection: {...}, exportedAt: ... }
  if (isExportedCollection(jsonData)) {
    return [jsonData.collection];
  }

  // Case 5: Exported mock format { mock: {...}, exportedAt: ... }
  if (isExportedMock(jsonData)) {
    return [{
      id: crypto.randomUUID(),
      name: "Mocks Importados",
      mocks: [{ ...jsonData.mock, id: crypto.randomUUID() } as MockDefinition],
      createdAt: timestamp,
    }];
  }

  // Case 6: Single mock definition
  if (isMockDefinition(jsonData)) {
    return [{
      id: crypto.randomUUID(),
      name: "Mocks Importados",
      mocks: [{ ...jsonData, id: crypto.randomUUID() } as MockDefinition],
      createdAt: timestamp,
    }];
  }

  // Case 7: Array of mock definitions
  if (Array.isArray(data) && data.every((item): item is MockData => 
    typeof item === "object" && item !== null && isMockDefinition(item as JsonObject)
  )) {
    return [{
      id: crypto.randomUUID(),
      name: "Mocks Importados",
      mocks: data.map(m => ({ ...m, id: crypto.randomUUID() } as MockDefinition)),
      createdAt: timestamp,
    }];
  }

  return [];
}

export function ImportCurlModal({ onCancel, onImportCurl, onImportJson }: ImportModalProps) {
  const [mode, setMode] = useState<ImportMode>("curl");
  const [curlCommand, setCurlCommand] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [curlPreview, setCurlPreview] = useState<ParsedCurl | null>(null);
  const [jsonPreview, setJsonPreview] = useState<JsonPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParseCurl = () => {
    setError(null);
    setCurlPreview(null);

    if (!curlCommand.trim()) {
      setError("Pega un comando cURL");
      return;
    }

    const parsed = parseCurl(curlCommand);
    if (!parsed) {
      setError("No se pudo parsear el comando cURL. Verifica que sea un comando válido.");
      return;
    }

    setCurlPreview(parsed);
  };

  const handleParseJson = () => {
    setError(null);
    setJsonPreview(null);

    if (!jsonContent.trim()) {
      setError("Pega o carga un archivo JSON");
      return;
    }

    try {
      const parsed = JSON.parse(jsonContent);
      const timestamp = Date.now();
      const collections = extractCollections(parsed, timestamp);
      
      if (collections.length === 0) {
        setError("No se encontraron colecciones o mocks válidos en el JSON");
        return;
      }

      const totalMocks = collections.reduce((sum, c) => sum + c.mocks.length, 0);
      setJsonPreview({ collections, totalMocks });
    } catch {
      setError("JSON inválido. Verifica el formato.");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonContent(content);
      setError(null);
      setJsonPreview(null);
    };
    reader.onerror = () => {
      setError("Error al leer el archivo");
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (mode === "curl" && curlPreview) {
      onImportCurl(curlPreview);
    } else if (mode === "json" && jsonPreview) {
      onImportJson(jsonPreview.collections);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#F2F5FA]/90" onClick={onCancel} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-lg border border-[#F0B76A] bg-[#F2F5FA] shadow-xl">
        {/* Header */}
        <div className="border-b border-[#F0B76A] bg-[#F0B76A] px-5 py-4 rounded-t-lg">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#B8792F]">
            Importar
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#F0B76A] px-5 bg-[#F2F5FA]">
          <button
            type="button"
            onClick={() => { setMode('curl'); setError(null); }}
            className={`border-b-2 py-3 text-sm font-medium transition-colors duration-150 ${
              mode === 'curl'
                ? 'border-[#D9963D] text-[#D9963D] bg-[#F2F5FA]'
                : 'border-transparent text-[#B8792F] hover:text-[#D9963D]'
            }`}
          >
            cURL
          </button>
          <button
            type="button"
            onClick={() => { setMode('json'); setError(null); }}
            className={`border-b-2 py-3 text-sm font-medium transition-colors duration-150 ${
              mode === 'json'
                ? 'border-[#D9963D] text-[#D9963D] bg-[#F2F5FA]'
                : 'border-transparent text-[#B8792F] hover:text-[#D9963D]'
            }`}
          >
            JSON
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4 bg-[#F2F5FA]">
          {mode === "curl" ? (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#B8792F]">
                  Pega tu comando cURL
                </label>
                <textarea
                  value={curlCommand}
                  onChange={(e) => {
                    setCurlCommand(e.target.value);
                    setCurlPreview(null);
                    setError(null);
                  }}
                  placeholder={`curl -X POST 'https://api.example.com/users?page=1' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token' \\
  -d '{"name": "John"}'`}
                  className="h-32 w-full resize-none rounded border border-[#F0B76A] bg-[#F2F5FA] px-3 py-2 font-mono text-xs outline-none focus:border-[#D9963D]"
                />
              </div>

              {!curlPreview && (
                <button
                  type="button"
                  onClick={handleParseCurl}
                  className="w-full rounded border border-[#D9963D] bg-[#D9963D] px-4 py-2 text-sm font-medium text-white hover:bg-[#B8792F] transition-colors duration-150"
                >
                  Analizar cURL
                </button>
              )}

              {curlPreview && (
                <div className="space-y-3 rounded border border-[#F0B76A] bg-[#F0B76A]/20 p-4">
                  <p className="text-xs font-semibold uppercase text-[#B8792F]">Vista previa</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-medium text-[#B8792F]">Método</p>
                      <p className="mt-1 font-mono text-[#D9963D]">{curlPreview.method}</p>
                    </div>
                    <div>
                      <p className="font-medium text-[#B8792F]">Path</p>
                      <p className="mt-1 font-mono text-[#D9963D]">{curlPreview.path}</p>
                    </div>
                  </div>

                  {curlPreview.params.length > 0 && (
                    <div className="text-xs">
                      <p className="font-medium text-[#B8792F]">Query Params ({curlPreview.params.length})</p>
                      <div className="mt-1 space-y-0.5">
                        {curlPreview.params.map((param) => (
                          <p key={param.id} className="font-mono text-[#D9963D]">
                            <span className="text-[#B8792F]">{param.key}:</span> {param.value}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {curlPreview.headers.length > 0 && (
                    <div className="text-xs">
                      <p className="font-medium text-[#B8792F]">Headers ({curlPreview.headers.length})</p>
                      <div className="mt-1 space-y-0.5">
                        {curlPreview.headers.map((header) => (
                          <p key={header.id} className="font-mono text-[#D9963D]">
                            <span className="text-[#B8792F]">{header.key}:</span> {header.value}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {curlPreview.body && (
                    <div className="text-xs">
                      <p className="font-medium text-[#B8792F]">Body</p>
                      <pre className="mt-1 max-h-24 overflow-auto rounded bg-[#F2F5FA] p-2 font-mono text-[#D9963D]">
                        {curlPreview.body}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#B8792F]">
                  Pega JSON o carga un archivo
                </label>
                
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded border border-[#D9963D] bg-[#D9963D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#B8792F] transition-colors duration-150"
                  >
                    Seleccionar archivo
                  </button>
                </div>

                <textarea
                  value={jsonContent}
                  onChange={(e) => {
                    setJsonContent(e.target.value);
                    setJsonPreview(null);
                    setError(null);
                  }}
                  placeholder={`{
  "collections": [
    {
      "name": "Mi Colección",
      "mocks": [...]
    }
  ]
}`}
                  className="h-40 w-full resize-none rounded border border-[#F0B76A] bg-[#F2F5FA] px-3 py-2 font-mono text-xs outline-none focus:border-[#D9963D]"
                />
              </div>

              {!jsonPreview && (
                <button
                  type="button"
                  onClick={handleParseJson}
                  className="w-full rounded border border-[#D9963D] bg-[#D9963D] px-4 py-2 text-sm font-medium text-white hover:bg-[#B8792F] transition-colors duration-150"
                >
                  Analizar JSON
                </button>
              )}

              {jsonPreview && (
                <div className="space-y-3 rounded border border-[#D9963D] bg-[#F0B76A]/20 p-4">
                  <p className="text-xs font-semibold uppercase text-[#D9963D]">Listo para importar</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-medium text-[#B8792F]">Colecciones</p>
                      <p className="mt-1 text-lg font-bold text-[#D9963D]">{jsonPreview.collections.length}</p>
                    </div>
                    <div>
                      <p className="font-medium text-[#B8792F]">Mocks totales</p>
                      <p className="mt-1 text-lg font-bold text-[#D9963D]">{jsonPreview.totalMocks}</p>
                    </div>
                  </div>

                  <div className="text-xs">
                    <p className="font-medium text-[#B8792F]">Colecciones a importar:</p>
                    <ul className="mt-1 space-y-0.5">
                      {jsonPreview.collections.map((col) => (
                        <li key={col.id} className="font-mono text-[#D9963D]">
                          • {col.name} ({col.mocks.length} mocks)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[#F0B76A] bg-[#F2F5FA] px-5 py-3 rounded-b-lg">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-[#D9963D] px-4 py-1.5 text-sm font-medium text-[#D9963D] bg-white hover:bg-[#F0B76A]/40 transition-colors duration-150"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={(mode === 'curl' && !curlPreview) || (mode === 'json' && !jsonPreview)}
            className="rounded bg-[#D9963D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#B8792F] disabled:opacity-50 transition-colors duration-150"
          >
            Importar
          </button>
        </div>
      </div>
    </div>
  );
}
