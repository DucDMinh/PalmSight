import React from "react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-mono"
      data-testid="delete-modal"
    >
      <div className="w-full max-w-[420px] bg-canvas border border-hairline p-6 rounded shadow-lg text-ink">
        <h3 className="font-heading-md text-heading-md font-bold mb-2">
          Xác nhận xoá
        </h3>
        <p className="font-body-md text-body-md text-mute mb-6 leading-relaxed">
          Bạn có chắc chắn muốn xoá lần xem bói này? Sau khi xoá, kết quả sẽ không thể khôi phục.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-hairline font-button-md text-sm rounded hover:bg-surface-soft transition-colors cursor-pointer"
            data-testid="cancel-delete-button"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-danger text-white font-button-md text-sm rounded hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            data-testid="confirm-delete-button"
          >
            {isDeleting ? "Đang xoá..." : "Xoá vĩnh viễn"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
