'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Camera, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (status === 'loading') {
    return (
      <nav className="fixed top-0 left-0 right-0 w-full h-16 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </nav>
    );
  }

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  if (!session) {
    return (
      <>
        <nav className="fixed top-0 left-0 right-0 w-full h-16 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 text-gray-900 hover:text-gray-700 transition-colors">
              <Camera className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">PhotoSelect</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/documentation" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                Documentation
              </Link>
              <Link href="/support" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                Support
              </Link>
              <Link href="/contact-sales" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                Contact
              </Link>
              <Link href="/auth/signin" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Sign In
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-lg md:hidden">
            <div className="px-4 py-4 space-y-4">
              <Link 
                href="/documentation" 
                className="block text-gray-600 hover:text-gray-900 text-base font-medium py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Documentation
              </Link>
              <Link 
                href="/support" 
                className="block text-gray-600 hover:text-gray-900 text-base font-medium py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Support
              </Link>
              <Link 
                href="/contact-sales" 
                className="block text-gray-600 hover:text-gray-900 text-base font-medium py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link 
                href="/auth/signin" 
                className="block bg-blue-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </>
    );
  }

  const user = session.user;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 w-full h-16 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-gray-900 hover:text-gray-700 transition-colors">
            <Camera className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">PhotoSelect</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Dashboard
            </Link>
            <Link href="/workspaces" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Workspaces
            </Link>
            <Link href="/documentation" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Docs
            </Link>
            <Link href="/support" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Support
            </Link>
            
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                {user.role?.toLowerCase().replace('_', ' ')}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-lg md:hidden">
          <div className="px-4 py-4 space-y-4">
            <Link 
              href="/dashboard" 
              className="block text-gray-600 hover:text-gray-900 text-base font-medium py-2 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/workspaces" 
              className="block text-gray-600 hover:text-gray-900 text-base font-medium py-2 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Workspaces
            </Link>
            <Link 
              href="/documentation" 
              className="block text-gray-600 hover:text-gray-900 text-base font-medium py-2 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Documentation
            </Link>
            <Link 
              href="/support" 
              className="block text-gray-600 hover:text-gray-900 text-base font-medium py-2 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Support
            </Link>
            
            {/* User Info */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-base font-semibold text-blue-600">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                  <p className="text-xs text-gray-500">{user.role?.toLowerCase().replace('_', ' ')}</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  signOut({ callbackUrl: '/auth/signin' });
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-200 transition-colors text-center"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
