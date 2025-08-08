import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  return await requireRole([UserRole.ADMIN]);
}

export async function requireUploadPermission() {
  return await requireRole([UserRole.ADMIN, UserRole.PHOTOGRAPHER]);
}

export async function requireWorkspaceAccess(workspaceSlug: string) {
  const user = await requireAuth();
  
  // Admin can access any workspace
  if (user.role === UserRole.ADMIN) {
    return user;
  }
  
  // Check if user belongs to the workspace
  if (user.workspaceSlug !== workspaceSlug) {
    redirect("/unauthorized");
  }
  
  return user;
}

export async function getUserWithWorkspace(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      workspace: true,
      uploadedPhotos: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      selections: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          photo: true,
        },
      },
    },
  });
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function canUploadPhotos(userRole: UserRole): boolean {
  return hasRole(userRole, [UserRole.ADMIN, UserRole.PHOTOGRAPHER]);
}

export function canManageWorkspaces(userRole: UserRole): boolean {
  return hasRole(userRole, [UserRole.ADMIN]);
}

export function canAccessWorkspace(userRole: UserRole, userWorkspaceId: string | undefined, targetWorkspaceId: string): boolean {
  // Admin can access any workspace
  if (userRole === UserRole.ADMIN) {
    return true;
  }
  
  // User can only access their own workspace
  return userWorkspaceId === targetWorkspaceId;
}
