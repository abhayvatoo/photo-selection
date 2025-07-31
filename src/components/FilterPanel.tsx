'use client';

import { User } from '@/types';
import { Filter, X } from 'lucide-react';

interface FilterPanelProps {
  users: User[];
  filterUsers: string[];
  onFilterChange: (userIds: string[]) => void;
}

export default function FilterPanel({ users, filterUsers, onFilterChange }: FilterPanelProps) {
  const handleUserToggle = (userId: string) => {
    const newFilter = filterUsers.includes(userId)
      ? filterUsers.filter(id => id !== userId)
      : [...filterUsers, userId];
    onFilterChange(newFilter);
  };

  const clearFilters = () => {
    onFilterChange([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filter by User Selections</h3>
        </div>
        {filterUsers.length > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {users.map((user) => {
          const isSelected = filterUsers.includes(user.id);
          return (
            <button
              key={user.id}
              onClick={() => handleUserToggle(user.id)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: isSelected ? user.color : undefined,
              }}
            >
              {user.name}
            </button>
          );
        })}
      </div>
      
      {filterUsers.length > 0 && (
        <p className="mt-3 text-sm text-gray-600">
          Showing photos selected by: {filterUsers.map(id => {
            const user = users.find(u => u.id === id);
            return user?.name;
          }).join(', ')}
        </p>
      )}
      
      {filterUsers.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">
          Showing all photos. Select users above to filter by their selections.
        </p>
      )}
    </div>
  );
}
