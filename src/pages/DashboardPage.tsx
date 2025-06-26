import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardWidgets } from '../components/dashboard/DashboardWidgets';
import { useAuthStore } from '../store/auth';
import { Activity } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    // Mock data - replace with actual API call
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Welcome back, {user?.name}! {user?.role === 'TEACHER' ? "Here's your creation overview!" : "Here's your learning overview"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/analytics"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Activity className="h-4 w-4 mr-2" />
                View Reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardWidgets />
      </div>
    </div>
  );
}; 