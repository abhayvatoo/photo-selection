'use client';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  color: string;
  createdAt: string;
}

export interface ApiPhoto {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  selections: Array<{
    id: string;
    userId: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

class ApiService {
  private baseUrl = '/api';

  async fetchUsers(): Promise<ApiUser[]> {
    const response = await fetch(`${this.baseUrl}/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data.users;
  }

  async createUser(
    name: string,
    email: string,
    color?: string
  ): Promise<ApiUser> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, color }),
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    const data = await response.json();
    return data.user;
  }

  async fetchPhotos(filterUsers?: string[]): Promise<ApiPhoto[]> {
    const params = new URLSearchParams();
    if (filterUsers && filterUsers.length > 0) {
      params.append('filterUsers', filterUsers.join(','));
    }

    const response = await fetch(`${this.baseUrl}/photos?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch photos');
    }

    const data = await response.json();
    return data.photos;
  }

  async uploadPhoto(file: File, userId: string): Promise<ApiPhoto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await fetch(`${this.baseUrl}/photos/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }

    const data = await response.json();
    return data.photo;
  }

  async togglePhotoSelection(
    photoId: string,
    userId: string
  ): Promise<{
    selected: boolean;
    photo: ApiPhoto;
    message: string;
  }> {
    const response = await fetch(`${this.baseUrl}/photos/${photoId}/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle photo selection');
    }

    return response.json();
  }
}

export const apiService = new ApiService();
