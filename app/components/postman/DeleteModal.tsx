import { Spinner } from "./ui/Spinner";

type DeleteModalProps = {
  title?: string;
  description?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteModal({
  title = "Eliminar",
  description,
  isLoading = false,
  onCancel,
  onConfirm,
}: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={!isLoading ? onCancel : undefined} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-zinc-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            {title}
          </h2>
        </div>

        {/* Body */}
        {description && (
          <div className="px-5 py-4">
            <p className="text-sm text-zinc-600">{description}</p>
          </div>
        )}

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
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 rounded bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isLoading && <Spinner />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
