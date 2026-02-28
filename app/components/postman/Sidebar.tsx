import { useState } from "react";
import { RenameModal } from "./RenameModal";
import type { Collection } from "./interfaces/collection.interface";
import type { SavedRequest } from "./interfaces/saved-request.interface";

type SidebarProps = {
  collections: Collection[];
  selectedRequestId: string | null;
  onRestoreRequest: (request: SavedRequest) => void;
  onCreateCollection: (name: string) => void;
  onAddCurrentRequestToCollection: (collectionId: string) => void;
  onRenameCollection: (collectionId: string, nextName: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onRenameRequestInCollection: (collectionId: string, requestId: string, nextName: string) => void;
  onDuplicateRequestInCollection: (collectionId: string, requestId: string) => void;
  onDeleteRequestInCollection: (collectionId: string, requestId: string) => void;
};

function CollectionItem({
  collection,
  onRestoreRequest,
  onAddCurrentRequestToCollection,
  onOpenRenameModal,
  onDeleteCollection,
  onOpenRenameRequestModal,
  onDuplicateRequestInCollection,
  onDeleteRequestInCollection,
  selectedRequestId,
}: {
  collection: Collection;
  onRestoreRequest: (request: SavedRequest) => void;
  onAddCurrentRequestToCollection: (collectionId: string) => void;
  onOpenRenameModal: (collection: Collection) => void;
  onDeleteCollection: (collectionId: string) => void;
  onOpenRenameRequestModal: (collectionId: string, request: SavedRequest) => void;
  onDuplicateRequestInCollection: (collectionId: string, requestId: string) => void;
  onDeleteRequestInCollection: (collectionId: string, requestId: string) => void;
  selectedRequestId: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleRenameCollection = () => {
    setIsMenuOpen(false);
    onOpenRenameModal(collection);
  };

  const handleDeleteCollection = () => {
    const accepted = window.confirm(`¿Eliminar la colección \"${collection.name}\"?`);
    setIsMenuOpen(false);

    if (!accepted) {
      return;
    }

    onDeleteCollection(collection.id);
  };

  const handleExportCollection = () => {
    const safeName = collection.name.trim().toLowerCase().replace(/\s+/g, "-") || "collection";
    const exportData = {
      collection,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeName}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
  };

  return (
    <div className="space-y-2 rounded border border-zinc-200 p-2">
      <div className="group flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={isExpanded}
        >
          <span className="text-xs text-zinc-500">{isExpanded ? "▾" : "▸"}</span>
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-zinc-600">
            {collection.name}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onAddCurrentRequestToCollection(collection.id)}
          aria-label={`Agregar request a ${collection.name}`}
          className="shrink-0 rounded px-1 text-base font-semibold text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-100 focus:opacity-100"
        >
          +
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label={`Opciones de ${collection.name}`}
            className="shrink-0 rounded px-1 text-base leading-none text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-100 focus:opacity-100"
          >
            ...
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-7 z-10 w-36 rounded border border-zinc-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={handleRenameCollection}
                className="w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100"
              >
                Renombrar
              </button>
              <button
                type="button"
                onClick={handleDeleteCollection}
                className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100"
              >
                Eliminar
              </button>
              <button
                type="button"
                onClick={handleExportCollection}
                className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100"
              >
                Exportar
              </button>
            </div>
          )}
        </div>
      </div>

      {isExpanded &&
        (collection.requests.length === 0 ? (
          <p className="rounded border border-dashed border-zinc-300 px-2 py-2 text-xs text-zinc-500">
            Sin requests.
          </p>
        ) : (
          <div className="space-y-1">
            {collection.requests.map((request) => (
              <RequestItem
                key={request.id}
                request={request}
                onRestoreRequest={onRestoreRequest}
                onRenameRequest={() => onOpenRenameRequestModal(collection.id, request)}
                onDuplicateRequest={() =>
                  onDuplicateRequestInCollection(collection.id, request.id)
                }
                onDeleteRequest={() => onDeleteRequestInCollection(collection.id, request.id)}
                isActive={selectedRequestId === request.id}
              />
            ))}
          </div>
        ))}
    </div>
  );
}

