import React, { useState, useEffect } from 'react';
import { X, Share2, User, Copy, Eye, Download, Edit, Settings, Check, Search, UserPlus, Calendar, Clock, Trash2 } from 'lucide-react';
import { apiService, listUsers } from '../../services/api';
import { FileUpload, User as UserType } from '../../types';

interface FileSharingModalProps {
  file: FileUpload;
  onClose: () => void;
}

interface SharePermission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  permission: 'view' | 'download' | 'edit' | 'admin';
  grantedAt: string;
  expiresAt?: string;
}

export const FileSharingModal: React.FC<FileSharingModalProps> = ({
  file,
  onClose
}) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [sharedUsers, setSharedUsers] = useState<SharePermission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'download' | 'edit' | 'admin'>('view');
  const [shareLink, setShareLink] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUsers();
    loadSharedUsers();
    generateShareLink();
  }, [file.id]);

  const loadUsers = async () => {
    try {
      const userList = await listUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSharedUsers = async () => {
    try {
      const shared = await apiService.getFilePermissions(file.id);
      setSharedUsers(shared);
    } catch (error) {
      console.error('Error loading shared users:', error);
    }
  };

  const generateShareLink = async () => {
    try {
      const result = await apiService.generateShareLink(file.id);
      setShareLink(result.link);
    } catch (error) {
      console.error('Error generating share link:', error);
    }
  };

  const handleShareWithUsers = async () => {
    if (selectedUsers.length === 0) return;

    setLoading(true);
    try {
      await apiService.shareFile(file.id, selectedUsers, selectedPermission, expiryDate);
      await loadSharedUsers();
      setSelectedUsers([]);
      setSelectedPermission('view');
      setExpiryDate('');
    } catch (error) {
      console.error('Error sharing file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      await apiService.removeFilePermission(file.id, permissionId);
      await loadSharedUsers();
    } catch (error) {
      console.error('Error removing permission:', error);
    }
  };

  const handleUpdatePermission = async (permissionId: string, newPermission: string) => {
    try {
      await apiService.updateFilePermission(file.id, permissionId, newPermission);
      await loadSharedUsers();
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const handleTogglePublic = async () => {
    try {
      if (isPublic) {
        await apiService.makeFilePrivate(file.id);
      } else {
        await apiService.makeFilePublic(file.id);
      }
      setIsPublic(!isPublic);
      await generateShareLink();
    } catch (error) {
      console.error('Error toggling public access:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'view': return <Eye className="h-4 w-4" />;
      case 'download': return <Download className="h-4 w-4" />;
      case 'edit': return <Edit className="h-4 w-4" />;
      case 'admin': return <Settings className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'view': return 'text-blue-600';
      case 'download': return 'text-green-600';
      case 'edit': return 'text-orange-600';
      case 'admin': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Share2 className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Share File
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {file.originalName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Public Link Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Public Link
              </h3>
              <button
                onClick={handleTogglePublic}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  isPublic
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {isPublic ? <Eye className="h-4 w-4" /> : <X className="h-4 w-4" />}
                <span>{isPublic ? 'Public' : 'Private'}</span>
              </button>
            </div>
            
            {isPublic && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => copyToClipboard(shareLink)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Share with Users Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Share with Users
            </h3>
            
            {/* User Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* User List */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedUsers.includes(user.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(prev => [...prev, user.id]);
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Permission and Expiry Settings */}
            {selectedUsers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Permission Level
                  </label>
                  <select
                    value={selectedPermission}
                    onChange={(e) => setSelectedPermission(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="view">View Only</option>
                    <option value="download">Download</option>
                    <option value="edit">Edit</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Share Button */}
            {selectedUsers.length > 0 && (
              <button
                onClick={handleShareWithUsers}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? 'Sharing...' : `Share with ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>

          {/* Currently Shared Users */}
          {sharedUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Currently Shared ({sharedUsers.length})
              </h3>
              <div className="space-y-2">
                {sharedUsers.map(permission => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {permission.userName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {permission.userEmail}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className={`${getPermissionColor(permission.permission)}`}>
                          {getPermissionIcon(permission.permission)}
                        </span>
                        <select
                          value={permission.permission}
                          onChange={(e) => handleUpdatePermission(permission.id, e.target.value)}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="view">View</option>
                          <option value="download">Download</option>
                          <option value="edit">Edit</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(permission.grantedAt)}</span>
                        </div>
                        {permission.expiresAt && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Expires: {formatDate(permission.expiresAt)}</span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleRemovePermission(permission.id)}
                        className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 