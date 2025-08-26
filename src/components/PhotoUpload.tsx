'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, AlertCircle, AlertTriangle } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/useToast';
import { csrfPostFormData } from '@/lib/csrf-fetch';

interface PhotoUploadProps {
  workspaceId: string;
  onUpload?: () => void;
}

export default function PhotoUpload({
  workspaceId,
  onUpload,
}: PhotoUploadProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const socket = useSocket(
    session?.user?.id,
    session?.user?.name || session?.user?.email || 'Unknown'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [photoLimit, setPhotoLimit] = useState<{
    allowed: boolean;
    current: number;
    limit: number;
  } | null>(null);

  const checkPhotoLimit = useCallback(async () => {
    if (!session?.user?.id || !workspaceId) return;

    try {
      const response = await fetch(
        `/api/user/photo-limit?workspaceId=${workspaceId}`
      );
      if (response.ok) {
        const data = await response.json();
        setPhotoLimit(data);
      }
    } catch (error) {
      console.error('Error checking photo limit:', error);
    }
  }, [session?.user?.id, workspaceId]);

  useEffect(() => {
    if (session?.user?.id && workspaceId) {
      checkPhotoLimit();
    }
  }, [session?.user?.id, workspaceId, checkPhotoLimit]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || !session?.user?.id) {
      return;
    }

    // Check photo limit before uploading
    if (photoLimit && !photoLimit.allowed) {
      const errorMsg = `Photo limit reached. You can only have ${photoLimit.limit} photos in this workspace.`;
      setError(errorMsg);
      showToast(errorMsg, 'warning');
      return;
    }

    // Check if adding these files would exceed the limit
    if (photoLimit && photoLimit.limit !== -1) {
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (photoLimit.current + imageFiles.length > photoLimit.limit) {
        const errorMsg = `Adding ${imageFiles.length} photos would exceed your limit of ${photoLimit.limit} photos per workspace.`;
        setError(errorMsg);
        showToast(errorMsg, 'warning');
        return;
      }
    }

    setIsUploading(true);
    setError(null);

    // Filter to only image files
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    setUploadProgress({ current: 0, total: imageFiles.length });

    try {
      let uploadedCount = 0;
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setUploadProgress({ current: i + 1, total: imageFiles.length });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', session.user.id);
        formData.append('workspaceId', workspaceId);

        // Use CSRF-aware fetch wrapper (handles token and retry automatically)
        const response = await csrfPostFormData('/api/photos/upload', formData);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        uploadedCount++;
      }

      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Emit socket event for real-time photo upload notification
      if (socket) {
        socket.emit('uploadPhoto', {
          workspaceId,
          message: `New photos uploaded by ${session?.user?.name || session?.user?.email}`,
        });
      }

      // Show success toast and refresh page to show new photos
      const photoWord = uploadedCount === 1 ? 'photo' : 'photos';
      showToast(
        `Successfully uploaded ${uploadedCount} ${photoWord}!`,
        'success'
      );

      // Call onUpload callback if provided, otherwise refresh the page
      if (onUpload) {
        onUpload();
      } else {
        // Refresh page after a brief delay to show the toast first
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      showToast(`Upload failed: ${errorMessage}`, 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Create a mock event to reuse the handleFileSelect logic
      const mockEvent = {
        target: { files },
      } as React.ChangeEvent<HTMLInputElement>;

      handleFileSelect(mockEvent);
    }
  };

  return (
    <div className="space-y-4">
      {/* Photo Limit Warning */}
      {photoLimit && !photoLimit.allowed && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Photo Limit Reached
              </p>
              <p className="text-sm text-orange-700 mt-1">
                You&apos;ve reached your limit of {photoLimit.limit} photos in
                this workspace.
                <a
                  href="/pricing"
                  className="underline hover:no-underline ml-1"
                >
                  Upgrade your plan
                </a>{' '}
                to upload more photos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Usage Info */}
      {photoLimit && photoLimit.allowed && photoLimit.limit !== -1 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">
              {photoLimit.current} of {photoLimit.limit} photos used in this
              workspace
            </span>
          </p>
        </div>
      )}

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-200 cursor-pointer ${
          isUploading
            ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
            : error
              ? 'border-red-300 bg-red-50 hover:border-red-400'
              : isDragOver
                ? 'border-blue-500 bg-blue-100'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        } ${photoLimit && !photoLimit.allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          pointerEvents:
            isUploading || !session?.user || (photoLimit && !photoLimit.allowed)
              ? 'none'
              : 'auto',
        }}
      >
        <div className="flex items-center justify-center gap-3">
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="flex flex-col text-left">
                <p className="text-blue-600 font-medium text-sm">
                  Uploading... ({uploadProgress.current}/{uploadProgress.total})
                </p>
                <div className="w-32 bg-gray-200 rounded-full h-1 mt-1">
                  <div
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{
                      width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </>
          ) : error ? (
            <>
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <p className="text-red-600 font-medium text-sm">
                  Upload failed
                </p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            </>
          ) : (
            <>
              <Upload
                className={`w-5 h-5 ${isDragOver ? 'text-blue-600' : 'text-gray-400'}`}
              />
              <div className="text-left">
                <p
                  className={`font-medium text-sm ${isDragOver ? 'text-blue-700' : 'text-gray-700'}`}
                >
                  {isDragOver ? 'Drop Photos Here' : 'Upload Photos'}
                </p>
                <p
                  className={`text-xs ${isDragOver ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  {isDragOver
                    ? 'Release to upload'
                    : 'JPG, PNG • Multiple files • Drag & drop'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <button
          onClick={() => setError(null)}
          className="w-full text-sm text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