function RequestItem({
  request,
  onRestoreRequest,
  onRenameRequest,
  onDuplicateRequest,
  onDeleteRequest,
  isActive,
}: {
  request: SavedRequest;
  onRestoreRequest: (request: SavedRequest) => void;
  onRenameRequest: () => void;
  onDuplicateRequest: () => void;
  onDeleteRequest: () => void;
  isActive: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className={`group/request relative flex items-start gap-1 rounded border px-2 py-2 ${
        isActive
          ? "border-zinc-400 bg-zinc-100"
          : "border-zinc-200 hover:bg-zinc-50"
      }`}
    >
      <button type="button" onClick={() => onRestoreRequest(request)} className="min-w-0 flex-1 text-left text-xs">
        <p className="font-semibold text-zinc-700">{request.method}</p>
        <p className="truncate text-zinc-500">{request.name || request.url || "Sin nombre"}</p>
      </button>

      <button
        type="button"
        onClick={() => setIsMenuOpen((current) => !current)}
        aria-label={`Opciones de request ${request.name}`}
        className="rounded px-1 text-xs text-zinc-600 opacity-0 transition-opacity group-hover/request:opacity-100 hover:bg-zinc-100 focus:opacity-100"
      >
        ...
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-8 z-20 w-32 rounded border border-zinc-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onRenameRequest();
            }}
            className="w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100"
          >
            Renombrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onDuplicateRequest();
            }}
            className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100"
          >
            Duplicar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onDeleteRequest();
            }}
            className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  collections,
  selectedRequestId,
  onRestoreRequest,
  onCreateCollection,
  onAddCurrentRequestToCollection,
  onRenameCollection,
  onDeleteCollection,
  onRenameRequestInCollection,
  onDuplicateRequestInCollection,
  onDeleteRequestInCollection,
}: SidebarProps) {
  const [collectionName, setCollectionName] = useState("");
  const [renameTarget, setRenameTarget] = useState<Collection | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameRequestTarget, setRenameRequestTarget] = useState<{
    collectionId: string;
    requestId: string;
    currentName: string;
  } | null>(null);
  const [renameRequestValue, setRenameRequestValue] = useState("");

  const createCollection = () => {
    const trimmed = collectionName.trim();
    if (!trimmed) {
      return;
    }

    onCreateCollection(trimmed);
    setCollectionName("");
  };

  const openRenameModal = (collection: Collection) => {
    setRenameTarget(collection);
    setRenameValue(collection.name);
  };

  const closeRenameModal = () => {
    setRenameTarget(null);
    setRenameValue("");
  };

  const submitRename = () => {
    if (!renameTarget) {
      return;
    }

    const trimmed = renameValue.trim();
    if (!trimmed) {
      return;
    }

    onRenameCollection(renameTarget.id, trimmed);
    closeRenameModal();
  };

  const openRenameRequestModal = (collectionId: string, request: SavedRequest) => {
    setRenameRequestTarget({
      collectionId,
      requestId: request.id,
      currentName: request.name || request.url || "Request",
    });
    setRenameRequestValue(request.name || request.url || "Request");
  };

  const closeRenameRequestModal = () => {
    setRenameRequestTarget(null);
    setRenameRequestValue("");
  };

  const submitRenameRequest = () => {
    if (!renameRequestTarget) {
      return;
    }

    const trimmed = renameRequestValue.trim();
    if (!trimmed) {
      return;
    }

    onRenameRequestInCollection(
      renameRequestTarget.collectionId,
      renameRequestTarget.requestId,
      trimmed,
    );
    closeRenameRequestModal();
  };

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-zinc-200 px-4 py-3">
        <p className="text-sm font-semibold">My Workspace</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Collections</p>
          </div>

          <div className="flex gap-2">
            <input
              value={collectionName}
              onChange={(event) => setCollectionName(event.target.value)}
              placeholder="Nueva colección"
              className="h-8 flex-1 rounded border border-zinc-300 px-2 text-xs outline-none focus:border-zinc-500"
            />
            <button
              type="button"
              onClick={createCollection}
              className="rounded border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Crear
            </button>
          </div>

          {collections.length === 0 ? (
            <p className="rounded border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500">
              Crea una colección para agregar requests.
            </p>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => (
                <CollectionItem
                  key={collection.id}
                  collection={collection}
                  onRestoreRequest={onRestoreRequest}
                  onAddCurrentRequestToCollection={onAddCurrentRequestToCollection}
                  onOpenRenameModal={openRenameModal}
                  onDeleteCollection={onDeleteCollection}
                  onOpenRenameRequestModal={openRenameRequestModal}
                  onDuplicateRequestInCollection={onDuplicateRequestInCollection}
                  onDeleteRequestInCollection={onDeleteRequestInCollection}
                  selectedRequestId={selectedRequestId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </aside>

      {renameTarget && (
        <RenameModal
          title="Renombrar colección"
          placeholder="Nombre de colección"
          value={renameValue}
          onChange={setRenameValue}
          onCancel={closeRenameModal}
          onConfirm={submitRename}
        />
      )}

      {renameRequestTarget && (
        <RenameModal
          title="Renombrar request"
          placeholder="Nombre de request"
          value={renameRequestValue}
          onChange={setRenameRequestValue}
          onCancel={closeRenameRequestModal}
          onConfirm={submitRenameRequest}
        />
      )}
    </>
  );
}
