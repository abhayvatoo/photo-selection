'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { ApiPhoto, ApiUser } from '@/lib/api';
import { productionPhotoStore } from '@/lib/production-store';

interface ImageModalProps {
  photo: ApiPhoto | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: ApiUser | null;
}

export default function ImageModal({ photo, isOpen, onClose, currentUser }: ImageModalProps) {
  const [, forceUpdate] = useState({});

  // Subscribe to store updates to reflect selection changes
  useEffect(() => {
    const unsubscribe = productionPhotoStore.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  const handleSelectToggle = (photoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser) {
      productionPhotoStore.togglePhotoSelection(photoId.toString());
    }
  };

  const isPhotoSelectedByUser = (photo: ApiPhoto, userId: string): boolean => {
    return photo.selections.some(selection => selection.userId === userId);
  };

  // Get current photo data from store to ensure we have latest selection state
  const getCurrentPhoto = (): ApiPhoto | null => {
    if (!photo) return null;
    const state = productionPhotoStore.getState();
    return state.photos.find(p => p.id === photo.id) || photo;
  };

  const currentPhoto = getCurrentPhoto();

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

  if (!isOpen || !currentPhoto) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
        aria-label="Close image"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Select/Unselect Button - Enhanced */}
      {currentUser && (
        <button
          onClick={(e) => handleSelectToggle(currentPhoto.id, e)}
          className={`absolute top-4 left-4 w-14 h-14 md:w-12 md:h-12 rounded-full border-2 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-10 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            isPhotoSelectedByUser(currentPhoto, currentUser.id)
              ? 'bg-green-500 text-white border-green-600 hover:bg-green-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }`}
          title={isPhotoSelectedByUser(currentPhoto, currentUser.id) ? 'Unselect photo' : 'Select photo'}
          aria-label={isPhotoSelectedByUser(currentPhoto, currentUser.id) ? 'Unselect photo' : 'Select photo'}
        >
          {isPhotoSelectedByUser(currentPhoto, currentUser.id) ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>
      )}

      {/* Image */}
      <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center">
        <Image
          src={currentPhoto.url}
          alt={currentPhoto.filename}
          fill
          className="object-contain"
          quality={90}
          priority
        />
      </div>

      {/* Photo info overlay */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="bg-black bg-opacity-50 rounded-lg p-4 backdrop-blur-sm">
          <h3 className="text-white text-lg font-medium mb-2">{currentPhoto.originalName}</h3>
          {currentPhoto.selections.length > 0 && (
            <div className="flex justify-center gap-2">
              <span className="text-gray-300 text-sm">Selected by:</span>
              <div className="flex gap-1">
                {currentPhoto.selections.map((selection) => {
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
