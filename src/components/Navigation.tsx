'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Camera, 
  Menu, 
  X, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut,
  Bell,
  Search
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function Navigation() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key to close menus
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  // Helper function to check if link is active
  const isActiveLink = (href: string) => pathname === href || pathname.startsWith(href + '/');

  if (status === 'loading') {
    return (
      <nav className="fixed top-0 left-0 right-0 w-full h-16 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </nav>
    );
  }

  if (!session) {
    return (
      <>
        <nav className="fixed top-0 left-0 right-0 w-full h-16 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-900 hover:text-gray-700 transition-all duration-200 hover:scale-105"
            >
              <div className="relative">
                <Camera className="h-8 w-8 text-blue-600" />
                <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-md opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                PhotoSelect
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {[
                { href: '/documentation', label: 'Documentation' },
                { href: '/support', label: 'Support' },
                { href: '/contact-sales', label: 'Contact' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                    isActiveLink(link.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                  {isActiveLink(link.href) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              ))}
              
              <div className="ml-4 pl-4 border-l border-gray-200">
                <Link
                  href="/auth/signin"
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              className="md:hidden p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            
            {/* Mobile Menu Drawer */}
            <div 
              ref={mobileMenuRef}
              className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 max-w-[85vw] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="flex-1 px-6 py-6 space-y-1">
                  {[
                    { href: '/documentation', label: 'Documentation' },
                    { href: '/support', label: 'Support' },
                    { href: '/contact-sales', label: 'Contact' },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                        isActiveLink(link.href)
                          ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 p-6">
                  <Link
                    href="/auth/signin"
                    className="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-all duration-200 hover:shadow-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const user = session.user;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 w-full h-16 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 text-gray-900 hover:text-gray-700 transition-all duration-200 hover:scale-105"
          >
            <div className="relative">
              <Camera className="h-8 w-8 text-blue-600" />
              <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-md opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
              PhotoSelect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/documentation', label: 'Docs' },
              { href: '/support', label: 'Support' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  isActiveLink(link.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
                {isActiveLink(link.href) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            ))}

            {/* User Menu */}
            <div className="ml-6 pl-6 border-l border-gray-200 flex items-center space-x-3">
              {/* Role Badge */}
              <div className="hidden lg:block bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-medium text-blue-700">
                {user.role?.toLowerCase().replace('_', ' ')}
              </div>

              {/* User Menu Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="User menu"
                >
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-lg">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 lg:hidden">
                        {user.role?.toLowerCase().replace('_', ' ')}
                      </p>
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={() => {
                          // Future: Navigate to profile page
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-150"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          // Future: Navigate to settings page
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-150"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: '/auth/signin' });
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors duration-150"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            className="md:hidden p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          
          {/* Mobile Menu Drawer */}
          <div 
            ref={mobileMenuRef}
            className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 max-w-[85vw] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* User Profile Section */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-lg font-semibold text-white shadow-lg">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      {user.role?.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 px-6 py-6 space-y-1">
                {[
                  { href: '/dashboard', label: 'Dashboard' },
                  { href: '/documentation', label: 'Documentation' },
                  { href: '/support', label: 'Support' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                      isActiveLink(link.href)
                        ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              
              {/* Footer Actions */}
              <div className="border-t border-gray-200 p-6 space-y-3">
                <button
                  onClick={() => {
                    // Future: Navigate to profile
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  <User className="h-5 w-5" />
                  <span className="text-base font-medium">Profile</span>
                </button>
                
                <button
                  onClick={() => {
                    // Future: Navigate to settings
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-base font-medium">Settings</span>
                </button>

                <button
                  onClick={() => {
                    signOut({ callbackUrl: '/auth/signin' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-base font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
