import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Video, Link as LinkIcon, X, Send, Upload, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { getRecentResources, shareResourceInLesson, uploadAndShareFile } from '../../services/api';

interface Resource {
  id: string;
  type: 'file' | 'image' | 'video' | 'link';
  name: string;
  url: string;
  size?: number;
}

interface QuickResourceShareProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (resource: Resource) => void;
  isTeacher: boolean;
  lessonId: string;
}

export const QuickResourceShare: React.FC<QuickResourceShareProps> = ({
  isOpen,
  onClose,
  onShare,
  isTeacher,
  lessonId
}) => {
  const { user } = useAuthStore();
  const [linkUrl, setLinkUrl] = useState('');
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRecentResources();
    }
  }, [isOpen]);

  const loadRecentResources = async () => {
    try {
      if (!user?.id) {
        setRecentResources([]);
        return;
      }
      const resources = await getRecentResources(user.id);
      setRecentResources(resources as Resource[]);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const shareLink = async () => {
    if (!linkUrl.trim()) return;

    try {
      setUploading(true);
      setError('');
      const resourceData = {
        type: 'link',
        name: linkUrl,
        url: linkUrl
      };
      const sharedResource = await shareResourceInLesson(lessonId, resourceData);
      
      const resource: Resource = {
        id: sharedResource.id || `link-${Date.now()}`,
        type: 'link',
        name: sharedResource.name || linkUrl,
        url: sharedResource.url || linkUrl
      };
      
      onShare(resource);
      setLinkUrl('');
      // Reload recent resources to show the newly shared one
      await loadRecentResources();
    } catch (error: any) {
      console.error('Error sharing resource:', error);
      setError(error?.response?.data?.message || 'Failed to share link. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const shareFile = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError('');
      const uploadedResource = await uploadAndShareFile(lessonId, selectedFile);
      
      const resource: Resource = {
        id: uploadedResource.id || `file-${Date.now()}`,
        type: selectedFile.type.startsWith('image/') ? 'image' :
              selectedFile.type.startsWith('video/') ? 'video' : 'file',
        name: uploadedResource.name || selectedFile.name,
        url: uploadedResource.url || uploadedResource.downloadUrl || URL.createObjectURL(selectedFile),
        size: uploadedResource.size || selectedFile.size
      };

      onShare(resource);
      setSelectedFile(null);
      // Reload recent resources to show the newly shared one
      await loadRecentResources();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError(error?.response?.data?.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const shareRecentResource = async (resource: Resource) => {
    try {
      setUploading(true);
      setError('');
      const resourceData = {
        type: resource.type,
        name: resource.name,
        url: resource.url
      };
      await shareResourceInLesson(lessonId, resourceData);
      onShare(resource);
    } catch (error: any) {
      console.error('Error sharing resource:', error);
      setError(error?.response?.data?.message || 'Failed to share resource. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'link': return <LinkIcon className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Share Resource</h2>
                <p className="text-blue-100 text-sm">
                  Quickly share files, images, or links with students
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Share Link */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Share a Link
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={shareLink}
                disabled={!linkUrl.trim() || uploading}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{uploading ? 'Sharing...' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* Upload File */}
          {isTeacher && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Upload & Share File
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    Images, Videos, PDFs, Documents
                  </span>
                </label>
                {selectedFile && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getResourceIcon(
                        selectedFile.type.startsWith('image/') ? 'image' :
                        selectedFile.type.startsWith('video/') ? 'video' : 'file'
                      )}
                      <span className="text-sm text-gray-900 dark:text-white">
                        {selectedFile.name}
                      </span>
                    </div>
                    <button
                      onClick={shareFile}
                      disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Uploading...' : 'Share'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Resources */}
          {recentResources.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Recent Resources
              </label>
              <div className="grid grid-cols-2 gap-3">
                {recentResources.map((resource) => (
                  <button
                    key={resource.id}
                    onClick={() => shareRecentResource(resource)}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all text-left"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {resource.name}
                      </div>
                      {resource.size && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {(resource.size / 1024).toFixed(1)} KB
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

