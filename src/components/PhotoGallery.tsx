'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, AlertCircle, X, Trash2, Download } from 'lucide-react';
import { UserRole } from '@prisma/client';
import { io, Socket } from 'socket.io-client';
import PhotoCard from './PhotoCard';
import PhotoPreviewModal from './PhotoPreviewModal';
import PhotoGalleryToolbar from './PhotoGalleryToolbar';
import ErrorBoundary from './ErrorBoundary';
import { PAGINATION, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { useToast } from '@/hooks/useToast';
import { csrfPostJSON, csrfDelete } from '@/lib/csrf-fetch';

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
  canSelect = true,
}: PhotoGalleryProps) {
  const { data: session } = useSession();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [selectingPhoto, setSelectingPhoto] = useState<number | null>(null);
  const [managementMode, setManagementMode] = useState(false);
  const [deletingPhotos, setDeletingPhotos] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const { showToast } = useToast();

  // Initialize Socket.io connection
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const newSocket = io({
        query: {
          userId: session.user.id,
          userName: session.user.name || session.user.email || 'Unknown',
        },
      });
      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [session?.user?.id, session?.user?.name, session?.user?.email]);

  // Memoized computed values for performance
  const canManage = useMemo(
    () =>
      userRole === 'SUPER_ADMIN' ||
      userRole === 'BUSINESS_OWNER' ||
      userRole === 'STAFF',
    [userRole]
  );

  /**
   * Fetches photos for the workspace with error handling
   */
  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/photos/workspace/${workspaceId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`);
      }

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Fetch photos when workspace changes
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Socket.io event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for photo selection updates from other users
    socket.on('photoSelected', (data) => {
      const { photoId, userId: selectingUserId, userName, selected } = data;

      // Update photos state to reflect the selection change
      setPhotos((prevPhotos) =>
        prevPhotos.map((photo) => {
          if (photo.id === parseInt(photoId)) {
            const updatedSelections = [...photo.selections];

            if (selected) {
              // Add selection if it doesn't exist
              const existingIndex = updatedSelections.findIndex(
                (s) => s.userId === selectingUserId
              );
              if (existingIndex === -1) {
                updatedSelections.push({
                  id: `temp-${Date.now()}`, // Temporary ID
                  userId: selectingUserId,
                  user: { name: userName, email: '' },
                });
              }
            } else {
              // Remove selection
              const filteredSelections = updatedSelections.filter(
                (s) => s.userId !== selectingUserId
              );
              return { ...photo, selections: filteredSelections };
            }

            return { ...photo, selections: updatedSelections };
          }
          return photo;
        })
      );

      // Update selectedPhotos state if it's the current user
      if (selectingUserId === session?.user?.id) {
        setSelectedPhotos((prev) => {
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
  }, [socket, session?.user?.id, fetchPhotos]);

  const togglePhotoSelection = async (photoId: number) => {
    if (!canSelect || selectingPhoto === photoId) return;

    setSelectingPhoto(photoId);
    const isSelected = selectedPhotos.has(photoId);

    try {
      // Emit socket event for real-time updates
      if (socket && session?.user?.id) {
        socket.emit('selectPhoto', {
          photoId: photoId.toString(),
          userId: session.user.id,
        });
      }

      const response = isSelected 
        ? await csrfDelete(`/api/photos/${photoId}/select`)
        : await csrfPostJSON(`/api/photos/${photoId}/select`, {});

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
    const allPhotoIds = new Set(photos.map((photo) => photo.id));
    setSelectedPhotos(allPhotoIds);
  };

  const deselectAllPhotos = () => {
    setSelectedPhotos(new Set());
  };

  const downloadSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) return;

    try {
      const response = await csrfPostJSON('/api/photos/download', {
        photoIds: Array.from(selectedPhotos),
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

    if (
      !confirm(
        `Are you sure you want to delete ${selectedPhotos.size} selected photos? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingPhotos(true);

    try {
      const response = await csrfDelete('/api/photos/bulk-delete', {
        body: JSON.stringify({ photoIds: Array.from(selectedPhotos) })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      const result = await response.json();

      // Remove deleted photos from local state
      setPhotos((prevPhotos) =>
        prevPhotos.filter((photo) => !selectedPhotos.has(photo.id))
      );

      // Clear selection
      setSelectedPhotos(new Set());
      setManagementMode(false);

      // Show success message
      showToast(`Successfully deleted ${result.deletedCount} photos`, 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete photos', 'error');
    } finally {
      setDeletingPhotos(false);
    }
  };


  const handleDeletePhoto = useCallback(
    async (photoId: number) => {
      if (!confirm('Are you sure you want to delete this photo?')) {
        return;
      }

      try {
        const response = await csrfDelete(`/api/photos/${photoId}/delete`);

        if (!response.ok) {
          throw new Error('Failed to delete photo');
        }

        setPhotos((prevPhotos) =>
          prevPhotos.filter((photo) => photo.id !== photoId)
        );
      } catch (err) {
        console.error('Error deleting photo:', err);
      }
    },
    []
  );

  const handleTogglePhotoSelection = useCallback((photoId: number) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handles photo preview modal
   */
  const handlePhotoPreview = useCallback((photo: Photo) => {
    setPreviewPhoto(photo);
    setIsPreviewOpen(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewPhoto(null);
  }, []);

  /**
   * Handles photo download
   */
  const handlePhotoDownload = useCallback(
    async (photo: Photo) => {
      try {
        const response = await csrfPostJSON('/api/photos/download', { 
          photoIds: [photo.id] 
        });

        if (!response.ok) {
          throw new Error('Failed to download photo');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = photo.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Error downloading photo:', err);
      }
    },
    []
  );

  /**
   * Handles photo selection for regular users
   */
  const handlePhotoSelect = useCallback(
    async (photoId: number) => {
      if (!canSelect || isSelecting) return;

      setIsSelecting(true);
      try {
        const response = await csrfPostJSON(`/api/photos/${photoId}/select`, {});

        if (!response.ok) {
          throw new Error('Failed to select photo');
        }

        // Update local state - the socket will handle real-time updates
        setPhotos((prevPhotos) =>
          prevPhotos.map((photo) =>
            photo.id === photoId
              ? {
                  ...photo,
                  selections: photo.selections.some(
                    (s) => s.userId === session?.user?.id
                  )
                    ? photo.selections.filter(
                        (s) => s.userId !== session?.user?.id
                      )
                    : [
                        ...photo.selections,
                        {
                          id: `temp-${Date.now()}`,
                          userId: session?.user?.id || '',
                          user: {
                            name: session?.user?.name || null,
                            email: session?.user?.email || '',
                          },
                        },
                      ],
                }
              : photo
          )
        );
      } catch (err) {
        console.error('Error selecting photo:', err);
      } finally {
        setIsSelecting(false);
      }
    },
    [
      canSelect,
      isSelecting,
      session?.user?.id,
      session?.user?.name,
      session?.user?.email,
    ]
  );

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
        {(userRole === 'BUSINESS_OWNER' || userRole === 'STAFF') && (
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
              {deletingPhotos
                ? 'Deleting...'
                : `Delete Selected (${selectedPhotos.size})`}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            userId={userId}
            canSelect={canSelect}
            canManage={canManage}
            managementMode={managementMode}
            isSelected={selectedPhotos.has(photo.id)}
            isSelecting={selectingPhoto === photo.id}
            onSelect={togglePhotoSelection}
            onToggleSelection={handleTogglePhotoSelection}
            onPreview={handlePhotoPreview}
            onDownload={handlePhotoDownload}
            onDelete={canManage ? handleDeletePhoto : undefined}
          />
        ))}
      </div>

      {/* Photo Preview Modal */}
      <PhotoPreviewModal
        photo={previewPhoto}
        isOpen={isPreviewOpen}
        userId={userId}
        canSelect={canSelect}
        isSelecting={selectingPhoto === previewPhoto?.id}
        onClose={handleClosePreview}
        onSelect={handlePhotoSelect}
        onDownload={handlePhotoDownload}
      />

      {/* Selection summary for clients */}
      {canSelect && userRole === 'USER' && selectedPhotos.size > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-green-800 font-medium">
            ✨ You've selected {selectedPhotos.size} photo
            {selectedPhotos.size !== 1 ? 's' : ''}
          </div>
          <div className="text-green-600 text-sm mt-1">
            Your photographer will be notified of your selections
          </div>
        </div>
      )}
    </div>
  );
}
