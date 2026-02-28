"use client";

import { useState } from "react";
import type { MockCollection } from "./interfaces/mock-definition.interface";

function Spinner() {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="12"
      height="12"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

type SaveMockModalProps = {
  collections: MockCollection[];
  initialName: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: (collectionId: string, name: string) => void;
  onCreateCollection: (name: string) => void;
  isCreatingCollection: boolean;
};

export function SaveMockModal({
  collections,
  initialName,
  isLoading,
  onCancel,
  onConfirm,
  onCreateCollection,
  isCreatingCollection,
}: SaveMockModalProps) {
  const [mockName, setMockName] = useState(initialName);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    collections.length > 0 ? collections[0].id : null
  );
  
  // If no collection is selected but collections exist, select the first one
  const effectiveSelectedId = selectedCollectionId && collections.some(c => c.id === selectedCollectionId)
    ? selectedCollectionId
    : collections.length > 0 ? collections[0].id : null;

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = () => {
    if (!effectiveSelectedId || !mockName.trim()) return;
    onConfirm(effectiveSelectedId, mockName.trim());
  };

  const handleCreateCollection = () => {
    const trimmed = newCollectionName.trim();
    if (!trimmed) return;
    onCreateCollection(trimmed);
    setNewCollectionName("");
    setIsCreatingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={!isLoading ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-zinc-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Guardar Mock
          </h2>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Mock name */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-600">
              Nombre del Mock
            </label>
            <input
              type="text"
              value={mockName}
              onChange={(e) => setMockName(e.target.value)}
              disabled={isLoading}
              className="h-9 w-full rounded border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 disabled:opacity-50"
              placeholder="Nombre del mock"
            />
          </div>

          {/* Collection picker */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-600">
              Guardar en colección
            </label>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar colección..."
              disabled={isLoading}
              className="h-8 w-full rounded border border-zinc-300 px-3 text-xs outline-none focus:border-zinc-500 disabled:opacity-50"
            />

            <div className="max-h-44 overflow-y-auto rounded border border-zinc-200">
              {filteredCollections.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-zinc-400">
                  {collections.length === 0
                    ? "No hay colecciones. Crea una primero."
                    : "No se encontraron colecciones."}
                </p>
              ) : (
                <ul>
                  {filteredCollections.map((collection, index) => (
                    <li key={collection.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedCollectionId(collection.id)}
                        disabled={isLoading}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-50 ${
                          index > 0 ? "border-t border-zinc-100" : ""
                        } ${
                          effectiveSelectedId === collection.id
                            ? "bg-orange-500 text-white"
                            : "bg-white text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        <span className="text-base leading-none">
                          {effectiveSelectedId === collection.id ? "▸" : " "}
                        </span>
                        <span className="flex-1 truncate font-medium">
                          {collection.name}
                        </span>
                        <span
                          className={`text-xs ${
                            effectiveSelectedId === collection.id
                              ? "text-orange-100"
                              : "text-zinc-400"
                          }`}
                        >
                          {collection.mocks.length} mocks
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Create new collection inline */}
          {isCreatingNew ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCollection();
                  if (e.key === "Escape") setIsCreatingNew(false);
                }}
                placeholder="Nombre de la colección"
                disabled={isCreatingCollection}
                autoFocus
                className="h-8 flex-1 rounded border border-zinc-300 px-2 text-xs outline-none focus:border-zinc-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleCreateCollection}
                disabled={isCreatingCollection || !newCollectionName.trim()}
                className="flex items-center gap-1 rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                {isCreatingCollection && <Spinner />}
                Crear
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                disabled={isCreatingCollection}
                className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              disabled={isLoading}
              className="text-xs font-medium text-orange-500 hover:underline disabled:opacity-50"
            >
              + Crear nueva colección
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !effectiveSelectedId || !mockName.trim()}
            className="flex items-center gap-2 rounded bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isLoading && <Spinner />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
