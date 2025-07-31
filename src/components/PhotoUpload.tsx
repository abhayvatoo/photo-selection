'use client';

import { useRef } from 'react';
import { Upload, Plus } from 'lucide-react';
import { photoStore } from '@/lib/store';

interface PhotoUploadProps {
  onUpload?: () => void;
}

export default function PhotoUpload({ onUpload }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

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

    onUpload?.();
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
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
      >
        <div className="flex flex-col items-center gap-2">
          <Plus className="w-8 h-8 text-gray-400" />
          <p className="text-gray-600 font-medium">Click to upload photos</p>
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
