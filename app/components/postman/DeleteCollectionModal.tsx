import React from "react";

interface DeleteCollectionModalProps {
  open: boolean;
  collectionName: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteCollectionModal({
  open,
  collectionName,
  onCancel,
  onConfirm,
  loading = false,
}: DeleteCollectionModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#F2F5FA]/90" onClick={loading ? undefined : onCancel} />
      <div className="relative z-10 w-full max-w-xs rounded-lg border border-[#F0B76A] bg-[#F2F5FA] shadow-xl">
        <div className="border-b border-[#F0B76A] bg-[#F0B76A] px-5 py-4 rounded-t-lg">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#B8792F]">
            Eliminar colección
          </h2>
        </div>
        <div className="px-5 py-6 text-center text-[#B8792F]">
          ¿Eliminar la colección "<span className="font-semibold text-[#D9963D]">{collectionName}</span>"?
        </div>
        <div className="flex justify-end gap-2 border-t border-[#F0B76A] bg-[#F2F5FA] px-5 py-3 rounded-b-lg">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded border border-[#D9963D] px-4 py-1.5 text-sm font-medium text-[#D9963D] bg-white hover:bg-[#F0B76A]/40 transition-colors duration-150"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded bg-[#D9963D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#B8792F] disabled:opacity-50 transition-colors duration-150"
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
