'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@prisma/client';
import { AlertTriangle } from 'lucide-react';
import { csrfPostJSON } from '@/lib/csrf-fetch';

interface InviteUsersProps {
  userRole: UserRole;
  workspaceId?: string;
}

export default function InviteUsers({
  userRole,
  workspaceId,
}: InviteUsersProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [userLimit, setUserLimit] = useState<{
    allowed: boolean;
    current: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    if (workspaceId) {
      checkUserLimit();
    }
  }, [workspaceId]);

  const checkUserLimit = async () => {
    if (!workspaceId) return;

    try {
      const response = await fetch(
        `/api/user/user-limit?workspaceId=${workspaceId}`
      );
      if (response.ok) {
        const data = await response.json();
        setUserLimit(data);
      }
    } catch (error) {
      console.error('Error checking user limit:', error);
    }
  };

  const canInvite =
    userRole === UserRole.SUPER_ADMIN || userRole === UserRole.BUSINESS_OWNER;

  const availableRoles = () => {
    if (userRole === UserRole.SUPER_ADMIN) {
      return [
        { value: UserRole.BUSINESS_OWNER, label: 'Business Owner' },
        { value: UserRole.STAFF, label: 'Staff Member' },
        { value: UserRole.USER, label: 'Client' },
      ];
    } else if (userRole === UserRole.BUSINESS_OWNER) {
      return [
        { value: UserRole.STAFF, label: 'Staff Member' },
        { value: UserRole.USER, label: 'Client' },
      ];
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role) return;

    // Check user limit before sending invitation
    if (userLimit && !userLimit.allowed) {
      setMessage({
        type: 'error',
        text: `User limit reached. You can only have ${userLimit.limit} users in this workspace.`,
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await csrfPostJSON('/api/invitations/create', {
        email,
        role,
        workspaceId:
          role === UserRole.STAFF || role === UserRole.USER
            ? workspaceId
            : undefined,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Invitation sent to ${email}! ${data.invitation.invitationUrl ? `Development URL: ${data.invitation.invitationUrl}` : ''}`,
        });
        setEmail('');
        setRole(UserRole.USER);
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to send invitation',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to send invitation',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canInvite) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Users</h3>

      {/* User Limit Warning */}
      {userLimit && !userLimit.allowed && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                User Limit Reached
              </p>
              <p className="text-sm text-orange-700 mt-1">
                You've reached your limit of {userLimit.limit} users in this
                workspace.
                <a
                  href="/pricing"
                  className="underline hover:no-underline ml-1"
                >
                  Upgrade your plan
                </a>{' '}
                to invite more users.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Usage Info */}
      {userLimit && userLimit.allowed && userLimit.limit !== -1 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">
              {userLimit.current} of {userLimit.limit} users in this workspace
            </span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="user@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableRoles().map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div
            className={`p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending Invitation...' : 'Send Invitation'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          How it works:
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• User receives a secure invitation link via email</li>
          <li>• They sign in with their email (magic link)</li>
          <li>• Upon accepting, their role is automatically assigned</li>
          <li>• Staff and Clients are assigned to your workspace</li>
          <li>• Invitations expire after 72 hours</li>
        </ul>
      </div>
    </div>
  );
}
