'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import PhotoUpload from './PhotoUpload';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

export default function UploadModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
}: UploadModalProps) {
  const handleClose = () => {
    onClose();
  };

  const handleUploadComplete = () => {
    // Auto-close modal after successful upload
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Photos
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="text-sm text-gray-600 mb-6">
            Upload photos to <strong>{workspaceName}</strong> for clients to view and select.
          </div>

          {/* Upload Component */}
          <PhotoUpload 
            workspaceId={workspaceId} 
            onUpload={handleUploadComplete}
          />

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Upload Tips:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Drag & drop multiple files at once</li>
              <li>• Supports JPG, PNG, and other image formats</li>
              <li>• Files are automatically organized by upload date</li>
              <li>• Clients will be able to select their favorites</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}