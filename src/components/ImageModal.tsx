'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { ApiPhoto } from '@/lib/api';

interface ImageModalProps {
  photo: ApiPhoto | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageModal({ photo, isOpen, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
        aria-label="Close image"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image container */}
      <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center">
        <Image
          src={photo.url}
          alt={photo.filename}
          fill
          className="object-contain"
          quality={90}
          priority
        />
      </div>

      {/* Photo info overlay */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="bg-black bg-opacity-50 rounded-lg p-4 backdrop-blur-sm">
          <h3 className="text-white text-lg font-medium mb-2">{photo.originalName}</h3>
          {photo.selections.length > 0 && (
            <div className="flex justify-center gap-2">
              <span className="text-gray-300 text-sm">Selected by:</span>
              <div className="flex gap-1">
                {photo.selections.map((selection) => {
                  const initials = selection.user.name
                    .split(' ')
                    .map(name => name.charAt(0).toUpperCase())
                    .slice(0, 2)
                    .join('');
                  
                  return (
                    <span
                      key={selection.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: selection.user.color }}
                    >
                      {initials} {selection.user.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
        aria-label="Close image"
      />
    </div>
  );
}
