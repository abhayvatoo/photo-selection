'use client';

import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, Plus, CheckCircle, AlertCircle } from 'lucide-react';

interface PhotoUploadProps {
  workspaceId: string;
  onUpload?: () => void;
}

export default function PhotoUpload({ workspaceId, onUpload }: PhotoUploadProps) {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !session?.user?.id) return;

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
      <button
        onClick={handleClick}
        disabled={isUploading || !session?.user}
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
