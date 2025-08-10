'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Camera, Settings, Users, LogOut, User } from 'lucide-react';

export function Navigation() {
  const { data: session, status } = useSession();

  // Simple fixed navbar that MUST work
  const navbarStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '64px',
    zIndex: 99999,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px'
  };

  if (status === 'loading') {
    return (
      <nav style={navbarStyle}>
        <div style={{ height: '32px', width: '128px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
      </nav>
    );
  }

  if (!session) {
    return (
      <nav style={navbarStyle}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#111827' }}>
          <Camera style={{ height: '32px', width: '32px', color: '#2563eb', marginRight: '8px' }} />
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>PhotoSelect</span>
        </Link>
        <Link
          href="/auth/signin"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Sign In
        </Link>
      </nav>
    );
  }

  const user = session.user;

  return (
    <nav style={navbarStyle}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#111827' }}>
        <Camera style={{ height: '32px', width: '32px', color: '#2563eb', marginRight: '8px' }} />
        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>PhotoSelect</span>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          href="/dashboard"
          style={{
            color: '#374151',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Dashboard
        </Link>
        
        <Link
          href="/workspaces"
          style={{
            color: '#374151',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Workspaces
        </Link>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#f3f4f6',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          color: '#374151'
        }}>
          {user.role?.toLowerCase().replace('_', ' ')}
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            height: '32px',
            width: '32px',
            backgroundColor: '#dbeafe',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2563eb'
          }}>
            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
