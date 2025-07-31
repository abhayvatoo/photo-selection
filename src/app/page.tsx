'use client';

import { useState, useEffect } from 'react';
import { productionPhotoStore, ProductionAppState } from '@/lib/production-store';
import { AppState } from '@/types';
import UserSelector from '@/components/UserSelector';
import FilterPanel from '@/components/FilterPanel';
import PhotoUpload from '@/components/PhotoUpload';
import PhotoGrid from '@/components/PhotoGrid';
import { Camera } from 'lucide-react';

export default function Home() {
  const [state, setState] = useState<ProductionAppState>(productionPhotoStore.getState());

  useEffect(() => {
    const unsubscribe = productionPhotoStore.subscribe(() => {
      setState(productionPhotoStore.getState());
    });
    return unsubscribe;
  }, []);

  const handleUserSelect = (user: any) => {
    productionPhotoStore.setCurrentUser(user);
  };

  const handleFilterChange = (userIds: string[]) => {
    productionPhotoStore.setFilterUsers(userIds);
  };

  const filteredPhotos = productionPhotoStore.getFilteredPhotos();

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Photo Selection App</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Collaborate with your team to select the best photos
          </p>
        </div>

        {/* User Selection */}
        <UserSelector
          users={state.users}
          currentUser={state.currentUser}
          onUserSelect={handleUserSelect}
        />

        {/* Photo Upload */}
        <PhotoUpload />

        {/* Filter Panel */}
        <FilterPanel
          users={state.users}
          filterUsers={state.filterUsers}
          onFilterChange={handleFilterChange}
        />

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{state.photos.length}</p>
              <p className="text-gray-600">Total Photos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{filteredPhotos.length}</p>
              <p className="text-gray-600">Filtered Photos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {state.photos.reduce((acc, photo) => acc + photo.selectedBy.length, 0)}
              </p>
              <p className="text-gray-600">Total Selections</p>
            </div>
          </div>
        </div>

        {/* Photo Grid */}
        {filteredPhotos.length > 0 ? (
          <PhotoGrid
            photos={filteredPhotos}
            currentUser={state.currentUser}
          />
        ) : (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">
              {state.filterUsers.length > 0 ? 'No photos match your filter' : 'No photos yet'}
            </h3>
            <p className="text-gray-400">
              {state.filterUsers.length > 0 
                ? 'Try adjusting your filter or upload some photos'
                : 'Upload some photos to get started'
              }
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
