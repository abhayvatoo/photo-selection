'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Camera, Upload, Settings } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user?.workspaceSlug) {
      // Redirect authenticated users to their workspace
      router.push(`/workspace/${session.user.workspaceSlug}`);
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Camera className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to PhotoSelect</h1>
            <p className="text-gray-600 mb-6">Sign in to access your photo workspace</p>
            <Link
              href="/auth/signin"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const user = session.user;
  const isAdmin = user.role === 'ADMIN';
  const canUpload = user.role === 'ADMIN' || user.role === 'PHOTOGRAPHER';

  const [state, setState] = useState<ProductionAppState>(productionPhotoStore.getState());

  useEffect(() => {
    const unsubscribe = productionPhotoStore.subscribe(() => {
      setState(productionPhotoStore.getState());
    });
    return unsubscribe;
  }, []);

  // Load initial data from database
  useEffect(() => {
    productionPhotoStore.loadUsers();
    productionPhotoStore.loadPhotos();
  }, []);

  const handleUserSelect = (user: any) => {
    productionPhotoStore.setCurrentUser(user);
  };

  const handleFilterChange = (userIds: string[]) => {
    productionPhotoStore.setFilterUsers(userIds);
  };

  const filteredPhotos = productionPhotoStore.getFilteredPhotos();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {user.name || user.email}
          </h1>
          <p className="text-xl text-gray-600">
            What would you like to do today?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* View Photos */}
          {user.workspaceSlug && (
            <Link
              href={`/workspace/${user.workspaceSlug}`}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Camera className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">View Photos</h3>
              </div>
              <p className="text-gray-600">
                Browse and select photos in your workspace
              </p>
            </Link>
          )}

          {/* Upload Photos */}
          {canUpload && (
            <Link
              href="/upload"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Upload className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Upload Photos</h3>
              </div>
              <p className="text-gray-600">
                Add new photos to your workspace
              </p>
            </Link>
          )}

          {/* Admin Dashboard */}
          {isAdmin && (
            <Link
              href="/admin"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Admin Dashboard</h3>
              </div>
              <p className="text-gray-600">
                Manage workspaces and users
              </p>
            </Link>
          )}
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Role</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'ADMIN' 
                  ? 'bg-red-100 text-red-800'
                  : user.role === 'PHOTOGRAPHER'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {user.role?.toLowerCase()}
              </span>
            </div>
            {user.workspaceSlug && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Workspace</h3>
                <Link
                  href={`/workspace/${user.workspaceSlug}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  /{user.workspaceSlug}
                </Link>
              </div>
            )}
          </div>
        </div>

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
                {state.photos.reduce((acc, photo) => acc + photo.selections.length, 0)}
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
  </div>
  );
}
