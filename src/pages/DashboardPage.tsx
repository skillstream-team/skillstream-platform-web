import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardWidgets } from '../components/dashboard/DashboardWidgets';
import { useAuthStore } from '../store/auth';
import { Activity } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.role === 'TEACHER' ? 'Creation Overview!' : 'Learning Overview'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {user?.role === 'TEACHER' 
                    ? 'Track your course performance and student engagement'
                    : 'Track your learning progress and achievements'
                  }
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