import { Camera, Upload, Settings, Users, FolderOpen, BarChart3, Building2, UserCheck, Activity, Plus } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-utils';
import { canUploadPhotos, canManageWorkspaces, canAccessWorkspace } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { UserRole, WorkspaceStatus } from '@prisma/client';
import { Navigation } from '@/components/Navigation';
import { CreateWorkspaceButton } from '@/components/admin/CreateWorkspaceButton';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your dashboard.</p>
          <Link
            href="/auth/signin"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Get user's workspace info
  const workspace = user.workspaceId ? await prisma.workspace.findUnique({
    where: { id: user.workspaceId },
    select: { id: true, name: true, slug: true }
  }) : null;

  // Check permissions
  const canUpload = canUploadPhotos(user.role);
  const canManage = canManageWorkspaces(user.role);
  const hasWorkspaceAccess = workspace ? canAccessWorkspace(user.role, user.workspaceId, workspace.id) : false;

  // For SUPER_ADMIN, fetch platform-wide data
  let adminData = null;
  if (user.role === UserRole.SUPER_ADMIN) {
    const [allWorkspaces, platformStats] = await Promise.all([
      prisma.workspace.findMany({
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
          photos: {
            select: {
              id: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              users: true,
              photos: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      Promise.all([
        prisma.workspace.count(),
        prisma.user.count(),
        prisma.photo.count(),
        prisma.user.count({ where: { role: UserRole.USER } }),
        prisma.workspace.count({ where: { status: WorkspaceStatus.ACTIVE } }),
      ]).then(([totalWorkspaces, totalUsers, totalPhotos, totalRegularUsers, activeWorkspaces]) => ({
        totalWorkspaces,
        totalUsers,
        totalPhotos,
        totalRegularUsers,
        activeWorkspaces,
      })),
    ]);

    adminData = { workspaces: allWorkspaces, stats: platformStats };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div style={{ paddingTop: '64px' }}> {/* Add padding for fixed navbar (16 * 4 = 64px) */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || user.email}
          </h1>
          <p className="text-gray-600">
            {user.role === UserRole.SUPER_ADMIN 
              ? "Manage your photo selection SaaS platform and monitor all workspaces."
              : `Here's what you can do with your ${user.role.toLowerCase().replace('_', ' ')} account.`
            }
          </p>
        </div>

        {/* Platform Stats for SUPER_ADMIN */}
        {adminData && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Workspaces</p>
                    <p className="text-2xl font-bold text-gray-900">{adminData.stats.totalWorkspaces}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{adminData.stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Camera className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Photos</p>
                    <p className="text-2xl font-bold text-gray-900">{adminData.stats.totalPhotos}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <UserCheck className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Regular Users</p>
                    <p className="text-2xl font-bold text-gray-900">{adminData.stats.totalRegularUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-teal-100 p-3 rounded-lg">
                    <Activity className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Workspaces</p>
                    <p className="text-2xl font-bold text-gray-900">{adminData.stats.activeWorkspaces}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* View Workspace */}
          {workspace && hasWorkspaceAccess && (
            <Link
              href={`/workspace/${workspace.slug}`}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">View Workspace</h3>
              </div>
              <p className="text-gray-600 mb-2">
                Browse photos in {workspace.name}
              </p>
              <p className="text-sm text-blue-600 font-medium">
                /{workspace.slug}
              </p>
            </Link>
          )}





          {/* Browse All Workspaces */}
          <Link
            href="/workspaces"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Browse Workspaces</h3>
            </div>
            <p className="text-gray-600">
              Explore available workspaces
            </p>
          </Link>
        </div>

        {/* Workspace Management for SUPER_ADMIN */}
        {adminData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Workspace Management</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Manage all client workspaces and their users
                </p>
              </div>
              <CreateWorkspaceButton />
            </div>

            {adminData.workspaces.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No workspaces yet</div>
                <p className="text-gray-500 text-sm">
                  Create your first workspace to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminData.workspaces.map((workspace) => (
                  <div key={workspace.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{workspace.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        workspace.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workspace.status.toLowerCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{(workspace as any)._count.users} members</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Camera className="h-4 w-4" />
                        <span>{(workspace as any)._count.photos} photos</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/workspace/${workspace.slug}`}
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/workspace/${workspace.slug}`}
                        className="flex-1 bg-gray-200 text-gray-700 text-center py-2 px-3 rounded text-sm hover:bg-gray-300 transition-colors"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Role</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'SUPER_ADMIN' 
                  ? 'bg-red-100 text-red-800'
                  : user.role === 'BUSINESS_OWNER'
                  ? 'bg-blue-100 text-blue-800'
                  : user.role === 'STAFF'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user.role.toLowerCase().replace('_', ' ')}
              </span>
            </div>
            {workspace && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Current Workspace</h3>
                <Link
                  href={`/workspace/${workspace.slug}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {workspace.name}
                </Link>
              </div>
            )}
          </div>
        </div>
        </main>
      </div> {/* Close padding wrapper */}
    </div>
  );
}
