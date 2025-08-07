'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ApiPhoto, ApiUser } from '@/lib/api';
import { productionPhotoStore } from '@/lib/production-store';
import ImageModal from './ImageModal';

// Simple placeholder image as base64 data URL
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTIwIiByPSIzMCIgZmlsbD0iI2Q1ZDlkZiIvPgogIDxwYXRoIGQ9Im0xNzAgMTUwIDMwLTMwIDMwIDMwIDMwLTMwdjYwaC05MHoiIGZpbGw9IiNkNWQ5ZGYiLz4KICA8dGV4dCB4PSIyMDAiIHk9IjIyMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxvYWRpbmcuLi48L3RleHQ+Cjwvc3ZnPgo=';

interface PhotoGridProps {
  photos: ApiPhoto[];
  currentUser: ApiUser | null;
}

export default function PhotoGrid({ photos, currentUser }: PhotoGridProps) {
  const [, forceUpdate] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState<ApiPhoto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = productionPhotoStore.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  const handlePhotoClick = (photo: ApiPhoto) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleSelectToggle = (photoId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal when clicking select button
    if (currentUser) {
      productionPhotoStore.togglePhotoSelection(photoId.toString());
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  const getUserColor = (userId: string): string => {
    const user = productionPhotoStore.getUserById(userId);
    return user?.color || '#gray';
  };

  const isPhotoSelectedByUser = (photo: ApiPhoto, userId: string): boolean => {
    return photo.selections.some(selection => selection.userId === userId);
  };

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`photo-card cursor-pointer group ${
              currentUser && isPhotoSelectedByUser(photo, currentUser.id)
                ? 'photo-selected'
                : ''
            }`}
            onClick={() => handlePhotoClick(photo)}
          >
          <Image
            src={photo.url}
            alt={photo.filename}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL={PLACEHOLDER_IMAGE}
            loading="lazy"
            quality={75}
          />
          
          {/* Selection indicators */}
          {photo.selections.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {photo.selections.map((selection) => {
                const initials = selection.user.name
                  .split(' ')
                  .map(name => name.charAt(0).toUpperCase())
                  .slice(0, 2)
                  .join('');
                
                return (
                  <div
                    key={selection.id}
                    className="min-w-[28px] h-7 px-2 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white backdrop-blur-sm"
                    style={{ backgroundColor: selection.user.color }}
                    title={selection.user.name}
                  >
                    {initials}
                  </div>
                );
              })}
            </div>
          )}

          {/* Select/Unselect Button - Simple and Always Visible */}
          {currentUser && (
            <button
              onClick={(e) => handleSelectToggle(photo.id, e)}
              className={`absolute bottom-2 right-2 w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-20 ${
                isPhotoSelectedByUser(photo, currentUser.id)
                  ? 'bg-green-500 text-white'
                  : 'bg-white bg-opacity-90 text-gray-600 hover:bg-white'
              }`}
              title={isPhotoSelectedByUser(photo, currentUser.id) ? 'Unselect photo' : 'Select photo'}
            >
              {isPhotoSelectedByUser(photo, currentUser.id) ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
          )}

          </div>
        ))}
      </div>
      
      {/* Full-screen Image Modal */}
      <ImageModal 
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
}
