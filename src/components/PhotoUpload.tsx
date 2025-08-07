'use client';

import { useRef, useState } from 'react';
import { Upload, Plus, CheckCircle } from 'lucide-react';
import { photoStore } from '@/lib/store';

interface PhotoUploadProps {
  onUpload?: () => void;
}

export default function PhotoUpload({ onUpload }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          await photoStore.addPhoto(file);
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
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Upload className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">Upload Photos</h3>
      </div>
      
      <button
        onClick={handleClick}
        disabled={isUploading}
        className={`w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          isUploading
            ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
            : uploadSuccess
            ? 'border-green-300 bg-green-50 hover:border-green-400'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <>
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-blue-600 font-medium">Uploading photos...</p>
            </>
          ) : uploadSuccess ? (
            <>
              <CheckCircle className="w-8 h-8 text-green-500" />
              <p className="text-green-600 font-medium">Photos uploaded successfully!</p>
            </>
          ) : (
            <>
              <Plus className="w-8 h-8 text-gray-400" />
              <p className="text-gray-600 font-medium">Click to upload photos</p>
            </>
          )}
          <p className="text-sm text-gray-500">Supports multiple file selection</p>
        </div>
      </button>

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
