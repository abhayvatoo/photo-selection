import {
  Camera,
  Upload,
  Settings,
  Users,
  FolderOpen,
  BarChart3,
  Building2,
  UserCheck,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  canAccessWorkspace,
} from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { UserRole, WorkspaceStatus } from "@prisma/client";
import { Navigation } from "@/components/Navigation";
import { getUserSubscription, getUserPlanLimits } from "@/lib/subscription";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in to access your dashboard.
          </p>
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
  const workspace = user.workspaceId
    ? await prisma.workspace.findUnique({
        where: { id: user.workspaceId },
        select: { id: true, name: true, slug: true },
      })
    : null;

  // Check permissions
  const hasWorkspaceAccess = workspace
    ? canAccessWorkspace(user.role, user.workspaceId, workspace.id)
    : false;

  // Get user subscription and limits for billing section
  const subscription = await getUserSubscription(user.id);
  const limits = await getUserPlanLimits(user.id);

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
      ]).then(
        ([
          totalWorkspaces,
          totalUsers,
          totalPhotos,
          totalRegularUsers,
          activeWorkspaces,
        ]) => ({
          totalWorkspaces,
          totalUsers,
          totalPhotos,
          totalRegularUsers,
          activeWorkspaces,
        })
      ),
    ]);

    adminData = { workspaces: allWorkspaces, stats: platformStats };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div style={{ paddingTop: "64px" }}>
        {" "}
        {/* Add padding for fixed navbar (16 * 4 = 64px) */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name || user.email}
            </h1>
            <p className="text-gray-600">
              {user.role === UserRole.SUPER_ADMIN
                ? "Manage your photo selection SaaS platform and monitor all workspaces."
                : `Here's what you can do with your ${user.role
                    .toLowerCase()
                    .replace("_", " ")} account.`}
            </p>
          </div>

          {/* Platform Stats for SUPER_ADMIN */}
          {adminData && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Platform Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {adminData.stats.totalUsers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Camera className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Photos
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {adminData.stats.totalPhotos}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <UserCheck className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Regular Users
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {adminData.stats.totalRegularUsers}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Dashboard Sections */}
          <div className="space-y-8">
            {/* Workspace Management - Large Unified Tile */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        Workspace Management
                      </h2>
                      <p className="text-gray-600">
                        {user.role === UserRole.SUPER_ADMIN
                          ? "Manage all client workspaces and their users"
                          : "Access and manage your workspaces"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Current Workspace */}
                    {workspace && hasWorkspaceAccess && (
                      <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Current Workspace</h3>
                        <div className="flex items-center">
                          <div className="bg-blue-500 w-3 h-3 rounded-full mr-3"></div>
                          <div>
                            <p className="font-semibold text-gray-900">{workspace.name}</p>
                            <p className="text-sm text-gray-600">/{workspace.slug}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Workspace Stats */}
                    {adminData && (
                      <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
                        <h3 className="text-sm font-medium text-gray-600 mb-3">Workspace Overview</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Workspaces</span>
                            <span className="font-bold text-gray-900">{adminData.stats.totalWorkspaces}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Active Workspaces</span>
                            <span className="font-bold text-green-600">{adminData.stats.activeWorkspaces}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* For non-admin users, show current workspace only */}
                    {!adminData && workspace && hasWorkspaceAccess && (
                      <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Quick Access</h3>
                        <p className="text-sm text-gray-600">Access your workspace to manage photos and selections</p>
                      </div>
                    )}
                  </div>

                  {/* Clear Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/workspaces"
                      className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <FolderOpen className="h-5 w-5" />
                      <span>Manage All Workspaces</span>
                    </Link>
                    
                    {/* Quick access to current workspace */}
                    {workspace && hasWorkspaceAccess && (
                      <Link
                        href={`/workspace/${workspace.slug}`}
                        className="inline-flex items-center space-x-2 bg-white text-blue-600 border border-blue-200 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                      >
                        <Camera className="h-5 w-5" />
                        <span>Open Current Workspace</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Billing & Subscription Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Billing & Subscription
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Manage your subscription and billing information
                  </p>
                </div>
              </div>

              {subscription && limits ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Plan */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div
                        className={`p-2 rounded-lg ${
                          subscription.planType === "ENTERPRISE"
                            ? "bg-purple-100"
                            : subscription.planType === "PROFESSIONAL"
                            ? "bg-blue-100"
                            : "bg-green-100"
                        }`}
                      >
                        <CreditCard
                          className={`h-5 w-5 ${
                            subscription.planType === "ENTERPRISE"
                              ? "text-purple-600"
                              : subscription.planType === "PROFESSIONAL"
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {subscription.planType.charAt(0) +
                            subscription.planType.slice(1).toLowerCase()}{" "}
                          Plan
                        </h3>
                        <p className="text-sm text-gray-600">
                          {subscription.status === "ACTIVE"
                            ? "Active"
                            : subscription.status.toLowerCase()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Workspaces:</span>
                        <span className="font-medium">
                          {limits.maxWorkspaces === -1
                            ? "Unlimited"
                            : limits.maxWorkspaces}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Photos per workspace:</span>
                        <span className="font-medium">
                          {limits.maxPhotosPerWorkspace === -1
                            ? "Unlimited"
                            : limits.maxPhotosPerWorkspace}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Users per workspace:</span>
                        <span className="font-medium">
                          {limits.maxUsersPerWorkspace === -1
                            ? "Unlimited"
                            : limits.maxUsersPerWorkspace}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage:</span>
                        <span className="font-medium">
                          {limits.maxStorageGB === -1
                            ? "Unlimited"
                            : `${limits.maxStorageGB}GB`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Billing Actions */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Manage Subscription
                      </h3>
                      <div className="space-y-3">
                        <Link
                          href="/dashboard/billing"
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>View Billing Details</span>
                        </Link>

                        {subscription.planType === "STARTER" && (
                          <Link
                            href="/pricing"
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <span>Upgrade Plan</span>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : user.role === UserRole.SUPER_ADMIN ? (
                <div className="text-center py-8">
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-center mb-4">
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Platform Administrator
                    </h3>
                    <p className="text-gray-600 mb-4">
                      As the platform owner, you have unlimited access to all
                      features. Customer subscriptions are managed through
                      Stripe.
                    </p>
                    <div className="space-y-3">
                      <Link
                        href="/pricing"
                        className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <span>View Customer Pricing</span>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                    <div className="flex items-center justify-center mb-4">
                      <CreditCard className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Subscription Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You don't have an active subscription yet. Start with our
                      free Starter plan or upgrade to unlock more features.
                    </p>
                    <div className="space-y-3">
                      <Link
                        href="/pricing"
                        className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <span>View Pricing Plans</span>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Quick Actions remain for other functionality */}
            </div>

          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Email
                </h3>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Role</h3>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === "SUPER_ADMIN"
                      ? "bg-red-100 text-red-800"
                      : user.role === "BUSINESS_OWNER"
                      ? "bg-blue-100 text-blue-800"
                      : user.role === "STAFF"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.role.toLowerCase().replace("_", " ")}
                </span>
              </div>
              {workspace && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Current Workspace
                  </h3>
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
      </div>{" "}
      {/* Close padding wrapper */}
    </div>
  );
}
