'use client';

import { Photo, User, AppState } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Load photos from bucket folder for consistent development experience
const loadBucketPhotos = (): Photo[] => {
  // Note: In a client-side component, we can't directly read the filesystem
  // So we'll create an API endpoint to list bucket photos, or use a predefined list
  // For now, using a reasonable default that you can customize

  // You can update this list to match your actual bucket photos
  const bucketPhotos: string[] = [
    // Add your actual photo filenames here
    // Example: 'photo1.jpg', 'photo2.png', 'vacation.jpeg'
  ];

  // If no photos specified, create some placeholder entries
  if (bucketPhotos.length === 0) {
    return Array.from({ length: 6 }, (_, index) => ({
      id: `bucket-${index + 1}`,
      url: `/api/bucket-photos?index=${index}`, // Will serve actual bucket photos
      name: `Photo ${index + 1}`,
      uploadedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
      selectedBy: [],
    }));
  }

  return bucketPhotos.map((filename, index) => ({
    id: `bucket-${index + 1}`,
    url: `/bucket/${filename}`,
    name: filename
      .replace(/\.[^/.]+$/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase()),
    uploadedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
    selectedBy: [],
  }));
};

// Sample photos loaded from bucket folder
const samplePhotos: Photo[] = loadBucketPhotos();

const sampleUsers: User[] = [
  { id: '1', name: 'Alice', color: '#3b82f6' },
  { id: '2', name: 'Bob', color: '#ef4444' },
  { id: '3', name: 'Charlie', color: '#10b981' },
  { id: '4', name: 'Diana', color: '#f59e0b' },
  { id: '5', name: 'Eve', color: '#8b5cf6' },
];

class PhotoStore {
  private state: AppState = {
    photos: [...samplePhotos],
    users: [...sampleUsers],
    currentUser: null,
    selectedPhotos: [],
    filterUsers: [],
  };

  private listeners: Set<() => void> = new Set();

  getState(): AppState {
    return { ...this.state };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  setCurrentUser(user: User) {
    this.state.currentUser = user;
    this.notify();
  }

  togglePhotoSelection(photoId: string) {
    if (!this.state.currentUser) return;

    const photo = this.state.photos.find((p) => p.id === photoId);
    if (!photo) return;

    const userId = this.state.currentUser.id;
    const isSelected = photo.selectedBy.includes(userId);

    if (isSelected) {
      photo.selectedBy = photo.selectedBy.filter((id) => id !== userId);
    } else {
      photo.selectedBy.push(userId);
    }

    this.notify();
  }

  setFilterUsers(userIds: string[]) {
    this.state.filterUsers = userIds;
    this.notify();
  }

  getFilteredPhotos(): Photo[] {
    if (this.state.filterUsers.length === 0) {
      return this.state.photos;
    }

    return this.state.photos.filter((photo) =>
      this.state.filterUsers.some((userId) => photo.selectedBy.includes(userId))
    );
  }

  addPhoto(file: File): Promise<Photo> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photo: Photo = {
          id: uuidv4(),
          url: e.target?.result as string,
          name: file.name,
          uploadedAt: new Date(),
          selectedBy: [],
        };

        this.state.photos.unshift(photo);
        this.notify();
        resolve(photo);
      };
      reader.readAsDataURL(file);
    });
  }

  getUserById(userId: string): User | undefined {
    return this.state.users.find((user) => user.id === userId);
  }
}

export const photoStore = new PhotoStore();
