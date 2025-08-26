'use client';

import { useState } from 'react';
import {
  Settings,
  Edit,
  Upload,
  UserPlus,
  Archive,
  Copy,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from './ConfirmationModal';
import { DuplicateWorkspaceModal } from './DuplicateWorkspaceModal';
import { EditWorkspaceModal } from './EditWorkspaceModal';
import InviteModal from './InviteModal';
import UploadModal from './UploadModal';
import { useToast } from '@/hooks/useToast';
import { csrfPatch, csrfPostJSON, csrfDelete } from '@/lib/csrf-fetch';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
}

interface WorkspaceSettingsProps {
  workspace: Workspace;
  userRole: string;
}

export function WorkspaceSettings({
  workspace,
  userRole,
}: WorkspaceSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [duplicateName] = useState(`${workspace.name} Copy`);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const hasAdminPermissions =
    userRole === 'SUPER_ADMIN' || userRole === 'BUSINESS_OWNER';

  if (!hasAdminPermissions) {
    return null;
  }

  const handleEditWorkspace = () => {
    setShowEditModal(true);
    setIsOpen(false);
  };

  const handleUploadPhotos = () => {
    setShowUploadModal(true);
    setIsOpen(false);
  };

  const handleInviteMembers = () => {
    setShowInviteModal(true);
    setIsOpen(false);
  };

  const handleChangeStatus = () => {
    setShowStatusModal(true);
    setIsOpen(false);
  };

  const confirmStatusChange = async () => {
    const newStatus = workspace.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = workspace.status === 'ACTIVE' ? 'deactivate' : 'activate';

    setLoading(true);
    try {
      const response = await csrfPatch(
        `/api/workspaces/${workspace.id}/status`,
        {
          status: newStatus,
        }
      );

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
        router.push('/workspaces'); // Redirect to workspaces list after deletion
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
        description,
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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        title="Workspace Settings"
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Settings</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
          {/* Edit Workspace */}
          <button
            onClick={handleEditWorkspace}
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-3 text-gray-700 hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Workspace</span>
          </button>

          {/* Upload Photos */}
          <button
            onClick={handleUploadPhotos}
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-3 text-gray-700 hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Photos</span>
          </button>

          {/* Invite Members */}
          <button
            onClick={handleInviteMembers}
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-3 text-gray-700 hover:bg-gray-50"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Members</span>
          </button>

          <div className="border-t border-gray-100 my-1"></div>

          {/* Change Status */}
          <button
            onClick={handleChangeStatus}
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-3 text-gray-700 hover:bg-gray-50"
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
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-3 text-gray-700 hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" />
            <span>Duplicate Workspace</span>
          </button>

          <div className="border-t border-gray-100 my-1"></div>

          {/* Delete Workspace */}
          <button
            onClick={handleDeleteWorkspace}
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-3 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Workspace</span>
          </button>
        </div>
      )}

      {/* Modals */}
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

      <DuplicateWorkspaceModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={confirmDuplicate}
        workspaceName={workspace.name}
        defaultName={duplicateName}
        loading={loading}
      />

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

      <EditWorkspaceModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={confirmEditWorkspace}
        workspace={workspace}
        loading={loading}
      />

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        userRole={userRole}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
      />
    </div>
  );
}
