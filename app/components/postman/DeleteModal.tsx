import { Spinner } from "./ui/Spinner";

type DeleteModalProps = {
  title: string;
  description: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteModal({
  title,
  description,
  isLoading = false,
  onCancel,
  onConfirm,
}: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4">
      <div className="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-2 text-sm text-zinc-700">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Spinner />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
