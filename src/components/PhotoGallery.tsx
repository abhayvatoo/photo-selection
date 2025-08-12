'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Download, AlertCircle, Loader2, CheckCircle2, Eye, Trash2, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
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
  const { data: session } = useSession();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [selectingPhoto, setSelectingPhoto] = useState<number | null>(null);
  const [managementMode, setManagementMode] = useState(false);
  const [deletingPhotos, setDeletingPhotos] = useState(false);
  
  // Initialize Socket.io connection
  const socket = useSocket(session?.user?.id, session?.user?.name || session?.user?.email || 'Unknown');
  
  // Check if user can manage photos (delete, organize)
  const canManage = userRole === 'SUPER_ADMIN' || userRole === 'BUSINESS_OWNER';

  // Fetch photos for the workspace
  useEffect(() => {
    fetchPhotos();
  }, [workspaceId]);

  // Socket.io event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for photo selection updates from other users
    socket.on('photoSelected', (data) => {
      const { photoId, userId: selectingUserId, userName, selected } = data;
      
      // Update photos state to reflect the selection change
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => {
          if (photo.id === parseInt(photoId)) {
            const updatedSelections = [...photo.selections];
            
            if (selected) {
              // Add selection if it doesn't exist
              const existingIndex = updatedSelections.findIndex(s => s.userId === selectingUserId);
              if (existingIndex === -1) {
                updatedSelections.push({
                  id: `temp-${Date.now()}`, // Temporary ID
                  userId: selectingUserId,
                  user: { name: userName, email: '' }
                });
              }
            } else {
              // Remove selection
              const filteredSelections = updatedSelections.filter(s => s.userId !== selectingUserId);
              return { ...photo, selections: filteredSelections };
            }
            
            return { ...photo, selections: updatedSelections };
          }
          return photo;
        })
      );

      // Update selectedPhotos state if it's the current user
      if (selectingUserId === session?.user?.id) {
        setSelectedPhotos(prev => {
          const newSet = new Set(prev);
          if (selected) {
            newSet.add(parseInt(photoId));
          } else {
            newSet.delete(parseInt(photoId));
          }
          return newSet;
        });
      }
    });

    // Listen for photo upload notifications
    socket.on('photoUploaded', (data) => {
      // Refresh photos when new ones are uploaded
      fetchPhotos();
    });

    // Cleanup listeners
    return () => {
      socket.off('photoSelected');
      socket.off('photoUploaded');
    };
  }, [socket, session?.user?.id]);

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
      // Emit socket event for real-time updates
      if (socket && session?.user?.id) {
        socket.emit('selectPhoto', { 
          photoId: photoId.toString(), 
          userId: session.user.id 
        });
      }
      
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

  const selectAllPhotos = () => {
    const allPhotoIds = new Set(photos.map(photo => photo.id));
    setSelectedPhotos(allPhotoIds);
  };

  const deselectAllPhotos = () => {
    setSelectedPhotos(new Set());
  };

  const downloadSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) return;
    
    try {
      const response = await fetch('/api/photos/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoIds: Array.from(selectedPhotos),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      // Handle ZIP download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selected-photos-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.size === 0 || !canManage) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedPhotos.size} selected photos? This action cannot be undone.`)) {
      return;
    }
    
    setDeletingPhotos(true);
    
    try {
      const response = await fetch('/api/photos/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoIds: Array.from(selectedPhotos),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }
      
      const result = await response.json();
      
      // Remove deleted photos from local state
      setPhotos(prevPhotos => 
        prevPhotos.filter(photo => !selectedPhotos.has(photo.id))
      );
      
      // Clear selection
      setSelectedPhotos(new Set());
      setManagementMode(false);
      
      // Show success message
      alert(`Successfully deleted ${result.deletedCount} photos`);
      
    } catch (err) {
      console.error('Delete error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete photos');
    } finally {
      setDeletingPhotos(false);
    }
  };

  const deletePhoto = async (photoId: number) => {
    if (!canManage) return;
    
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/photos/${photoId}/delete`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }
      
      // Remove photo from local state
      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
      
      // Remove from selection if selected
      setSelectedPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
      
    } catch (err) {
      console.error('Delete error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete photo');
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
      {/* Header with selection info and bulk controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {photos.length} photos • {selectedPhotos.size} selected
        </div>
        
        <div className="flex items-center gap-2">
          {canManage && photos.length > 0 && (
            <button
              onClick={() => setManagementMode(!managementMode)}
              className={`text-sm px-3 py-1 rounded ${
                managementMode 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {managementMode ? (
                <>
                  <X className="h-4 w-4 inline mr-1" />
                  Exit Management
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 inline mr-1" />
                  Manage Photos
                </>
              )}
            </button>
          )}
          
          {canSelect && photos.length > 0 && !managementMode && (
            <>
              <button
                onClick={selectAllPhotos}
                className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded"
              >
                Select All
              </button>
              {selectedPhotos.size > 0 && (
                <button
                  onClick={deselectAllPhotos}
                  className="text-sm text-gray-600 hover:text-gray-700 px-2 py-1 rounded"
                >
                  Deselect All
                </button>
              )}
            </>
          )}
          
          {managementMode && selectedPhotos.size > 0 && (
            <button
              onClick={deleteSelectedPhotos}
              disabled={deletingPhotos}
              className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deletingPhotos ? 'Deleting...' : `Delete Selected (${selectedPhotos.size})`}
            </button>
          )}
          
          {canSelect && selectedPhotos.size > 0 && !managementMode && (
            <button
              onClick={downloadSelectedPhotos}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Download Selected
            </button>
          )}
        </div>
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
                
                {/* Selection indicator or delete button */}
                {managementMode && canManage ? (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto(photo.id);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : canSelect && (
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
