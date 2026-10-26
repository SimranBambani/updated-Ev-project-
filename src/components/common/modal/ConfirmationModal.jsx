import React from 'react';
import { Modal } from './Modal';
import { Button } from '../buttons/Button';
import { FiAlertTriangle } from 'react-icons/fi';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mb-4 text-2xl">
          <FiAlertTriangle />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>
        
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} isDisabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
