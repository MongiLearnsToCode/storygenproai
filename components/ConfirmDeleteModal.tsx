
import React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
  isDeleting: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[100]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-modal-title"
    >
      <div
        className="bg-white p-5 sm:p-6 rounded-xl shadow-xl w-full max-w-md flex flex-col border border-neutral-200 text-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-3 sm:mb-4">
          <Icon name="ExclamationTriangle" className="w-7 h-7 sm:w-8 sm:h-8 text-red-500 mr-3" />
          <h2 id="confirm-delete-modal-title" className="text-lg sm:text-xl font-semibold text-neutral-700">
            Confirm Deletion
          </h2>
        </div>

        <div className="text-sm sm:text-base text-neutral-600 space-y-2 mb-5 sm:mb-6">
          <p>
            Are you sure you want to permanently delete the project:
            <br />
            <strong className="text-neutral-700 font-medium">"{projectName}"</strong>?
          </p>
          <p className="font-semibold text-red-600">This action cannot be undone.</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting} className="order-2 sm:order-1 text-sm sm:text-base">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isDeleting}
            disabled={isDeleting}
            leftIcon={isDeleting ? undefined : <Icon name="Trash" className="w-4 h-4" />}
            className="order-1 sm:order-2 text-sm sm:text-base"
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
};
