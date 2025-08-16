'use client';

import { useState } from 'react';
import { MoreVertical, Edit, Settings, Archive, Copy, Trash2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  const handleEditWorkspace = () => {
    // For now, we'll show an alert and redirect to workspace settings
    alert(`Edit workspace: ${workspace.name}\n\nThis will open the workspace settings page.`);
    router.push(`/workspace/${workspace.slug}/settings`);
    setIsOpen(false);
  };

  const handleManageMembers = () => {
    alert(`Manage members for: ${workspace.name}\n\nThis will open the members management page.`);
    router.push(`/workspace/${workspace.slug}/members`);
    setIsOpen(false);
  };

  const handleWorkspaceSettings = () => {
    alert(`Workspace settings for: ${workspace.name}\n\nThis will open the settings page.`);
    router.push(`/workspace/${workspace.slug}/settings`);
    setIsOpen(false);
  };

  const handleChangeStatus = async () => {
    const newStatus = workspace.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = workspace.status === 'ACTIVE' ? 'deactivate' : 'activate';
    
    if (confirm(`Are you sure you want to ${action} "${workspace.name}"?`)) {
      try {
        const response = await fetch(`/api/workspaces/${workspace.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          alert(`Workspace "${workspace.name}" has been ${action}d successfully.`);
          router.refresh();
        } else {
          alert('Failed to update workspace status. Please try again.');
        }
      } catch (error) {
        alert('An error occurred. Please try again.');
      }
    }
    setIsOpen(false);
  };

  const handleDuplicateWorkspace = () => {
    const newName = prompt(`Enter a name for the duplicate workspace:`, `${workspace.name} Copy`);
    if (newName && newName.trim()) {
      alert(`Duplicating workspace: ${workspace.name}\nNew name: ${newName}\n\nThis feature will create a copy with the same settings.`);
      // TODO: Implement workspace duplication API
    }
    setIsOpen(false);
  };

  const handleDeleteWorkspace = () => {
    const confirmText = `DELETE ${workspace.name}`;
    const userInput = prompt(
      `⚠️ WARNING: This action cannot be undone!\n\nThis will permanently delete "${workspace.name}" and all its data including:\n- All photos\n- All user selections\n- All workspace settings\n\nTo confirm deletion, type: ${confirmText}`
    );

    if (userInput === confirmText) {
      alert(`Workspace "${workspace.name}" will be deleted.\n\nThis would call the deletion API.`);
      // TODO: Implement workspace deletion API
    } else if (userInput !== null) {
      alert('Deletion cancelled - confirmation text did not match.');
    }
    setIsOpen(false);
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
    </div>
  );
}