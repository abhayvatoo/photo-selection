'use client';

import React, { memo, useCallback } from 'react';
import { Heart, Download, Eye, Trash2 } from 'lucide-react';
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

interface PhotoCardProps {
  photo: Photo;
  userId: string;
  canSelect: boolean;
  canManage: boolean;
  isSelected: boolean;
  isSelecting: boolean;
  onSelect: (photoId: number) => void;
  onPreview: (photo: Photo) => void;
  onDownload: (photo: Photo) => void;
  onDelete?: (photoId: number) => void;
}

/**
 * Individual photo card component with selection and management capabilities
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const PhotoCard = memo(function PhotoCard({
  photo,
  userId,
  canSelect,
  canManage,
  isSelected,
  isSelecting,
  onSelect,
  onPreview,
  onDownload,
  onDelete,
}: PhotoCardProps) {
  const userSelection = photo.selections.find((s) => s.userId === userId);
  const isSelectedByUser = !!userSelection;
  const selectionCount = photo.selections.length;

  /**
   * Handles photo selection/deselection
   */
  const handleSelect = useCallback(async () => {
    if (!canSelect || isSelecting) return;
    onSelect(photo.id);
  }, [canSelect, isSelecting, onSelect, photo.id]);


  /**
   * Handles photo preview
   */
  const handlePreview = useCallback(() => {
    onPreview(photo);
  }, [onPreview, photo]);

  /**
   * Handles photo download
   */
  const handleDownload = useCallback(() => {
    onDownload(photo);
  }, [onDownload, photo]);

  /**
   * Handles photo deletion
   */
  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(photo.id);
    }
  }, [onDelete, photo.id]);

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">

      {/* Photo Image */}
      <div
        className="relative aspect-square cursor-pointer"
        onClick={handlePreview}
      >
        <Image
          src={photo.url}
          alt={photo.originalName}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>

      {/* Photo Info */}
      <div className="p-3">
        {/* File name */}
        <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
          {photo.originalName}
        </h3>

        {/* Uploaded by */}
        <p className="text-xs text-gray-500 mb-2">
          by {photo.uploadedBy.name || photo.uploadedBy.email}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {/* Selection button */}
          {canSelect && (
            <button
              onClick={handleSelect}
              disabled={isSelecting}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                isSelectedByUser
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isSelecting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart
                className={`w-3 h-3 ${isSelectedByUser ? 'fill-current' : ''}`}
              />
              {isSelectedByUser ? 'Selected' : 'Select'}
            </button>
          )}

          {/* Selection count */}
          {selectionCount > 0 && (
            <span className="text-xs text-gray-500">
              {selectionCount} selection{selectionCount !== 1 ? 's' : ''}
            </span>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Delete button */}
            {canManage && onDelete && (
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default PhotoCard;
