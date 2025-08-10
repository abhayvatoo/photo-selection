import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Camera, Users, Upload, Eye } from 'lucide-react';

export default async function PhotographerDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'BUSINESS_OWNER' && userRole !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  // Fetch photographer's assigned workspaces and stats
  const [workspaces, stats] = await Promise.all([
    prisma.workspace.findMany({
      where: {
        OR: [
          { users: { some: { id: session.user.id } } },
          // Admins can see all workspaces
          userRole === 'SUPER_ADMIN' ? {} : { id: 'never-match' }
        ]
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        photos: {
          select: {
            id: true,
            uploadedById: true,
          },
        },
        _count: {
          select: {
            photos: true,
            users: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    // Get photographer's upload stats
    prisma.photo.aggregate({
      where: { uploadedById: session.user.id },
      _count: { id: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-blue-500 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Photographer Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {session.user.email}
              </span>
              <a
                href="/api/auth/signout"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Upload className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Photos Uploaded</p>
                <p className="text-2xl font-bold text-gray-900">{stats._count.id}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assigned Workspaces</p>
                <p className="text-2xl font-bold text-gray-900">{workspaces.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Photos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workspaces.reduce((sum, ws) => sum + (ws as any)._count.photos, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Workspaces */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Workspaces</h2>
          </div>
          
          {workspaces.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No workspaces assigned yet</p>
              <p className="text-sm text-gray-400">
                Contact your admin to get assigned to workspaces
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          {workspace.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          workspace.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {workspace.status}
                        </span>
                      </div>
                      
                      {workspace.description && (
                        <p className="text-gray-600 mt-1">{workspace.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {(workspace as any)._count.users} members
                        </span>
                        <span className="flex items-center">
                          <Camera className="h-4 w-4 mr-1" />
                          {(workspace as any)._count.photos} photos
                        </span>
                        <span>
                          Updated {new Date(workspace.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-6">
                      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photos
                      </button>
                      <a
                        href={`/workspace/${workspace.slug}`}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
