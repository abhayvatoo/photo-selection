import { UserRole } from "@prisma/client";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      workspaceId?: string;
      workspaceSlug?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    workspaceId?: string;
    workspaceSlug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole;
    workspaceId?: string;
    workspaceSlug?: string;
  }
}
