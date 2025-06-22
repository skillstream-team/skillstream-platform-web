import React, { useState } from 'react';
import { FileManager } from '../components/file-management/FileManager';
import { BackButton } from '../components/common/BackButton';
import { useAuthStore } from '../store/auth';
import { 
  Folder, 
  Users, 
  User, 
  BookOpen,
  Grid,
  List,
  Search,
  Filter,
  Plus,
  Upload,
  FolderPlus,
  Settings,
  Star,
  Clock,
  Calendar
} from 'lucide-react';

export const FileManagementPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeMode, setActiveMode] = useState<'course' | 'personal' | 'shared'>('personal');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const modes = [
    {
      id: 'personal',
      name: 'My Files',
      icon: <User className="h-5 w-5" />,
      description: 'Your personal file storage'
    },
    {
      id: 'course',
      name: 'Course Materials',
      icon: <BookOpen className="h-5 w-5" />,
      description: 'Files shared in your courses'
    },
    {
      id: 'shared',
      name: 'Shared with Me',
      icon: <Users className="h-5 w-5" />,
      description: 'Files shared by others'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <BackButton showHome />
              <Folder className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  File Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Organize and share your files
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </button>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileManager mode="personal" />
      </div>
    </div>
  );
}; 