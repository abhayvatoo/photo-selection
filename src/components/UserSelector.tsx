'use client';

import { User } from '@/types';

interface UserSelectorProps {
  users: User[];
  currentUser: User | null;
  onUserSelect: (user: User) => void;
}

export default function UserSelector({ users, currentUser, onUserSelect }: UserSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Select Your Identity</h3>
      <div className="flex flex-wrap gap-2">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onUserSelect(user)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
              currentUser?.id === user.id
                ? 'text-white shadow-lg transform scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: currentUser?.id === user.id ? user.color : undefined,
            }}
          >
            {user.name}
          </button>
        ))}
      </div>
      {currentUser && (
        <p className="mt-3 text-sm text-gray-600">
          You are selecting as <span className="font-semibold" style={{ color: currentUser.color }}>
            {currentUser.name}
          </span>
        </p>
      )}
    </div>
  );
}
