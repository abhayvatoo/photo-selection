'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Camera, Settings, Users, LogOut, User } from 'lucide-react';

export function Navigation() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!session) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Camera className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">PhotoSelect</span>
              </Link>
            </div>
            <div className="flex items-center">
              <Link
                href="/auth/signin"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const user = session.user;
  const canUpload = user.role === 'BUSINESS_OWNER' || user.role === 'STAFF';
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isBusinessOwner = user.role === 'BUSINESS_OWNER';
  const isStaff = user.role === 'STAFF';

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">PhotoSelect</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Dashboard Links - Always show appropriate dashboard */}
              {isSuperAdmin && (
                <Link
                  href="/super-admin"
                  className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Platform
                </Link>
              )}
              
              {isBusinessOwner && (
                <Link
                  href="/admin"
                  className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Business
                </Link>
              )}
              
              {isStaff && (
                <Link
                  href="/staff"
                  className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              )}

              {/* Workspace Link - Show if user has workspace access */}
              {user.workspaceSlug && (
                <Link
                  href={`/workspace/${user.workspaceSlug}`}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  My Workspace
                </Link>
              )}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* Workspace indicator */}
            {user.workspaceSlug && (
              <div className="hidden sm:flex items-center text-sm text-gray-600">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                  /{user.workspaceSlug}
                </span>
              </div>
            )}

            {/* Role badge - only show for super admin, business owner, and staff */}
            {(isSuperAdmin || isBusinessOwner || isStaff) && (
              <div className="hidden sm:flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isSuperAdmin 
                    ? 'bg-purple-100 text-purple-800'
                    : isBusinessOwner
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isSuperAdmin ? 'platform' : isBusinessOwner ? 'business' : 'staff'}
                </span>
              </div>
            )}

            {/* User avatar and menu */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium">
                  {user.name || user.email}
                </span>
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                    {user.email}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
