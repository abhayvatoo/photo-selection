'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Photo, User } from '@/types';
import { photoStore } from '@/lib/store';

interface PhotoGridProps {
  photos: Photo[];
  currentUser: User | null;
}

export default function PhotoGrid({ photos, currentUser }: PhotoGridProps) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = photoStore.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  const handlePhotoClick = (photoId: string) => {
    if (currentUser) {
      photoStore.togglePhotoSelection(photoId);
    }
  };

  const getUserColor = (userId: string): string => {
    const user = photoStore.getUserById(userId);
    return user?.color || '#gray';
  };

  return (
    <div className="photo-grid">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className={`photo-card ${
            currentUser && photo.selectedBy.includes(currentUser.id)
              ? 'photo-selected'
              : ''
          }`}
          onClick={() => handlePhotoClick(photo.id)}
        >
          <Image
            src={photo.url}
            alt={photo.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Selection indicators */}
          {photo.selectedBy.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {photo.selectedBy.map((userId) => {
                const user = photoStore.getUserById(userId);
                return (
                  <div
                    key={userId}
                    className="w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: getUserColor(userId) }}
                    title={user?.name || 'Unknown User'}
                  />
                );
              })}
            </div>
          )}

          {/* Photo name overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-white text-sm font-medium truncate">
              {photo.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
