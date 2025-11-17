import React from 'react';
import { StudyGroups } from '../components/collaboration/StudyGroups';

export const PeopleGroupsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudyGroups />
      </div>
    </div>
  );
}; 