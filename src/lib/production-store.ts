'use client';

import { apiService, ApiPhoto, ApiUser } from './api';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from './socket-server';

export interface ProductionAppState {
  photos: ApiPhoto[];
  users: ApiUser[];
  currentUser: ApiUser | null;
  filterUsers: string[];
  loading: boolean;
  error: string | null;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  // Pagination state
  currentPage: number;
  pageSize: number;
  hasMorePhotos: boolean;
  isLoadingMore: boolean;
  totalPhotos: number;
}

class ProductionPhotoStore {
  private state: ProductionAppState = {
    photos: [],
    users: [],
    currentUser: null,
    filterUsers: [],
    loading: false,
    error: null,
    socket: null,
    // Pagination state
    currentPage: 1,
    pageSize: 30, // Mobile-optimized: 30 photos initial load
    hasMorePhotos: true,
    isLoadingMore: false,
    totalPhotos: 0,
  };

  private listeners: Set<() => void> = new Set();

  getState(): ProductionAppState {
    return { ...this.state };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  private setLoading(loading: boolean) {
    this.state.loading = loading;
    this.notify();
  }

  private setError(error: string | null) {
    this.state.error = error;
    this.notify();
  }

  setSocket(socket: Socket<ServerToClientEvents, ClientToServerEvents> | null) {
    this.state.socket = socket;
    
    if (socket) {
      // Set up socket event listeners
      socket.on('photoSelected', (data) => {
        this.handlePhotoSelectionUpdate(data);
      });

      socket.on('photoUploaded', (data) => {
        this.handlePhotoUpload(data.photo);
      });

      socket.on('userConnected', (data) => {
        console.log(`User ${data.userName} connected`);
      });

      socket.on('userDisconnected', (data) => {
        console.log(`User disconnected: ${data.userId}`);
      });
    }
    
    this.notify();
  }

  private handlePhotoSelectionUpdate(data: {
    photoId: string;
    userId: string;
    userName: string;
    selected: boolean;
  }) {
    const photoIndex = this.state.photos.findIndex(p => p.id === parseInt(data.photoId));
    if (photoIndex === -1) return;

    const photo = { ...this.state.photos[photoIndex] };
    
    if (data.selected) {
      // Add selection if not already present
      const existingSelection = photo.selections.find(s => s.userId === data.userId);
      if (!existingSelection) {
        const user = this.state.users.find(u => u.id === data.userId);
        if (user) {
          photo.selections.push({
            id: `temp-${Date.now()}`,
            userId: data.userId,
            createdAt: new Date().toISOString(),
            user: {
              id: user.id,
              name: user.name,
              color: user.color,
            },
          });
        }
      }
    } else {
      // Remove selection
      photo.selections = photo.selections.filter(s => s.userId !== data.userId);
    }

    this.state.photos[photoIndex] = photo;
    this.notify();
  }

  private handlePhotoUpload(photo: ApiPhoto) {
    this.state.photos.unshift(photo);
    this.notify();
  }

  async loadUsers() {
    try {
      this.setLoading(true);
      this.setError(null);
      const users = await apiService.fetchUsers();
      this.state.users = users;
      this.notify();
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      this.setLoading(false);
    }
  }

  async createUser(name: string, email: string, color?: string): Promise<ApiUser> {
    try {
      this.setError(null);
      const user = await apiService.createUser(name, email, color);
      
      // Add to users list if not already present
      const existingIndex = this.state.users.findIndex(u => u.id === user.id);
      if (existingIndex === -1) {
        this.state.users.push(user);
        this.notify();
      }
      
      return user;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Failed to create user');
      throw error;
    }
  }

  setCurrentUser(user: ApiUser) {
    this.state.currentUser = user;
    this.notify();
  }

  async loadPhotos() {
    try {
      this.setLoading(true);
      this.setError(null);
      const photos = await apiService.fetchPhotos();
      this.state.photos = photos;
      this.notify();
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Failed to load photos');
    } finally {
      this.setLoading(false);
    }
  }

  async uploadPhoto(file: File): Promise<void> {
    if (!this.state.currentUser) {
      throw new Error('No user selected');
    }

    try {
      this.setError(null);
      const photo = await apiService.uploadPhoto(file, this.state.currentUser.id);
      
      // Add to photos list
      this.state.photos.unshift(photo);
      
      // Emit to socket for real-time updates
      if (this.state.socket) {
        this.state.socket.emit('uploadPhoto', { photo });
      }
      
      this.notify();
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Failed to upload photo');
      throw error;
    }
  }

  async togglePhotoSelection(photoId: string): Promise<void> {
    if (!this.state.currentUser) return;

    try {
      this.setError(null);
      const result = await apiService.togglePhotoSelection(photoId, this.state.currentUser.id);
      
      // Update local state
      const photoIndex = this.state.photos.findIndex(p => p.id === parseInt(photoId));
      if (photoIndex !== -1) {
        this.state.photos[photoIndex] = result.photo;
      }
      
      // Emit to socket for real-time updates
      if (this.state.socket) {
        this.state.socket.emit('selectPhoto', {
          photoId,
          userId: this.state.currentUser.id,
        });
      }
      
      this.notify();
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Failed to toggle photo selection');
    }
  }

  setFilterUsers(userIds: string[]) {
    this.state.filterUsers = userIds;
    this.notify();
    // No need to reload photos - filtering is done client-side in getFilteredPhotos()
  }

  getFilteredPhotos(): ApiPhoto[] {
    if (this.state.filterUsers.length === 0) {
      return this.state.photos;
    }

    return this.state.photos.filter(photo =>
      this.state.filterUsers.every(userId =>
        photo.selections.some(selection => selection.userId === userId)
      )
    );
  }

  getUserById(userId: string): ApiUser | undefined {
    return this.state.users.find(user => user.id === userId);
  }

  // Pagination methods
  async loadMorePhotos(): Promise<void> {
    if (this.state.isLoadingMore || !this.state.hasMorePhotos) {
      return;
    }

    this.state.isLoadingMore = true;
    this.listeners.forEach(listener => listener());

    try {
      const nextPage = this.state.currentPage + 1;
      const response = await fetch(`/api/photos?page=${nextPage}&limit=${this.state.pageSize}&filterUsers=${this.state.filterUsers.join(',')}`);
      
      if (!response.ok) {
        throw new Error('Failed to load more photos');
      }

      const data = await response.json();
      
      // Append new photos to existing ones
      this.state.photos = [...this.state.photos, ...data.photos];
      this.state.currentPage = nextPage;
      this.state.totalPhotos = data.total;
      this.state.hasMorePhotos = this.state.photos.length < data.total;
      
    } catch (error) {
      console.error('Failed to load more photos:', error);
      this.state.error = error instanceof Error ? error.message : 'Failed to load more photos';
    } finally {
      this.state.isLoadingMore = false;
      this.listeners.forEach(listener => listener());
    }
  }

  resetPagination(): void {
    this.state.currentPage = 1;
    this.state.hasMorePhotos = true;
    this.state.isLoadingMore = false;
    this.state.photos = [];
    this.listeners.forEach(listener => listener());
  }

  getPaginatedPhotos(): ApiPhoto[] {
    // Return filtered photos for current pagination state
    const filteredPhotos = this.getFilteredPhotos();
    return filteredPhotos;
  }
}

export const productionPhotoStore = new ProductionPhotoStore();
