'use client';

import { Settings, Trash2, Download, X, CheckCircle2 } from 'lucide-react';

interface PhotoGalleryToolbarProps {
  canManage: boolean;
  managementMode: boolean;
  selectedCount: number;
  totalPhotos: number;
  isDeleting: boolean;
  onToggleManagementMode: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkDownload: () => void;
}

/**
 * Toolbar component for photo gallery management operations
 */
export default function PhotoGalleryToolbar({
  canManage,
  managementMode,
  selectedCount,
  totalPhotos,
  isDeleting,
  onToggleManagementMode,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkDownload,
}: PhotoGalleryToolbarProps) {
  if (!canManage) return null;

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
      {!managementMode ? (
        /* Management Mode Toggle */
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Photo Management
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Organize, delete, or download multiple photos at once
            </p>
          </div>
          <button
            onClick={onToggleManagementMode}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Manage Photos
          </button>
        </div>
      ) : (
        /* Management Mode Active */
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-900">
                Management Mode
              </h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {selectedCount} of {totalPhotos} selected
              </span>
            </div>
            <button
              onClick={onToggleManagementMode}
              className="flex items-center gap-2 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
              Exit
            </button>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Select All
            </button>
            <button
              onClick={onDeselectAll}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
            >
              <X className="w-4 h-4" />
              Deselect All
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-gray-600 mr-2">Bulk actions:</span>

              {/* Bulk Download */}
              <button
                onClick={onBulkDownload}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
              >
                <Download className="w-4 h-4" />
                Download ({selectedCount})
              </button>

              {/* Bulk Delete */}
              <button
                onClick={onBulkDelete}
                disabled={isDeleting}
                className={`flex items-center gap-2 px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : `Delete (${selectedCount})`}
              </button>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
            <strong>Tip:</strong> Click the checkbox on photos to select them
            for bulk operations. You can download or delete multiple photos at
            once.
          </div>
        </div>
      )}
    </div>
  );
}
