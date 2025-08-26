'use client';

import React, { memo, useCallback } from 'react';
import { Heart, Download, Eye, Trash2, Check, CheckCircle } from 'lucide-react';
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
    <div className={`group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden ${
      isSelectedByUser ? 'ring-2 ring-green-500 ring-offset-2' : ''
    }`}>
      {/* Photo Image */}
      <div
        className="relative aspect-square cursor-pointer touch-manipulation transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        onClick={handlePreview}
      >
        <Image
          src={photo.url}
          alt={photo.originalName}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          loading="lazy"
          quality={85}
        />

        {/* Selection indicator overlay */}
        {isSelectedByUser && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
            <div className="bg-green-500 text-white rounded-full p-2 shadow-lg">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
          </div>
        )}

        {/* Subtle hover effect for desktop - no janky overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-200 hidden md:block"></div>
      </div>

      {/* Photo Info */}
      <div className="p-3">
        {/* File name */}
        <h3 className="text-sm font-medium text-gray-900 truncate mb-1" title={photo.originalName}>
          {photo.originalName}
        </h3>

        {/* Uploaded by - hidden on mobile to save space */}
        <p className="text-xs text-gray-500 mb-2 hidden sm:block">
          by {photo.uploadedBy.name || photo.uploadedBy.email}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {/* Selection button - larger touch target on mobile */}
          {canSelect && (
            <button
              onClick={handleSelect}
              disabled={isSelecting}
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation ${
                isSelectedByUser
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isSelecting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSelectedByUser ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Heart className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isSelectedByUser ? 'Selected' : 'Select'}</span>
            </button>
          )}

          {/* Selection count - more prominent on mobile */}
          {selectionCount > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {selectionCount}
            </span>
          )}

          {/* Action buttons - larger touch targets */}
          <div className="flex items-center gap-1">
            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Delete button */}
            {canManage && onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors touch-manipulation"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default PhotoCard;
