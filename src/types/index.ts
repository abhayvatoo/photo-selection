export interface Photo {
  id: string;
  url: string;
  name: string;
  uploadedAt: Date;
  selectedBy: string[];
}

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface PhotoSelection {
  photoId: string;
  userId: string;
  selectedAt: Date;
}

export interface AppState {
  photos: Photo[];
  users: User[];
  currentUser: User | null;
  selectedPhotos: string[];
  filterUsers: string[];
}
