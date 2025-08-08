import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Admin routes - only accessible by ADMIN
    if (pathname.startsWith("/admin")) {
      if (token?.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Upload routes - accessible by ADMIN and PHOTOGRAPHER
    if (pathname.startsWith("/upload") || pathname.includes("/api/photos/upload")) {
      if (token?.role !== UserRole.ADMIN && token?.role !== UserRole.PHOTOGRAPHER) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Workspace-specific routes - ensure user belongs to workspace
    if (pathname.startsWith("/workspace/")) {
      const workspaceSlug = pathname.split("/")[2];
      if (token?.workspaceSlug !== workspaceSlug && token?.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/upload/:path*",
    "/workspace/:path*",
    "/api/photos/upload",
    "/api/admin/:path*",
  ],
};
