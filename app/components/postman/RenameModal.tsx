type RenameModalProps = {
  title: string;
  placeholder: string;
  value: string;
  isLoading?: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

function Spinner() {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="14"
      height="14"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4">
      <div className="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isLoading}
          className="mt-3 h-10 w-full rounded border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 disabled:opacity-50"
          placeholder={placeholder}
          autoFocus
        />

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
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
