import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Folder, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Download,
  Share2,
  Edit3,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  MoreHorizontal,
  Plus,
  Users,
  Eye,
  Lock,
  Unlock,
  Star,
  Calendar,
  Clock,
  User,
  Copy,
  Link,
  Settings,
  FolderPlus,
  Move,
  Tag
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { FileUpload, Course, User as UserType } from '../../types';

interface FileCategory {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
}

interface FileManagerProps {
  courseId?: string;
  userId?: string;
  mode: 'course' | 'personal' | 'shared';
}

export const FileManager: React.FC<FileManagerProps> = ({
  courseId,
  userId,
  mode
}) => {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const categories: FileCategory[] = [
    { id: 'documents', name: 'Documents', color: 'bg-blue-500', icon: <FileText className="h-4 w-4" /> },
    { id: 'images', name: 'Images', color: 'bg-green-500', icon: <Image className="h-4 w-4" /> },
    { id: 'videos', name: 'Videos', color: 'bg-purple-500', icon: <Video className="h-4 w-4" /> },
    { id: 'audio', name: 'Audio', color: 'bg-yellow-500', icon: <Music className="h-4 w-4" /> },
    { id: 'archives', name: 'Archives', color: 'bg-red-500', icon: <Archive className="h-4 w-4" /> },
    { id: 'other', name: 'Other', color: 'bg-gray-500', icon: <File className="h-4 w-4" /> }
  ];

  useEffect(() => {
    loadFiles();
  }, [courseId, userId, mode, currentPath]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      let fileData: FileUpload[] = [];
      
      // Mock data for demonstration
      const mockFiles: FileUpload[] = [
        {
          id: '1',
          filename: 'intro_programming.pdf',
          originalName: 'Introduction to Programming.pdf',
          mimeType: 'application/pdf',
          size: 2048576,
          url: '#',
          uploadedBy: 'John Doe',
          createdAt: '2024-01-10T09:00:00Z'
        },
        {
          id: '2',
          filename: 'web_dev_basics.docx',
          originalName: 'Web Development Basics.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1048576,
          url: '#',
          uploadedBy: 'Jane Smith',
          createdAt: '2024-01-12T11:00:00Z'
        },
        {
          id: '3',
          filename: 'sample_image.jpg',
          originalName: 'Sample Image.jpg',
          mimeType: 'image/jpeg',
          size: 512000,
          url: '#',
          uploadedBy: 'Mike Johnson',
          createdAt: '2024-01-13T16:45:00Z'
        },
        {
          id: '4',
          filename: 'tutorial_video.mp4',
          originalName: 'Tutorial Video.mp4',
          mimeType: 'video/mp4',
          size: 52428800,
          url: '#',
          uploadedBy: 'Sarah Wilson',
          createdAt: '2024-01-08T13:30:00Z'
        }
      ];
      
      switch (mode) {
        case 'course':
          if (courseId) {
            try {
              fileData = await apiService.getCourseFiles(courseId, currentPath.join('/'));
            } catch (error) {
              console.log('Using mock data for course files');
              fileData = mockFiles.filter(f => f.mimeType.includes('pdf') || f.mimeType.includes('word'));
            }
          }
          break;
        case 'personal':
          try {
            fileData = await apiService.getUserFiles(user?.id || '', currentPath.join('/'));
          } catch (error) {
            console.log('Using mock data for personal files');
            fileData = mockFiles;
          }
          break;
        case 'shared':
          try {
            fileData = await apiService.getSharedFiles(user?.id || '');
          } catch (error) {
            console.log('Using mock data for shared files');
            fileData = mockFiles.slice(0, 2); // Show first 2 files as shared
          }
          break;
      }
      
      setFiles(fileData);
    } catch (error) {
      console.error('Error loading files:', error);
      // Set empty array if all else fails
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setShowUploadModal(true);
    // Handle file upload logic will be in the modal
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
      'audio/*': ['.mp3', '.wav', '.flac', '.aac'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    multiple: true
  });

  const handleFileUpload = async (files: File[], category: string, tags: string[]) => {
    try {
      const uploadPromises = files.map(async (file) => {
        const fileId = `${Date.now()}-${Math.random()}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        const uploadedFile = await apiService.uploadFile(file, mode, {
          courseId,
          userId: user?.id,
          category,
          tags,
          path: currentPath.join('/'),
          onProgress: (progress) => {
            setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          }
        });

        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

        return uploadedFile;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles(prev => [...uploadedFiles, ...prev]);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await apiService.deleteFile(fileId);
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleFileShare = (file: FileUpload) => {
    // TODO: Implement file sharing modal
    console.log('Share file:', file.originalName);
    alert(`Sharing ${file.originalName} - Feature coming soon!`);
  };

  const handleFileDetails = (file: FileUpload) => {
    // TODO: Implement file details modal
    console.log('View file details:', file.originalName);
    alert(`File Details for ${file.originalName} - Feature coming soon!`);
  };

  const handleFileDownload = async (file: FileUpload) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(file => file.id));
    }
  };

  const getFileIcon = (file: FileUpload) => {
    const mimeType = file.mimeType;
    if (mimeType.startsWith('image/')) return <Image className="h-6 w-6 text-green-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-6 w-6 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-6 w-6 text-yellow-500" />;
    if (mimeType === 'application/pdf') return <FileText className="h-6 w-6 text-red-500" />;
    if (mimeType.includes('word')) return <FileText className="h-6 w-6 text-blue-500" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="h-6 w-6 text-green-600" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-6 w-6 text-orange-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
  };

  const getFileCategory = (file: FileUpload) => {
    const mimeType = file.mimeType;
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf' || mimeType.includes('word') || mimeType.includes('excel')) return 'documents';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archives';
    return 'other';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || getFileCategory(file) === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.originalName.localeCompare(b.originalName);
        break;
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'type':
        comparison = a.mimeType.localeCompare(b.mimeType);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const navigateToFolder = (folderName: string) => {
    setCurrentPath(prev => [...prev, folderName]);
  };

  const navigateBack = () => {
    setCurrentPath(prev => prev.slice(0, -1));
  };

  const navigateToRoot = () => {
    setCurrentPath([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Folder className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  File Manager
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {mode === 'course' ? 'Course Materials' : mode === 'personal' ? 'My Files' : 'Shared Files'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  // TODO: Implement upload modal
                  alert('File upload feature coming soon!');
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </button>
              <button
                onClick={() => {
                  // TODO: Implement folder creation
                  alert('Folder creation feature coming soon!');
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={navigateToRoot}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Home
            </button>
            {currentPath.map((folder, index) => (
              <React.Fragment key={index}>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {folder}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Types</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="type">Type</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Mode */}
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            or click to select files
          </p>
        </div>

        {/* Files Grid/List */}
        {sortedFiles.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No files found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchQuery || filterCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Upload your first file to get started'
              }
            </p>
            {!searchQuery && filterCategory === 'all' && (
              <button
                onClick={() => {
                  // TODO: Implement upload modal
                  alert('File upload feature coming soon!');
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-2'}>
            {sortedFiles.map(file => (
              <div
                key={file.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow ${
                  selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleFileSelect(file.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <div className="relative">
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      {getFileIcon(file)}
                      <h3 className="font-medium text-gray-900 dark:text-white mt-2 truncate">
                        {file.originalName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatDate(file.createdAt)}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleFileDownload(file)}
                          className="p-1 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleFileShare(file)}
                          className="p-1 hover:text-green-600 dark:hover:text-green-400"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleFileDetails(file)}
                          className="p-1 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // List View
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => handleFileSelect(file.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    
                    {getFileIcon(file)}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {file.originalName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleFileDownload(file)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleFileShare(file)}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleFileDetails(file)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleFileDelete(file.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals - Temporarily disabled */}
      {/* 
      {showUploadModal && (
        <FileUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleFileUpload}
          categories={categories}
          uploadProgress={uploadProgress}
        />
      )}

      {showSharingModal && selectedFile && (
        <FileSharingModal
          file={selectedFile}
          onClose={() => {
            setShowSharingModal(false);
            setSelectedFile(null);
          }}
        />
      )}

      {showDetailsModal && selectedFile && (
        <FileDetailsModal
          file={selectedFile}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedFile(null);
          }}
          onDelete={() => {
            handleFileDelete(selectedFile.id);
            setShowDetailsModal(false);
            setSelectedFile(null);
          }}
        />
      )}
      */}
    </div>
  );
}; 