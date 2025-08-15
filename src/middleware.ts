import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { SecurityHeaders } from "@/lib/security-headers";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (token) {  
      // Upload routes - accessible by SUPER_ADMIN and BUSINESS_OWNER
      if (pathname.startsWith("/upload") || pathname.includes("/api/photos/upload")) {
        if (token?.role !== UserRole.SUPER_ADMIN && token?.role !== UserRole.BUSINESS_OWNER) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }

      // Workspace routes - users can only access their own workspace (except SUPER_ADMIN)
      const workspaceMatch = pathname.match(/^\/workspace\/([^\/]+)/);
      if (workspaceMatch) {
        const workspaceSlug = workspaceMatch[1];
        if (token?.workspaceSlug !== workspaceSlug && token?.role !== UserRole.SUPER_ADMIN) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }
    }

    const response = NextResponse.next();
    return SecurityHeaders.applyHeaders(response);
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
    "/dashboard/:path*",
  ],
};
