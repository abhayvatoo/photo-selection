import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { ArrowLeft, Upload, Download, Eye, Heart, Camera, Users, Calendar } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import PhotoGallery from '@/components/PhotoGallery';

interface WorkspacePageProps {
  params: {
    slug: string;
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Fetch workspace data
  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.slug },
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
        include: {
          uploadedBy: {
            select: {
              name: true,
              email: true,
            },
          },
          selections: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-6">Workspace not found</p>
          <a 
            href="/"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const userRole = (session.user as any)?.role;
  const canUpload = userRole === 'SUPER_ADMIN' || userRole === 'BUSINESS_OWNER';
  const canManage = userRole === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div style={{ paddingTop: '64px' }}> {/* Add padding for fixed navbar (16 * 4 = 64px) */}
      
      {/* Workspace Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a 
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Dashboard
              </a>
              <h1 className="text-xl font-semibold text-gray-900">
                {workspace.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workspace Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {workspace.name}
              </h2>
              {workspace.description && (
                <p className="text-gray-600 mb-4">{workspace.description}</p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {workspace.users.length} members
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            {canUpload && (
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Upload Photos
              </button>
            )}
          </div>
        </div>

        {/* Photos Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
            {canUpload && (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Photos
              </button>
            )}
          </div>
          
          <PhotoGallery 
            workspaceId={workspace.id}
            userId={session.user.id}
            userRole={userRole}
            canSelect={userRole === 'USER' || userRole === 'STAFF' || userRole === 'BUSINESS_OWNER' || userRole === 'SUPER_ADMIN'}
          />
        </div>

        {/* Team Members (for admins) */}
        {canManage && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Members</h3>
            <div className="space-y-4">
              {workspace.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.name || user.email}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'SUPER_ADMIN' 
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'BUSINESS_OWNER'
                      ? 'bg-blue-100 text-blue-800'
                      : user.role === 'STAFF'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role?.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div> {/* Close padding wrapper */}
    </div>
  );
}
