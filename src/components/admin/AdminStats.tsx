'use client';

import { Users, Building2, Camera, UserCheck, Activity } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    totalWorkspaces: number;
    totalUsers: number;
    totalPhotos: number;
    totalClients: number;
    activeWorkspaces: number;
  };
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    {
      title: 'Total Workspaces',
      value: stats.totalWorkspaces,
      icon: Building2,
      color: 'bg-blue-500',
      description: `${stats.activeWorkspaces} active`,
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-green-500',
      description: `${stats.totalClients} clients`,
    },
    {
      title: 'Total Photos',
      value: stats.totalPhotos,
      icon: Camera,
      color: 'bg-purple-500',
      description: 'Across all workspaces',
    },
    {
      title: 'Active Clients',
      value: stats.totalClients,
      icon: UserCheck,
      color: 'bg-orange-500',
      description: 'Paying customers',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
