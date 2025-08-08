'use client';

import { useState } from 'react';
import { Users, Camera, Calendar, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { WorkspaceStatus } from '@prisma/client';
import Link from 'next/link';

interface WorkspaceCardProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: WorkspaceStatus;
    createdAt: Date;
    users: Array<{
      id: string;
      name: string | null;
      email: string;
      role: string;
      createdAt: Date;
    }>;
    photos: Array<{
      id: number;
      createdAt: Date;
    }>;
    _count: {
      users: number;
      photos: number;
    };
  };
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const getStatusColor = (status: WorkspaceStatus) => {
    switch (status) {
      case WorkspaceStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case WorkspaceStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      case WorkspaceStatus.SUSPENDED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {workspace.name}
          </h3>
          <p className="text-sm text-gray-500">/{workspace.slug}</p>
          {workspace.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {workspace.description}
            </p>
          )}
        </div>
        
        {/* Status Badge */}
        <div className="relative">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workspace.status)}`}>
            {workspace.status.toLowerCase()}
          </span>
          
          {/* Dropdown Menu */}
          <div className="relative ml-2 inline-block">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <Link
                    href={`/admin/workspaces/${workspace.id}`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                  <Link
                    href={`/admin/workspaces/${workspace.id}/edit`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Workspace
                  </Link>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => {
                      // Handle delete - implement later
                      console.log('Delete workspace:', workspace.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2 text-blue-500" />
          <span>{workspace._count.users} users</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Camera className="h-4 w-4 mr-2 text-purple-500" />
          <span>{workspace._count.photos} photos</span>
        </div>
      </div>

      {/* Recent Users */}
      {workspace.users.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Recent Users</p>
          <div className="flex -space-x-2">
            {workspace.users.slice(0, 4).map((user) => (
              <div
                key={user.id}
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                title={user.name || user.email}
              >
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
            ))}
            {workspace.users.length > 4 && (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                +{workspace.users.length - 4}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          Created {formatDate(workspace.createdAt)}
        </div>
        <Link
          href={`/workspace/${workspace.slug}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View Workspace →
        </Link>
      </div>
    </div>
  );
}
