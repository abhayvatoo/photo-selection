'use client';

import { useState } from 'react';
import { MoreVertical, Edit, Settings, Archive, Copy, Trash2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from './ConfirmationModal';
import { DuplicateWorkspaceModal } from './DuplicateWorkspaceModal';
import { useToast } from '@/hooks/useToast';

interface Workspace {
  id: string;
  name: string;
  slug: string;
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
  const [duplicateName] = useState(`${workspace.name} Copy`);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleEditWorkspace = () => {
    router.push(`/workspace/${workspace.slug}/settings`);
    setIsOpen(false);
  };

  const handleManageMembers = () => {
    router.push(`/workspace/${workspace.slug}/members`);
    setIsOpen(false);
  };

  const handleWorkspaceSettings = () => {
    router.push(`/workspace/${workspace.slug}/settings`);
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
      // Get CSRF token
      const csrfResponse = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(`/api/workspaces/${workspace.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showToast(`Workspace "${workspace.name}" has been ${action}d successfully.`, 'success');
        router.refresh();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to update workspace status. Please try again.', 'error');
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
      // Get CSRF token
      const csrfResponse = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(`/api/workspaces/${workspace.id}/duplicate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ name: newName })
      });

      if (response.ok) {
        const result = await response.json();
        showToast(`Workspace "${newName}" created successfully.`, 'success');
        router.refresh();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to duplicate workspace. Please try again.', 'error');
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
      // Get CSRF token
      const csrfResponse = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        }
      });

      if (response.ok) {
        showToast(`Workspace "${workspace.name}" has been deleted successfully.`, 'success');
        router.push('/dashboard'); // Redirect to dashboard after deletion
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to delete workspace. Please try again.', 'error');
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  // Only show menu for admins and business owners
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'BUSINESS_OWNER') {
    return null;
  }

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
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Workspace</span>
          </button>
          
          {/* Manage Members */}
          <button 
            onClick={handleManageMembers}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
          >
            <UserPlus className="h-4 w-4" />
            <span>Manage Members</span>
          </button>
          
          {/* Workspace Settings */}
          <button 
            onClick={handleWorkspaceSettings}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
          >
            <Settings className="h-4 w-4" />
            <span>Workspace Settings</span>
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          {/* Change Status */}
          <button 
            onClick={handleChangeStatus}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
          >
            <Archive className="h-4 w-4" />
            <span>{workspace.status === "ACTIVE" ? "Deactivate" : "Activate"} Workspace</span>
          </button>
          
          {/* Duplicate Workspace */}
          <button 
            onClick={handleDuplicateWorkspace}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
          >
            <Copy className="h-4 w-4" />
            <span>Duplicate Workspace</span>
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          {/* Delete Workspace */}
          <button 
            onClick={handleDeleteWorkspace}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
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

${workspace.status === 'ACTIVE' 
  ? 'Deactivating will make this workspace inaccessible to all users until reactivated.' 
  : 'Activating will restore access to this workspace for all users.'}`}
        confirmButtonText={workspace.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
    </div>
  );
}