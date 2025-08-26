import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { ArrowLeft, Users, Calendar } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import PhotoGallery from '@/components/PhotoGallery';
import { WorkspaceSettings } from '@/components/WorkspaceSettings';

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
          <Link
            href="/"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Back to Home
          </Link>
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
      <div style={{ paddingTop: '64px' }}>
        {' '}
        {/* Add padding for fixed navbar (16 * 4 = 64px) */}
        {/* Workspace Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center min-w-0 flex-1">
                <Link
                  href="/workspaces"
                  className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="font-medium hidden sm:inline">
                    Back to Workspaces
                  </span>
                  <span className="font-medium sm:hidden">Back</span>
                </Link>
                <div className="w-px h-6 bg-gray-300 mr-4"></div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {workspace.name}
                </h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Mobile Settings */}
                <div className="sm:hidden">
                  <WorkspaceSettings
                    workspace={workspace}
                    userRole={userRole}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Workspace Info - Compact */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {workspace.name}
                </h2>
                {workspace.description && (
                  <p className="text-gray-600 text-sm mb-2">
                    {workspace.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {workspace.users.length} members
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(workspace.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Quick stats and settings for larger screens */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {workspace.photos.length} Photos
                  </div>
                  <div className="text-xs text-gray-500">
                    {workspace.photos.reduce(
                      (acc, photo) => acc + photo.selections.length,
                      0
                    )}{' '}
                    Selections
                  </div>
                </div>

                {/* Desktop Settings */}
                <div className="hidden sm:block">
                  <WorkspaceSettings
                    workspace={workspace}
                    userRole={userRole}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Photos Section - Main Focus */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
                <div className="text-xs sm:text-sm text-gray-500">
                  {userRole === 'USER'
                    ? 'Click the heart to select your favorites'
                    : userRole === 'BUSINESS_OWNER'
                      ? 'View client selections & manage photos'
                      : 'Browse workspace photos'}
                </div>
              </div>
            </div>

            <div className="p-4">
              <PhotoGallery
                workspaceId={workspace.id}
                userId={session.user.id}
                userRole={userRole}
                canSelect={
                  userRole === 'USER' ||
                  userRole === 'STAFF' ||
                  userRole === 'BUSINESS_OWNER' ||
                  userRole === 'SUPER_ADMIN'
                }
              />
            </div>
          </div>
        </div>
      </div>{' '}
      {/* Close padding wrapper */}
    </div>
  );
}
