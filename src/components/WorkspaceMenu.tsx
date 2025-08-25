'use client';

import { useState } from 'react';
import {
  MoreVertical,
  Edit,
  Settings,
  Archive,
  Copy,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from './ConfirmationModal';
import { DuplicateWorkspaceModal } from './DuplicateWorkspaceModal';
import { EditWorkspaceModal } from './EditWorkspaceModal';
import { useToast } from '@/hooks/useToast';
import { csrfPatch, csrfPostJSON, csrfDelete } from '@/lib/csrf-fetch';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
}

interface WorkspaceMenuProps {
  workspace: Workspace;
  userRole: string;
}

export function WorkspaceMenu({ workspace, userRole }: WorkspaceMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [duplicateName] = useState(`${workspace.name} Copy`);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleEditWorkspace = () => {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'BUSINESS_OWNER') {
      showToast(
        'You do not have permission to edit this workspace. Only super admins and business owners can edit workspaces.',
        'error'
      );
      setIsOpen(false);
      return;
    }
    setShowEditModal(true);
    setIsOpen(false);
  };

  const handleManageMembers = () => {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'BUSINESS_OWNER') {
      showToast(
        'You do not have permission to manage members. Only super admins and business owners can manage workspace members.',
        'error'
      );
      setIsOpen(false);
      return;
    }
    router.push(`/workspace/${workspace.slug}/members`);
    setIsOpen(false);
  };

  const handleChangeStatus = () => {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'BUSINESS_OWNER') {
      showToast(
        'You do not have permission to change workspace status. Only super admins and business owners can manage workspace status.',
        'error'
      );
      setIsOpen(false);
      return;
    }
    setShowStatusModal(true);
    setIsOpen(false);
  };

  const confirmStatusChange = async () => {
    const newStatus = workspace.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = workspace.status === 'ACTIVE' ? 'deactivate' : 'activate';

    setLoading(true);
    try {
      const response = await csrfPatch(`/api/workspaces/${workspace.id}/status`, {
        status: newStatus
      });

      if (response.ok) {
        showToast(
          `Workspace "${workspace.name}" has been ${action}d successfully.`,
          'success'
        );
        router.refresh();
      } else {
        const error = await response.json();
        showToast(
          error.error || 'Failed to update workspace status. Please try again.',
          'error'
        );
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
      setShowStatusModal(false);
    }
  };

  const handleDuplicateWorkspace = () => {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'BUSINESS_OWNER') {
      showToast(
        'You do not have permission to duplicate workspaces. Only super admins and business owners can duplicate workspaces.',
        'error'
      );
      setIsOpen(false);
      return;
    }
    setShowDuplicateModal(true);
    setIsOpen(false);
  };

  const confirmDuplicate = async (newName: string) => {
    setLoading(true);
    try {
      const response = await csrfPostJSON(
        `/api/workspaces/${workspace.id}/duplicate`,
        { name: newName }
      );

      if (response.ok) {
        const result = await response.json();
        showToast(`Workspace "${newName}" created successfully.`, 'success');
        router.refresh();
      } else {
        const error = await response.json();
        showToast(
          error.error || 'Failed to duplicate workspace. Please try again.',
          'error'
        );
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
      setShowDuplicateModal(false);
    }
  };

  const handleDeleteWorkspace = () => {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'BUSINESS_OWNER') {
      showToast(
        'You do not have permission to delete workspaces. Only super admins and business owners can delete workspaces.',
        'error'
      );
      setIsOpen(false);
      return;
    }
    setShowDeleteModal(true);
    setIsOpen(false);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const response = await csrfDelete(`/api/workspaces/${workspace.id}`);

      if (response.ok) {
        showToast(
          `Workspace "${workspace.name}" has been deleted successfully.`,
          'success'
        );
        router.push('/dashboard'); // Redirect to dashboard after deletion
      } else {
        const error = await response.json();
        showToast(
          error.error || 'Failed to delete workspace. Please try again.',
          'error'
        );
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const confirmEditWorkspace = async (name: string, description: string) => {
    setLoading(true);
    try {
      const response = await csrfPatch(`/api/workspaces/${workspace.id}`, {
        name, 
        description
      });

      if (response.ok) {
        const result = await response.json();
        showToast(
          `Workspace "${result.workspace.name}" updated successfully.`,
          'success'
        );
        router.refresh();
      } else {
        const error = await response.json();
        showToast(
          error.error || 'Failed to update workspace. Please try again.',
          'error'
        );
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
      setShowEditModal(false);
    }
  };

  const hasAdminPermissions = userRole === 'SUPER_ADMIN' || userRole === 'BUSINESS_OWNER';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
          {/* Edit Workspace */}
          <button
            onClick={handleEditWorkspace}
            className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 ${
              hasAdminPermissions
                ? 'text-gray-700 hover:bg-gray-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={
              hasAdminPermissions
                ? 'Edit workspace details'
                : 'Only super admins and business owners can edit workspaces'
            }
          >
            <Edit className="h-4 w-4" />
            <span>Edit Workspace</span>
          </button>

          {/* Manage Members */}
          <button
            onClick={handleManageMembers}
            className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 ${
              hasAdminPermissions
                ? 'text-gray-700 hover:bg-gray-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={
              hasAdminPermissions
                ? 'Manage workspace members'
                : 'Only super admins and business owners can manage members'
            }
          >
            <UserPlus className="h-4 w-4" />
            <span>Manage Members</span>
          </button>


          <div className="border-t border-gray-100 my-1"></div>

          {/* Change Status */}
          <button
            onClick={handleChangeStatus}
            className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 ${
              hasAdminPermissions
                ? 'text-gray-700 hover:bg-gray-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={
              hasAdminPermissions
                ? `${workspace.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} workspace`
                : 'Only super admins and business owners can change workspace status'
            }
          >
            <Archive className="h-4 w-4" />
            <span>
              {workspace.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}{' '}
              Workspace
            </span>
          </button>

          {/* Duplicate Workspace */}
          <button
            onClick={handleDuplicateWorkspace}
            className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 ${
              hasAdminPermissions
                ? 'text-gray-700 hover:bg-gray-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={
              hasAdminPermissions
                ? 'Create a copy of this workspace'
                : 'Only super admins and business owners can duplicate workspaces'
            }
          >
            <Copy className="h-4 w-4" />
            <span>Duplicate Workspace</span>
          </button>

          <div className="border-t border-gray-100 my-1"></div>

          {/* Delete Workspace */}
          <button
            onClick={handleDeleteWorkspace}
            className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 ${
              hasAdminPermissions
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={
              hasAdminPermissions
                ? 'Permanently delete this workspace'
                : 'Only super admins and business owners can delete workspaces'
            }
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Workspace</span>
          </button>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      <ConfirmationModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={confirmStatusChange}
        title={`${workspace.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Workspace`}
        message={`Are you sure you want to ${workspace.status === 'ACTIVE' ? 'deactivate' : 'activate'} "${workspace.name}"?

${
  workspace.status === 'ACTIVE'
    ? 'Deactivating will make this workspace inaccessible to all users until reactivated.'
    : 'Activating will restore access to this workspace for all users.'
}`}
        confirmButtonText={
          workspace.status === 'ACTIVE' ? 'Deactivate' : 'Activate'
        }
        isDestructive={workspace.status === 'ACTIVE'}
        loading={loading}
      />

      {/* Duplicate Workspace Modal */}
      <DuplicateWorkspaceModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={confirmDuplicate}
        workspaceName={workspace.name}
        defaultName={duplicateName}
        loading={loading}
      />

      {/* Delete Workspace Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Workspace"
        message={`⚠️ WARNING: This action cannot be undone!

This will permanently delete "${workspace.name}" and all its data including:
• All photos and files
• All user selections and preferences
• All workspace settings and configurations
• All member access and permissions

This workspace and its data will be completely removed from the system.`}
        confirmButtonText="Delete Workspace"
        requiresTypedConfirmation={true}
        confirmationPhrase={`DELETE ${workspace.name}`}
        isDestructive={true}
        loading={loading}
      />

      {/* Edit Workspace Modal */}
      <EditWorkspaceModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={confirmEditWorkspace}
        workspace={workspace}
        loading={loading}
      />
    </div>
  );
}
