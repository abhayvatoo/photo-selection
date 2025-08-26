'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, AlertCircle, Trash2, Download, Filter } from 'lucide-react';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [selectingPhoto, setSelectingPhoto] = useState<number | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNextPage: false,
  });
  const [filterBy, setFilterBy] = useState<'all' | 'selected' | 'unselected'>('all');
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

  // Filter photos by selection status
  const filteredPhotos = useMemo(() => {
    let filtered = photos;

    // Apply selection filter
    if (filterBy === 'selected') {
      filtered = filtered.filter(photo =>
        photo.selections.some(selection => selection.userId === session?.user?.id)
      );
    } else if (filterBy === 'unselected') {
      filtered = filtered.filter(photo =>
        !photo.selections.some(selection => selection.userId === session?.user?.id)
      );
    }

    return filtered;
  }, [photos, filterBy, session?.user?.id]);

  /**
   * Fetches photos for the workspace with pagination support
   */
  const fetchPhotos = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setPhotos([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await fetch(
        `/api/photos/workspace/${workspaceId}?page=${page}&limit=${pagination.limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`);
      }

      const data = await response.json();
      
      if (append && page > 1) {
        setPhotos(prev => [...prev, ...(data.photos || [])]);
      } else {
        setPhotos(data.photos || []);
      }

      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        pages: data.pagination.pages,
        hasNextPage: data.pagination.page < data.pagination.pages,
      });
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [workspaceId, pagination.limit]);

  // Load more photos
  const loadMorePhotos = useCallback(async () => {
    if (pagination.hasNextPage && !loadingMore) {
      await fetchPhotos(pagination.page + 1, true);
    }
  }, [fetchPhotos, pagination.hasNextPage, pagination.page, loadingMore]);

  // Fetch photos when workspace changes
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 // Load when 1000px from bottom
      ) {
        if (pagination.hasNextPage && !loadingMore && !loading) {
          loadMorePhotos();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMorePhotos, pagination.hasNextPage, loadingMore, loading]);

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
      fetchPhotos(1, false);
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

  if (filteredPhotos.length === 0 && photos.length > 0) {
    return (
      <div className="space-y-4">
        {/* Filter Bar */}
        {canSelect && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Photos</option>
                <option value="selected">My Selections</option>
                <option value="unselected">Not Selected</option>
              </select>
            </div>
          </div>
        )}
        
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">🔍 No photos match your filter</div>
          <button 
            onClick={() => { setFilterBy('all'); }}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Clear filter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      {photos.length > 0 && canSelect && (
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Photos</option>
              <option value="selected">My Selections</option>
              <option value="unselected">Not Selected</option>
            </select>
          </div>
        </div>
      )}

      {/* Header with selection info and bulk controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {loading ? 'Loading...' : (
            <>
              {filteredPhotos.length} of {pagination.total} photos
              {selectedPhotos.size > 0 && ` • ${selectedPhotos.size} selected`}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">

          {canSelect && photos.length > 0 && (
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

          {canSelect && selectedPhotos.size > 0 && (
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
        {filteredPhotos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            userId={userId}
            canSelect={canSelect}
            canManage={canManage}
            isSelected={selectedPhotos.has(photo.id)}
            isSelecting={selectingPhoto === photo.id}
            onSelect={togglePhotoSelection}
            onPreview={handlePhotoPreview}
            onDownload={handlePhotoDownload}
            onDelete={canManage ? handleDeletePhoto : undefined}
          />
        ))}
      </div>

      {/* Load More / Loading Indicator */}
      {!loading && photos.length > 0 && (
        <div className="flex flex-col items-center gap-4 py-8">
          {loadingMore && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more photos...</span>
            </div>
          )}
          
          {pagination.hasNextPage && !loadingMore && (
            <button
              onClick={loadMorePhotos}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Load More Photos ({pagination.total - photos.length} remaining)
            </button>
          )}
          
          {!pagination.hasNextPage && photos.length > 0 && photos.length < pagination.total && (
            <div className="text-sm text-gray-500">
              All photos loaded ({pagination.total} total)
            </div>
          )}
        </div>
      )}

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
            ✨ You&apos;ve selected {selectedPhotos.size} photo
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
