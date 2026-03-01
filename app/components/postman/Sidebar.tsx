import { useState } from "react";
import { RenameModal } from "./RenameModal";
import { DeleteModal } from "./DeleteModal";
import type { MockCollection, MockDefinition } from "./interfaces/mock-definition.interface";
import { Spinner } from "./ui/Spinner";
import { Logo } from "./ui/Logo";

type SidebarProps = {
  collections: MockCollection[];
  selectedMockId: string | null;
  loadingAction: string | null;
  onRestoreMock: (mock: MockDefinition) => void;
  onCreateCollection: (name: string) => void;
  onRenameCollection: (collectionId: string, nextName: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onRenameMockInCollection: (collectionId: string, mockId: string, nextName: string) => void;
  onDuplicateMockInCollection: (collectionId: string, mockId: string) => void;
  onDeleteMockInCollection: (collectionId: string, mockId: string) => void;
  onToggleMockEnabled: (collectionId: string, mockId: string) => void;
  onNewMock: () => void;
};

function CollectionItem({
  collection,
  onRestoreMock,
  onOpenRenameModal,
  onDeleteCollection,
  onOpenRenameMockModal,
  onDuplicateMockInCollection,
  onDeleteMockInCollection,
  onToggleMockEnabled,
  selectedMockId,
  loadingAction,
}: {
  collection: MockCollection;
  onRestoreMock: (mock: MockDefinition) => void;
  onOpenRenameModal: (collection: MockCollection) => void;
  onDeleteCollection: (collectionId: string) => void;
  onOpenRenameMockModal: (collectionId: string, mock: MockDefinition) => void;
  onDuplicateMockInCollection: (collectionId: string, mockId: string) => void;
  onDeleteMockInCollection: (collectionId: string, mockId: string) => void;
  onToggleMockEnabled: (collectionId: string, mockId: string) => void;
  selectedMockId: string | null;
  loadingAction: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isDeletingCollection = loadingAction === `delete-collection:${collection.id}`;

  const handleRenameCollection = () => {
    setIsMenuOpen(false);
    onOpenRenameModal(collection);
  };

  const handleDeleteCollection = () => {
    setIsMenuOpen(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
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
    <>
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
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
            {collection.mocks.length}
          </span>
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
                disabled={isDeletingCollection}
                className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 flex items-center gap-1"
              >
                {isDeletingCollection && <Spinner />}
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
        (collection.mocks.length === 0 ? (
          <p className="rounded border border-dashed border-zinc-300 px-2 py-2 text-xs text-zinc-500">
            Sin mocks. Crea uno con el formulario.
          </p>
        ) : (
          <div className="space-y-1">
            {collection.mocks.map((mock) => (
              <MockItem
                key={mock.id}
                mock={mock}
                loadingAction={loadingAction}
                onRestoreMock={onRestoreMock}
                onRenameMock={() => onOpenRenameMockModal(collection.id, mock)}
                onDuplicateMock={() => onDuplicateMockInCollection(collection.id, mock.id)}
                onDeleteMock={() => onDeleteMockInCollection(collection.id, mock.id)}
                onToggleEnabled={() => onToggleMockEnabled(collection.id, mock.id)}
                isActive={selectedMockId === mock.id}
              />
            ))}
          </div>
        ))}
    </div>

      {showDeleteModal && (
        <DeleteModal
          title="Eliminar colección"
          description={`¿Eliminar la colección "${collection.name}"? Esta acción no se puede deshacer.`}
          isLoading={isDeletingCollection}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}

function MockItem({
  mock,
  loadingAction,
  onRestoreMock,
  onRenameMock,
  onDuplicateMock,
  onDeleteMock,
  onToggleEnabled,
  isActive,
}: {
  mock: MockDefinition;
  loadingAction: string | null;
  onRestoreMock: (mock: MockDefinition) => void;
  onRenameMock: () => void;
  onDuplicateMock: () => void;
  onDeleteMock: () => void;
  onToggleEnabled: () => void;
  isActive: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const isTogglingEnabled = loadingAction === `toggle-mock:${mock.id}`;
  const isDuplicating = loadingAction === `duplicate-mock:${mock.id}`;
  const isDeleting = loadingAction === `delete-mock:${mock.id}`;

  return (
    <div
      className={`group/mock relative flex items-start gap-1 rounded border px-2 py-2 ${
        isActive
          ? "border-zinc-400 bg-zinc-100"
          : mock.enabled
          ? "border-zinc-200 hover:bg-zinc-50"
          : "border-zinc-200 bg-zinc-50 opacity-60"
      }`}
    >
      <button
        type="button"
        onClick={() => onRestoreMock(mock)}
        className="min-w-0 flex-1 text-left text-xs"
      >
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              mock.method === "GET"
                ? "bg-green-100 text-green-700"
                : mock.method === "POST"
                ? "bg-blue-100 text-blue-700"
                : mock.method === "PUT"
                ? "bg-yellow-100 text-yellow-700"
                : mock.method === "DELETE"
                ? "bg-red-100 text-red-700"
                : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {mock.method}
          </span>
          <span className="rounded bg-zinc-200 px-1 py-0.5 text-[10px] text-zinc-600">
            {mock.responseStatus}
          </span>
          {!mock.enabled && (
            <span className="rounded bg-red-100 px-1 py-0.5 text-[10px] text-red-600">
              OFF
            </span>
          )}
        </div>
        <p className="mt-1 truncate font-mono text-zinc-500">{mock.path}</p>
        <p className="truncate text-zinc-400">{mock.name}</p>
      </button>

      <button
        type="button"
        onClick={() => setIsMenuOpen((current) => !current)}
        aria-label={`Opciones de mock ${mock.name}`}
        className="rounded px-1 text-xs text-zinc-600 opacity-0 transition-opacity group-hover/mock:opacity-100 hover:bg-zinc-100 focus:opacity-100"
      >
        ...
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-8 z-20 w-32 rounded border border-zinc-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            disabled={isTogglingEnabled}
            onClick={() => {
              setIsMenuOpen(false);
              onToggleEnabled();
            }}
            className="w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 flex items-center gap-1"
          >
            {isTogglingEnabled && <Spinner />}
            {mock.enabled ? "Desactivar" : "Activar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onRenameMock();
            }}
            className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100"
          >
            Renombrar
          </button>
          <button
            type="button"
            disabled={isDuplicating}
            onClick={() => {
              setIsMenuOpen(false);
              onDuplicateMock();
            }}
            className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 flex items-center gap-1"
          >
            {isDuplicating && <Spinner />}
            Duplicar
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => {
              setIsMenuOpen(false);
              setShowDeleteModal(true);
            }}
            className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 flex items-center gap-1"
          >
            {isDeleting && <Spinner />}
            Eliminar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              const safeName = mock.name.trim().toLowerCase().replace(/\s+/g, "-") || "mock";
              const exportData = {
                mock,
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
            }}
            className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100"
          >
            Exportar
          </button>
        </div>
      )}

      {showDeleteModal && (
        <DeleteModal
          title="Eliminar mock"
          description={`¿Eliminar "${mock.name || mock.path}"? Esta acción no se puede deshacer.`}
          isLoading={isDeleting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => {
            setShowDeleteModal(false);
            onDeleteMock();
          }}
        />
      )}
    </div>
  );
}

export function Sidebar({
  collections,
  selectedMockId,
  loadingAction,
  onRestoreMock,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onRenameMockInCollection,
  onDuplicateMockInCollection,
  onDeleteMockInCollection,
  onToggleMockEnabled,
  onNewMock,
}: SidebarProps) {
  const [collectionName, setCollectionName] = useState("");
  const [renameTarget, setRenameTarget] = useState<MockCollection | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameMockTarget, setRenameMockTarget] = useState<{
    collectionId: string;
    mockId: string;
    currentName: string;
  } | null>(null);
  const [renameMockValue, setRenameMockValue] = useState("");
  
  const isCreatingCollection = loadingAction === "create-collection";

  const createCollection = () => {
    const trimmed = collectionName.trim();
    if (!trimmed) {
      return;
    }

    onCreateCollection(trimmed);
    setCollectionName("");
  };

  const openRenameModal = (collection: MockCollection) => {
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

  const openRenameMockModal = (collectionId: string, mock: MockDefinition) => {
    setRenameMockTarget({
      collectionId,
      mockId: mock.id,
      currentName: mock.name || mock.path || "Mock",
    });
    setRenameMockValue(mock.name || mock.path || "Mock");
  };

  const closeRenameMockModal = () => {
    setRenameMockTarget(null);
    setRenameMockValue("");
  };

  const submitRenameMock = () => {
    if (!renameMockTarget) {
      return;
    }

    const trimmed = renameMockValue.trim();
    if (!trimmed) {
      return;
    }

    onRenameMockInCollection(
      renameMockTarget.collectionId,
      renameMockTarget.mockId,
      trimmed
    );
    closeRenameMockModal();
  };

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-zinc-200 px-4 py-4">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            <button
              type="button"
              onClick={onNewMock}
              className="w-full rounded border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
            >
              + Nuevo Mock
            </button>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Colecciones
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  value={collectionName}
                  onChange={(event) => setCollectionName(event.target.value)}
                  placeholder="Nueva colección"
                  disabled={isCreatingCollection}
                  className="h-8 flex-1 rounded border border-zinc-300 px-2 text-xs outline-none focus:border-zinc-500 disabled:opacity-50"
                  onKeyDown={(e) => e.key === "Enter" && !isCreatingCollection && createCollection()}
                />
                <button
                  type="button"
                  onClick={createCollection}
                  disabled={isCreatingCollection}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 flex items-center gap-1"
                >
                  {isCreatingCollection && <Spinner />}
                  Crear
                </button>
              </div>

              {collections.length === 0 ? (
                <p className="rounded border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500">
                  Crea una colección para organizar tus mocks.
                </p>
              ) : (
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <CollectionItem
                      key={collection.id}
                      collection={collection}
                      loadingAction={loadingAction}
                      onRestoreMock={onRestoreMock}
                      onOpenRenameModal={openRenameModal}
                      onDeleteCollection={onDeleteCollection}
                      onOpenRenameMockModal={openRenameMockModal}
                      onDuplicateMockInCollection={onDuplicateMockInCollection}
                      onDeleteMockInCollection={onDeleteMockInCollection}
                      onToggleMockEnabled={onToggleMockEnabled}
                      selectedMockId={selectedMockId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 px-4 py-3">
          <p className="text-[10px] text-zinc-400">
            Los mocks están disponibles en:
          </p>
          <p className="mt-1 font-mono text-[10px] text-zinc-500">
            /api/mock/[tu-endpoint]
          </p>
        </div>
      </aside>

      {renameTarget && (
        <RenameModal
          title="Renombrar colección"
          placeholder="Nombre de colección"
          value={renameValue}
          isLoading={loadingAction === `rename-collection:${renameTarget.id}`}
          onChange={setRenameValue}
          onCancel={closeRenameModal}
          onConfirm={submitRename}
        />
      )}

      {renameMockTarget && (
        <RenameModal
          title="Renombrar mock"
          placeholder="Nombre del mock"
          value={renameMockValue}
          isLoading={loadingAction === `rename-mock:${renameMockTarget.mockId}`}
          onChange={setRenameMockValue}
          onCancel={closeRenameMockModal}
          onConfirm={submitRenameMock}
        />
      )}
    </>
  );
}
