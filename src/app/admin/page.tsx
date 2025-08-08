import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { WorkspaceCard } from "@/components/admin/WorkspaceCard";
import { CreateWorkspaceButton } from "@/components/admin/CreateWorkspaceButton";
import { AdminStats } from "@/components/admin/AdminStats";
import { Navigation } from "@/components/Navigation";
import { UserRole, WorkspaceStatus } from "@prisma/client";

export default async function AdminDashboard() {
  await requireAdmin();

  // Fetch dashboard data
  const [workspaces, stats] = await Promise.all([
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
    // Get overall stats
    Promise.all([
      prisma.workspace.count(),
      prisma.user.count(),
      prisma.photo.count(),
      prisma.user.count({ where: { role: UserRole.CLIENT } }),
      prisma.workspace.count({ where: { status: WorkspaceStatus.ACTIVE } }),
    ]).then(([totalWorkspaces, totalUsers, totalPhotos, totalClients, activeWorkspaces]) => ({
      totalWorkspaces,
      totalUsers,
      totalPhotos,
      totalClients,
      activeWorkspaces,
    })),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage workspaces, users, and monitor your photo selection SaaS platform
          </p>
        </div>

        {/* Stats Overview */}
        <AdminStats stats={stats} />

        {/* Workspaces Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Workspaces</h2>
              <p className="text-gray-600 text-sm mt-1">
                Manage client workspaces and their users
              </p>
            </div>
            <CreateWorkspaceButton />
          </div>

          {workspaces.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No workspaces yet</div>
              <p className="text-gray-500 text-sm">
                Create your first workspace to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <WorkspaceCard key={workspace.id} workspace={workspace} />
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
