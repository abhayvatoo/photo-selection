import { NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('[NextAuth Error]', code, metadata);
    },
    warn(code) {
      console.warn('[NextAuth Warning]', code);
    },
    debug(code, metadata) {
      console.log('[NextAuth Debug]', code, metadata);
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
    }),
    EmailProvider({
      server: process.env.NODE_ENV === 'development' 
        ? "smtp://test:test@localhost:587"
        : {
            host: process.env.EMAIL_SERVER_HOST,
            port: process.env.EMAIL_SERVER_PORT,
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
          },
      from: process.env.EMAIL_FROM || 'noreply@photoselect.dev',
      async sendVerificationRequest({ identifier, url, provider }) {
        if (process.env.NODE_ENV === 'development') {
          console.log('\n🔗 MAGIC LINK FOR DEVELOPMENT:');
          console.log(`📧 Email: ${identifier}`);
          console.log(`🔗 Magic Link: ${url}`);
          console.log('👆 Copy this link and paste it in your browser\n');
          return;
        }
        // In production, this would send a real email
        throw new Error('Email sending not configured for production');
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Store user info and role in token
      if (account && user) {
        // Fetch the user from database to get their role
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        
        if (dbUser) {
          token.role = dbUser.role;
          token.workspaceId = dbUser.workspaceId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role;
        (session.user as any).workspaceId = token.workspaceId;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Make first user a super admin (platform owner)
      if (account?.provider === "google" || account?.provider === "email") {
        const userCount = await prisma.user.count();
        if (userCount === 1) {
          // First user becomes super admin (platform owner)
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "SUPER_ADMIN" },
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  events: {
    async createUser({ user }) {
      // Set default color for new users (role is set by schema default)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          color: "#3B82F6",
        },
      });
    },
  },
};
