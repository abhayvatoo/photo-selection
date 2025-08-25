'use client';

import { X, Download, Heart, User } from 'lucide-react';
import Image from 'next/image';
import { UI } from '@/lib/constants';

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: {
    name: string | null;
    email: string;
  };
  selections: Array<{
    id: string;
    userId: string;
    user: {
      name: string | null;
      email: string;
    };
  }>;
}

interface PhotoPreviewModalProps {
  photo: Photo | null;
  isOpen: boolean;
  userId: string;
  canSelect: boolean;
  isSelecting: boolean;
  onClose: () => void;
  onSelect: (photoId: number) => void;
  onDownload: (photo: Photo) => void;
}

/**
 * Modal component for previewing photos with full-size display and actions
 */
export default function PhotoPreviewModal({
  photo,
  isOpen,
  userId,
  canSelect,
  isSelecting,
  onClose,
  onSelect,
  onDownload,
}: PhotoPreviewModalProps) {
  if (!isOpen || !photo) return null;

  const userSelection = photo.selections.find((s) => s.userId === userId);
  const isSelectedByUser = !!userSelection;

  /**
   * Handles modal backdrop click to close
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Handles photo selection/deselection
   */
  const handleSelect = () => {
    if (!canSelect || isSelecting) return;
    onSelect(photo.id);
  };

  /**
   * Handles photo download
   */
  const handleDownload = () => {
    onDownload(photo);
  };

  /**
   * Formats file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Formats date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {photo.originalName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Image */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-[400px] lg:min-h-[500px]">
            <div className="relative max-w-full max-h-full">
              <Image
                src={photo.url}
                alt={photo.originalName}
                width={800}
                height={600}
                className="object-contain max-w-full max-h-[400px] lg:max-h-[500px]"
                priority
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 p-4 border-t lg:border-t-0 lg:border-l">
            {/* Photo Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Details
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{formatFileSize(photo.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{photo.mimeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span>{formatDate(photo.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>By:</span>
                    <span>
                      {photo.uploadedBy.name || photo.uploadedBy.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selections */}
              {photo.selections.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Selections ({photo.selections.length})
                  </h3>
                  <div className="space-y-2">
                    {photo.selections.map((selection) => (
                      <div
                        key={selection.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {selection.user.name || 'Unknown User'}
                        </span>
                        {selection.userId === userId && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t">
                {/* Select/Deselect Button */}
                {canSelect && (
                  <button
                    onClick={handleSelect}
                    disabled={isSelecting}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                      isSelectedByUser
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    } ${isSelecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isSelectedByUser ? 'fill-current' : ''}`}
                    />
                    {isSelecting
                      ? 'Processing...'
                      : isSelectedByUser
                        ? 'Remove Selection'
                        : 'Select Photo'}
                  </button>
                )}

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
