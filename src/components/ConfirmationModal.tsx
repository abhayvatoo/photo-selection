'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  requiresTypedConfirmation?: boolean;
  confirmationPhrase?: string;
  isDestructive?: boolean;
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  requiresTypedConfirmation = false,
  confirmationPhrase = '',
  isDestructive = false,
  loading = false,
}: ConfirmationModalProps) {
  const [typedConfirmation, setTypedConfirmation] = useState('');

  const handleConfirm = () => {
    if (requiresTypedConfirmation && typedConfirmation !== confirmationPhrase) {
      return; // Don't allow confirmation if typed text doesn't match
    }
    onConfirm();
    setTypedConfirmation(''); // Reset for next time
  };

  const handleClose = () => {
    setTypedConfirmation(''); // Reset when closing
    onClose();
  };

  const canConfirm = !requiresTypedConfirmation || typedConfirmation === confirmationPhrase;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {isDestructive && (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-line mb-4">
            {message}
          </p>

          {confirmText && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600 font-medium">
                {confirmText}
              </p>
            </div>
          )}

          {requiresTypedConfirmation && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "{confirmationPhrase}" to confirm:
              </label>
              <input
                type="text"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={confirmationPhrase}
                autoComplete="off"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center space-x-2 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300'
            } disabled:cursor-not-allowed`}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{loading ? 'Processing...' : confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}