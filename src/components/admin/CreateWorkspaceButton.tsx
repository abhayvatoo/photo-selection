'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { csrfPostJSON } from '@/lib/csrf-fetch';

export function CreateWorkspaceButton() {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [limitCheck, setLimitCheck] = useState<{
    allowed: boolean;
    current: number;
    limit: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const { showToast } = useToast();

  const checkLimit = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/user/workspace-limit');
      if (response.ok) {
        const data = await response.json();
        setLimitCheck(data);
      }
    } catch (error) {
      console.error('Error checking workspace limit:', error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id && showModal) {
      checkLimit();
    }
  }, [session?.user?.id, showModal, checkLimit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await csrfPostJSON('/api/admin/workspaces', formData);

      if (response.ok) {
        const result = await response.json();

        // Show success notification
        showToast(
          `Workspace "${result.workspace.name}" created successfully! You can access it at: /workspace/${result.workspace.slug}`,
          'success'
        );

        setShowModal(false);
        setFormData({ name: '', slug: '', description: '' });
        // Refresh the page to show new workspace
        window.location.reload();
      } else {
        const error = await response.json();
        console.error('❌ CreateWorkspaceButton: API error:', error);
        showToast(
          `Failed to create workspace: ${error.error || error.message || 'Unknown error'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('❌ CreateWorkspaceButton: Network/parsing error:', error);
      showToast(
        `Failed to create workspace: ${error instanceof Error ? error.message : 'Network error'}`,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Workspace
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Workspace
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Workspace Limit Warning */}
            {limitCheck && !limitCheck.allowed && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Workspace Limit Reached
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      You&apos;ve reached your limit of {limitCheck.limit} workspace
                      {limitCheck.limit === 1 ? '' : 's'}.
                      <a
                        href="/pricing"
                        className="underline hover:no-underline ml-1"
                      >
                        Upgrade your plan
                      </a>{' '}
                      to create more workspaces.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Workspace Usage Info */}
            {limitCheck && limitCheck.allowed && limitCheck.limit !== -1 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">
                    {limitCheck.current} of {limitCheck.limit} workspaces used
                  </span>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="e.g., John & Jane Wedding"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="john-jane-wedding"
                  pattern="[a-z0-9-]+"
                  title="Only lowercase letters, numbers, and hyphens allowed"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be used in the URL: /workspace/{formData.slug}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  rows={3}
                  placeholder="Brief description of this workspace..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isLoading || (limitCheck ? !limitCheck.allowed : false)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading
                    ? 'Creating...'
                    : limitCheck && !limitCheck.allowed
                      ? 'Limit Reached'
                      : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
