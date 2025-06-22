import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Video, 
  BookOpen, 
  HardDrive,
  RefreshCw,
  Trash2,
  Settings,
  Info,
  Play,
  Pause,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { apiService } from '../../services/api';
import { Course, Lesson, Material } from '../../types';

interface OfflineContent {
  id: string;
  type: 'course' | 'lesson' | 'material';
  title: string;
  description?: string;
  size: number;
  downloadedAt: string;
  lastAccessed: string;
  isAvailable: boolean;
  progress?: number;
  courseId?: string;
  lessonId?: string;
}

interface DownloadProgress {
  id: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error' | 'paused';
  error?: string;
}

interface OfflineManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineManager: React.FC<OfflineManagerProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuthStore();
  const [offlineContent, setOfflineContent] = useState<OfflineContent[]>([]);
  const [downloadQueue, setDownloadQueue] = useState<DownloadProgress[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0 });
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadOfflineContent();
      loadCourses();
      checkStorageUsage();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineContent = async () => {
    try {
      const content = await apiService.getOfflineContent();
      setOfflineContent(content);
    } catch (error) {
      console.error('Error loading offline content:', error);
      // Load from localStorage as fallback
      const stored = localStorage.getItem('offlineContent');
      if (stored) {
        setOfflineContent(JSON.parse(stored));
      }
    }
  };

  const loadCourses = async () => {
    try {
      const userCourses = await apiService.getMyCourses();
      setCourses(userCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const checkStorageUsage = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        setStorageUsage({
          used: estimate.usage || 0,
          total: estimate.quota || 0
        });
      } catch (error) {
        console.error('Error checking storage usage:', error);
      }
    }
  };

  const downloadCourse = async (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const downloadId = `course-${courseId}`;
    
    // Add to download queue
    setDownloadQueue(prev => [...prev, {
      id: downloadId,
      progress: 0,
      status: 'downloading'
    }]);

    try {
      // Prepare course content for offline
      const offlineData = await apiService.prepareOfflineContent(courseId);
      
      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setDownloadQueue(prev => prev.map(item => 
          item.id === downloadId 
            ? { ...item, progress: i }
            : item
        ));
      }

      // Store in localStorage (in real app, use IndexedDB)
      const content: OfflineContent = {
        id: courseId,
        type: 'course',
        title: course.title,
        description: course.description,
        size: offlineData.size || 1024 * 1024, // 1MB default
        downloadedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        isAvailable: true,
        courseId: courseId
      };

      setOfflineContent(prev => [...prev, content]);
      localStorage.setItem('offlineContent', JSON.stringify([...offlineContent, content]));

      // Update download queue
      setDownloadQueue(prev => prev.map(item => 
        item.id === downloadId 
          ? { ...item, progress: 100, status: 'completed' }
          : item
      ));

      // Remove from queue after delay
      setTimeout(() => {
        setDownloadQueue(prev => prev.filter(item => item.id !== downloadId));
      }, 2000);

    } catch (error) {
      console.error('Error downloading course:', error);
      setDownloadQueue(prev => prev.map(item => 
        item.id === downloadId 
          ? { ...item, status: 'error', error: 'Download failed' }
          : item
      ));
    }
  };

  const downloadLesson = async (lessonId: string, courseId: string) => {
    const downloadId = `lesson-${lessonId}`;
    
    setDownloadQueue(prev => [...prev, {
      id: downloadId,
      progress: 0,
      status: 'downloading'
    }]);

    try {
      const lesson = await apiService.getLesson(lessonId);
      const offlineData = await apiService.prepareOfflineContent(lessonId);

      // Simulate download progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 150));
        setDownloadQueue(prev => prev.map(item => 
          item.id === downloadId 
            ? { ...item, progress: i }
            : item
        ));
      }

      const content: OfflineContent = {
        id: lessonId,
        type: 'lesson',
        title: lesson.title,
        description: lesson.content.substring(0, 100) + '...',
        size: offlineData.size || 512 * 1024, // 512KB default
        downloadedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        isAvailable: true,
        courseId: courseId,
        lessonId: lessonId
      };

      setOfflineContent(prev => [...prev, content]);
      localStorage.setItem('offlineContent', JSON.stringify([...offlineContent, content]));

      setDownloadQueue(prev => prev.map(item => 
        item.id === downloadId 
          ? { ...item, progress: 100, status: 'completed' }
          : item
      ));

      setTimeout(() => {
        setDownloadQueue(prev => prev.filter(item => item.id !== downloadId));
      }, 2000);

    } catch (error) {
      console.error('Error downloading lesson:', error);
      setDownloadQueue(prev => prev.map(item => 
        item.id === downloadId 
          ? { ...item, status: 'error', error: 'Download failed' }
          : item
      ));
    }
  };

  const removeOfflineContent = async (contentId: string) => {
    try {
      // Remove from localStorage
      const updatedContent = offlineContent.filter(item => item.id !== contentId);
      setOfflineContent(updatedContent);
      localStorage.setItem('offlineContent', JSON.stringify(updatedContent));

      // Update last accessed time
      setOfflineContent(prev => prev.map(item => 
        item.id === contentId 
          ? { ...item, lastAccessed: new Date().toISOString() }
          : item
      ));

    } catch (error) {
      console.error('Error removing offline content:', error);
    }
  };

  const syncOfflineData = async () => {
    if (!isOnline) return;

    setSyncStatus('syncing');
    try {
      // Get offline changes from localStorage
      const offlineChanges = localStorage.getItem('offlineChanges');
      if (offlineChanges) {
        const changes = JSON.parse(offlineChanges);
        await apiService.syncOfflineData(changes);
        localStorage.removeItem('offlineChanges');
      }

      // Refresh offline content
      await loadOfflineContent();
      setSyncStatus('completed');

      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Error syncing offline data:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
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

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="h-5 w-5" />;
      case 'lesson': return <FileText className="h-5 w-5" />;
      case 'material': return <Video className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getDownloadStatus = (contentId: string) => {
    return downloadQueue.find(item => item.id === contentId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <HardDrive className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Offline Content Manager</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
                <span>•</span>
                <span>{formatFileSize(storageUsage.used)} / {formatFileSize(storageUsage.total)} used</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={syncOfflineData}
              disabled={!isOnline || syncStatus === 'syncing'}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Download Content */}
          <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Download Content</h3>
            
            {/* Course Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Choose a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            {/* Download Options */}
            {selectedCourse && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Download Options</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => downloadCourse(selectedCourse)}
                      disabled={getDownloadStatus(`course-${selectedCourse}`)?.status === 'downloading'}
                      className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">Full Course</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">All lessons and materials</div>
                        </div>
                      </div>
                      {getDownloadStatus(`course-${selectedCourse}`)?.status === 'downloading' ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {getDownloadStatus(`course-${selectedCourse}`)?.progress}%
                          </span>
                        </div>
                      ) : (
                        <Download className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Download Queue */}
            {downloadQueue.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Download Queue</h4>
                <div className="space-y-2">
                  {downloadQueue.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {item.status === 'downloading' && (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {item.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {item.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm text-gray-900 dark:text-white">{item.id}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.status === 'downloading' && (
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                        )}
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {item.status === 'completed' ? 'Done' : 
                           item.status === 'error' ? 'Failed' : 
                           `${item.progress}%`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Offline Content */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Offline Content</h3>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {offlineContent.length} items
              </span>
            </div>

            {offlineContent.length === 0 ? (
              <div className="text-center py-12">
                <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No offline content</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Download courses and lessons to access them offline
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {offlineContent.map(content => (
                  <div key={content.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getContentIcon(content.type)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{content.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {content.type} • {formatFileSize(content.size)} • Downloaded {formatDate(content.downloadedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeOfflineContent(content.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Remove from offline storage"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center space-x-4">
              <span>Storage: {formatFileSize(storageUsage.used)} / {formatFileSize(storageUsage.total)}</span>
              <span>•</span>
              <span>{offlineContent.length} items available offline</span>
            </div>
            <div className="flex items-center space-x-2">
              {syncStatus === 'syncing' && (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Syncing...</span>
                </div>
              )}
              {syncStatus === 'completed' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Synced successfully</span>
                </div>
              )}
              {syncStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Sync failed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 