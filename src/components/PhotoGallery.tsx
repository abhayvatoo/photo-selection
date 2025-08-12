'use client';

import { useState, useEffect } from 'react';
import { Heart, Download, Eye, Loader2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: {
    name: string | null;
    email: string;
  };
  selections: Array<{
    id: string;
    userId: string;
    user: {
      name: string | null;
      email: string;
    };
  }>;
}

interface PhotoGalleryProps {
  workspaceId: string;
  userId: string;
  userRole: string;
  canSelect?: boolean;
}

export default function PhotoGallery({ 
  workspaceId, 
  userId, 
  userRole, 
  canSelect = true 
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [selectingPhoto, setSelectingPhoto] = useState<number | null>(null);

  // Fetch photos for the workspace
  useEffect(() => {
    fetchPhotos();
  }, [workspaceId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/photos/workspace/${workspaceId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      
      const data = await response.json();
      setPhotos(data.photos || []);
      
      // Set initially selected photos
      const initialSelections = new Set<number>();
      data.photos?.forEach((photo: Photo) => {
        const userSelection = photo.selections.find(s => s.userId === userId);
        if (userSelection) {
          initialSelections.add(photo.id);
        }
      });
      setSelectedPhotos(initialSelections);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const togglePhotoSelection = async (photoId: number) => {
    if (!canSelect || selectingPhoto === photoId) return;
    
    setSelectingPhoto(photoId);
    const isSelected = selectedPhotos.has(photoId);
    
    try {
      const response = await fetch(`/api/photos/${photoId}/select`, {
        method: isSelected ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update selection');
      }
      
      // Update local state
      const newSelected = new Set(selectedPhotos);
      if (isSelected) {
        newSelected.delete(photoId);
      } else {
        newSelected.add(photoId);
      }
      setSelectedPhotos(newSelected);
      
    } catch (err) {
      console.error('Selection error:', err);
      // Could add toast notification here
    } finally {
      setSelectingPhoto(null);
    }
  };

  const downloadSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) return;
    
    try {
      const photoIds = Array.from(selectedPhotos);
      const response = await fetch('/api/photos/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to download photos');
      }
      
      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selected-photos-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading photos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">⚠️ {error}</div>
        <button
          onClick={fetchPhotos}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">📷 No photos uploaded yet</div>
        {userRole === 'BUSINESS_OWNER' && (
          <p className="text-sm text-gray-400">
            Upload photos to get started with client selections
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with selection info */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {photos.length} photos • {selectedPhotos.size} selected
        </div>
        
        {canSelect && selectedPhotos.size > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPhotos(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Selection
            </button>
            <button
              onClick={downloadSelectedPhotos}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Download Selected
            </button>
          </div>
        )}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => {
          const isSelected = selectedPhotos.has(photo.id);
          const isSelecting = selectingPhoto === photo.id;
          
          return (
            <div
              key={photo.id}
              className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                isSelected 
                  ? 'ring-4 ring-red-500 ring-opacity-75 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => canSelect && togglePhotoSelection(photo.id)}
            >
              {/* Photo */}
              <div className="aspect-square relative bg-gray-100">
                <Image
                  src={photo.url}
                  alt={photo.originalName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                
                {/* Selection indicator */}
                {canSelect && (
                  <div className="absolute top-2 right-2">
                    {isSelecting ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Heart
                        className={`h-6 w-6 transition-all duration-200 ${
                          isSelected
                            ? 'text-red-500 fill-red-500'
                            : 'text-white opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    )}
                  </div>
                )}
                
                {/* Selection checkmark */}
                {isSelected && (
                  <div className="absolute top-2 left-2">
                    <CheckCircle2 className="h-6 w-6 text-red-500 fill-white" />
                  </div>
                )}
              </div>
              
              {/* Photo info */}
              <div className="p-2 bg-white">
                <div className="text-xs text-gray-500 truncate">
                  {photo.originalName}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(photo.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Selection summary for clients */}
      {canSelect && userRole === 'USER' && selectedPhotos.size > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-green-800 font-medium">
            ✨ You've selected {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''}
          </div>
          <div className="text-green-600 text-sm mt-1">
            Your photographer will be notified of your selections
          </div>
        </div>
      )}
    </div>
  );
}
