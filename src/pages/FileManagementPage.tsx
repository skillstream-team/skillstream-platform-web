import { FileManager } from '../components/file-management/FileManager';
import { BackButton } from '../components/common/BackButton';
import { 
  Folder,
  Upload,
  FolderPlus
} from 'lucide-react';

export const FileManagementPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
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
              <button className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </button>
              <button className="flex items-center px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold">
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
