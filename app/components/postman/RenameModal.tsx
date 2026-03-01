import { Spinner } from "./ui/Spinner";

type RenameModalProps = {
  title: string;
  placeholder: string;
  value: string;
  isLoading?: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RenameModal({
  title,
  placeholder,
  value,
  isLoading = false,
  onChange,
  onCancel,
  onConfirm,
}: RenameModalProps) {
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
        <div className="space-y-4 px-5 py-4">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={isLoading}
            className="h-9 w-full rounded border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 disabled:opacity-50"
            placeholder={placeholder}
            autoFocus
          />
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
            onClick={onConfirm}
            disabled={isLoading}
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
