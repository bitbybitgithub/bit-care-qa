import React from "react";
type ConfirmModalProps = {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  message,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 pb-110 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--color-surface)] rounded-lg shadow-lg w-full max-w-sm p-6">
        <p className="mb-5 text-[var(--color-text)]">{message}</p>

        <div className="flex justify-between gap-3">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-[var(--color-secondary)] text-[var(--color-text)] rounded"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Yes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
