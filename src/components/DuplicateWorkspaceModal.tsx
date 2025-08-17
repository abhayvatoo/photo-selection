'use client';

import { useState } from 'react';
import { X, Copy } from 'lucide-react';

interface DuplicateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  workspaceName: string;
  defaultName: string;
  loading?: boolean;
}

export function DuplicateWorkspaceModal({
  isOpen,
  onClose,
  onConfirm,
  workspaceName,
  defaultName,
  loading = false,
}: DuplicateWorkspaceModalProps) {
  const [newName, setNewName] = useState(defaultName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onConfirm(newName.trim());
    }
  };

  const handleClose = () => {
    setNewName(defaultName); // Reset to default
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Copy className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Duplicate Workspace
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Create a copy of "{workspaceName}" with the same settings and structure.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name for the new workspace:
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter workspace name..."
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="text-sm text-gray-500">
              <p className="mb-2">The duplicate will include:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Workspace settings and configuration</li>
                <li>Member roles and permissions</li>
                <li>Workspace structure (but not existing photos)</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <Copy className="h-4 w-4" />
              <span>{loading ? 'Creating...' : 'Create Duplicate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}