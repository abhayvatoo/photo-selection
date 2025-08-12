import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Camera, Users, Calendar, ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { UserRole } from '@prisma/client';

export default async function WorkspacesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const userRole = (session.user as any)?.role as UserRole;

  // Fetch workspaces based on user role
  let workspaces;
  
  if (userRole === UserRole.SUPER_ADMIN) {
    // Super admin can see all workspaces
    workspaces = await prisma.workspace.findMany({
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
          },
        },
        _count: {
          select: {
            users: true,
            photos: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  } else {
    // Other users can only see workspaces they're assigned to
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        workspace: {
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
              },
            },
            _count: {
              select: {
                users: true,
                photos: true,
              },
            },
          },
        },
      },
    });

    workspaces = user?.workspace ? [user.workspace] : [];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div style={{ paddingTop: '64px' }}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Workspaces</h1>
            <p className="text-gray-600">
              {userRole === UserRole.SUPER_ADMIN 
                ? "Manage all workspaces across the platform"
                : userRole === UserRole.BUSINESS_OWNER
                ? "Manage your photography workspaces and client projects"
                : "Access your assigned workspace and photo selections"
              }
            </p>
          </div>

          {/* Workspaces Grid */}
          {workspaces.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces found</h3>
              <p className="text-gray-600 mb-6">
                {userRole === UserRole.SUPER_ADMIN 
                  ? "No workspaces have been created yet."
                  : userRole === UserRole.BUSINESS_OWNER
                  ? "You haven't been assigned to any workspaces yet."
                  : "You haven't been assigned to a workspace yet. Contact your photographer."
                }
              </p>
              {userRole === UserRole.SUPER_ADMIN && (
                <Link
                  href="/dashboard"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Create Workspace
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/workspace/${workspace.slug}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 p-6 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {workspace.name}
                      </h3>
                      {workspace.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {workspace.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>

                  {/* Workspace Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {workspace._count.users} member{workspace._count.users !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Camera className="h-4 w-4 mr-2" />
                      {workspace._count.photos} photo{workspace._count.photos !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Updated {new Date(workspace.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workspace.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : workspace.status === 'INACTIVE'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {workspace.status.toLowerCase()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Quick Actions for Business Owners */}
          {userRole === UserRole.BUSINESS_OWNER && workspaces.length > 0 && (
            <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/photographer"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <Camera className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Upload Photos</div>
                    <div className="text-sm text-gray-600">Add new photos to workspaces</div>
                  </div>
                </Link>
                
                <Link
                  href="/photographer"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <Users className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Invite Clients</div>
                    <div className="text-sm text-gray-600">Send workspace invitations</div>
                  </div>
                </Link>
                
                <Link
                  href="/dashboard"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <Plus className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Manage Settings</div>
                    <div className="text-sm text-gray-600">Configure workspace settings</div>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
