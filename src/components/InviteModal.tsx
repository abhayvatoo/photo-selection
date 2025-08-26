'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, AlertTriangle } from 'lucide-react';
import { UserRole } from '@prisma/client';
import { checkUserLimit, createInvitation } from '@/lib/actions/invitation-actions';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  workspaceId: string;
  workspaceName: string;
}

export default function InviteModal({
  isOpen,
  onClose,
  userRole,
  workspaceId,
  workspaceName,
}: InviteModalProps) {
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

  // Check user limit when modal opens or workspaceId changes
  useEffect(() => {
    if (isOpen && workspaceId) {
      checkUserLimit(workspaceId)
        .then(setUserLimit)
        .catch((error) => {
          console.error('Error checking user limit:', error);
        });
    }
  }, [isOpen, workspaceId]);

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
      const result = await createInvitation({
        email,
        role,
        workspaceId:
          role === UserRole.STAFF || role === UserRole.USER
            ? workspaceId
            : undefined,
      });

      setMessage({
        type: 'success',
        text: `Invitation sent to ${email}! They will receive an email with instructions to join.`,
      });
      setEmail('');
      setRole(UserRole.USER);

      // Refresh user limit after successful invitation
      if (workspaceId) {
        checkUserLimit(workspaceId)
          .then(setUserLimit)
          .catch(console.error);
      }

      // Auto-close modal after success
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send invitation',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole(UserRole.USER);
    setMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Invite Member
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Invite new members to <strong>{workspaceName}</strong>
          </div>

          {!canInvite ? (
            <div className="text-center py-8">
              <div className="text-gray-500 text-sm">
                You don&apos;t have permission to invite members to this
                workspace.
              </div>
            </div>
          ) : (
            <>
              {/* User Limit Warning */}
              {userLimit && !userLimit.allowed && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        User limit reached ({userLimit.limit} users).
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        <a
                          href="/pricing"
                          className="underline hover:no-underline"
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
                <div className="mb-3 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  {userLimit.current}/{userLimit.limit} users in workspace
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
                    disabled={userLimit ? !userLimit.allowed : false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className={`p-3 rounded-md text-sm ${
                      message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !email ||
                      (userLimit ? !userLimit.allowed : false)
                    }
                    className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>

              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-xs font-medium text-gray-900 mb-2">
                  How it works:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• User receives secure invitation link via email</li>
                  <li>• They sign in with their email (magic link)</li>
                  <li>• Role is automatically assigned upon acceptance</li>
                  <li>• Invitations expire after 72 hours</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
