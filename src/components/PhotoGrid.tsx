'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ApiPhoto, ApiUser } from '@/lib/api';
import { productionPhotoStore } from '@/lib/production-store';

interface PhotoGridProps {
  photos: ApiPhoto[];
  currentUser: ApiUser | null;
}

export default function PhotoGrid({ photos, currentUser }: PhotoGridProps) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = productionPhotoStore.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  const handlePhotoClick = (photoId: string) => {
    if (currentUser) {
      productionPhotoStore.togglePhotoSelection(photoId);
    }
  };

  const getUserColor = (userId: string): string => {
    const user = productionPhotoStore.getUserById(userId);
    return user?.color || '#gray';
  };

  const isPhotoSelectedByUser = (photo: ApiPhoto, userId: string): boolean => {
    return photo.selections.some(selection => selection.userId === userId);
  };

  return (
    <div className="photo-grid">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className={`photo-card ${
            currentUser && isPhotoSelectedByUser(photo, currentUser.id)
              ? 'photo-selected'
              : ''
          }`}
          onClick={() => handlePhotoClick(photo.id.toString())}
        >
          <Image
            src={photo.url}
            alt={photo.filename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Selection indicators */}
          {photo.selections.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {photo.selections.map((selection) => {
                return (
                  <div
                    key={selection.id}
                    className="w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: selection.user.color }}
                    title={selection.user.name}
                  />
                );
              })}
            </div>
          )}

          {/* Photo name overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-white text-sm font-medium truncate">
              {photo.originalName}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
