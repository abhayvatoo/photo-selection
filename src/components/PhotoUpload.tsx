'use client';

import { useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, Plus, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

interface PhotoUploadProps {
  workspaceId: string;
  onUpload?: () => void;
}

export default function PhotoUpload({ workspaceId, onUpload }: PhotoUploadProps) {
  const { data: session } = useSession();
  const socket = useSocket(session?.user?.id, session?.user?.name || session?.user?.email || 'Unknown');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [photoLimit, setPhotoLimit] = useState<{ allowed: boolean; current: number; limit: number } | null>(null);

  useEffect(() => {
    if (session?.user?.id && workspaceId) {
      checkPhotoLimit();
    }
  }, [session?.user?.id, workspaceId]);

  const checkPhotoLimit = async () => {
    if (!session?.user?.id || !workspaceId) return;
    
    try {
      const response = await fetch(`/api/user/photo-limit?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setPhotoLimit(data);
      }
    } catch (error) {
      console.error('Error checking photo limit:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !session?.user?.id) return;

    // Check photo limit before uploading
    if (photoLimit && !photoLimit.allowed) {
      setError(`Photo limit reached. You can only have ${photoLimit.limit} photos in this workspace.`);
      return;
    }

    // Check if adding these files would exceed the limit
    if (photoLimit && photoLimit.limit !== -1) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (photoLimit.current + imageFiles.length > photoLimit.limit) {
        setError(`Adding ${imageFiles.length} photos would exceed your limit of ${photoLimit.limit} photos per workspace.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadSuccess(false);
    setError(null);
    setUploadProgress({ current: 0, total: files.length });

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          setUploadProgress({ current: i + 1, total: files.length });
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('userId', session.user.id);
          formData.append('workspaceId', workspaceId);

          const response = await fetch('/api/photos/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }
        }
      }

      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Emit socket event for real-time photo upload notification
      if (socket) {
        socket.emit('uploadPhoto', { 
          workspaceId,
          message: `New photos uploaded by ${session?.user?.name || session?.user?.email}`
        });
      }

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      onUpload?.();
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
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
                You've reached your limit of {photoLimit.limit} photos in this workspace. 
                <a href="/pricing" className="underline hover:no-underline ml-1">
                  Upgrade your plan
                </a> to upload more photos.
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
              {photoLimit.current} of {photoLimit.limit} photos used in this workspace
            </span>
          </p>
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={isUploading || !session?.user || (photoLimit ? !photoLimit.allowed : false)}
        className={`w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          isUploading
            ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
            : uploadSuccess
            ? 'border-green-300 bg-green-50 hover:border-green-400'
            : error
            ? 'border-red-300 bg-red-50 hover:border-red-400'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <>
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-blue-600 font-medium">
                Uploading photos... ({uploadProgress.current}/{uploadProgress.total})
              </p>
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </>
          ) : uploadSuccess ? (
            <>
              <CheckCircle className="w-8 h-8 text-green-500" />
              <p className="text-green-600 font-medium">Photos uploaded successfully!</p>
              <p className="text-sm text-green-600">Page will refresh to show new photos</p>
            </>
          ) : error ? (
            <>
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-red-600 font-medium">Upload failed</p>
              <p className="text-sm text-red-600">{error}</p>
            </>
          ) : (
            <>
              <Plus className="w-8 h-8 text-gray-400" />
              <p className="text-gray-600 font-medium">Click to upload photos</p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, and other image formats • Multiple files allowed
              </p>
            </>
          )}
        </div>
      </button>

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
