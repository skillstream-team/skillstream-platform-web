import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Pin, 
  Clock, 
  User, 
  Eye, 
  MessageCircle,
  TrendingUp,
  Bookmark,
  MoreHorizontal,
  Edit3,
  Trash2,
  Flag,
  Lock,
  Unlock,
  Tag,
  Calendar,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { apiService } from '../../services/api';
import { ForumThread, ForumCategory, User as UserType } from '../../types';
import { ThreadEditor } from './ThreadEditor';
import { ThreadView } from './ThreadView';

interface ForumBoardProps {
  courseId: string;
  courseTitle?: string;
}

export const ForumBoard: React.FC<ForumBoardProps> = ({ courseId, courseTitle }) => {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');
  const [loading, setLoading] = useState(true);
  const [showThreadEditor, setShowThreadEditor] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [showThreadView, setShowThreadView] = useState(false);
  const [filterPinned, setFilterPinned] = useState(false);

  useEffect(() => {
    loadForumData();
  }, [courseId]);

  const loadForumData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const forumCategories = await apiService.getForumCategories(courseId);
      setCategories(forumCategories);
      
      // Load threads
      const forumThreads = await apiService.getForumThreads(courseId);
      setThreads(forumThreads);
    } catch (error) {
      console.error('Error loading forum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = threads.filter(thread => {
    // Category filter
    if (selectedCategory !== 'all' && thread.categoryId !== selectedCategory) {
      return false;
    }
    
    // Search filter
    if (searchQuery && !thread.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !thread.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Pinned filter
    if (filterPinned && !thread.isPinned) {
      return false;
    }
    
    return true;
  });

  const sortedThreads = [...filteredThreads].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        return (b.repliesCount + b.viewsCount) - (a.repliesCount + a.viewsCount);
      case 'unanswered':
        return a.repliesCount - b.repliesCount;
      default:
        return 0;
    }
  });

  const handleCreateThread = () => {
    setShowThreadEditor(true);
  };

  const handleThreadCreated = (newThread: ForumThread) => {
    setThreads(prev => [newThread, ...prev]);
    setShowThreadEditor(false);
  };

  const handleThreadClick = (thread: ForumThread) => {
    setSelectedThread(thread);
    setShowThreadView(true);
  };

  const handleThreadUpdated = (updatedThread: ForumThread) => {
    setThreads(prev => prev.map(thread => 
      thread.id === updatedThread.id ? updatedThread : thread
    ));
    setShowThreadView(false);
    setSelectedThread(null);
  };

  const handleThreadDeleted = (threadId: string) => {
    setThreads(prev => prev.filter(thread => thread.id !== threadId));
    setShowThreadView(false);
    setSelectedThread(null);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'General';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
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
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Course Forum
                </h1>
                {courseTitle && (
                  <p className="text-gray-600 dark:text-gray-300">{courseTitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleCreateThread}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All Discussions
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                      <span>{category.name}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Filters</h4>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filterPinned}
                    onChange={(e) => setFilterPinned(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Pinned only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Sort */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search discussions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                    <option value="unanswered">Unanswered</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Threads List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {sortedThreads.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No discussions found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {searchQuery || selectedCategory !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Be the first to start a discussion!'
                    }
                  </p>
                  {!searchQuery && selectedCategory === 'all' && (
                    <button
                      onClick={handleCreateThread}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start Discussion
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedThreads.map(thread => (
                    <div
                      key={thread.id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => handleThreadClick(thread)}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Thread Status */}
                        <div className="flex flex-col items-center space-y-1">
                          {thread.isPinned && (
                            <Pin className="h-4 w-4 text-yellow-500" />
                          )}
                          {thread.isLocked && (
                            <Lock className="h-4 w-4 text-red-500" />
                          )}
                          <div className="flex flex-col items-center">
                            <ThumbsUp className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {thread.upvotes}
                            </span>
                          </div>
                        </div>

                        {/* Thread Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(thread.categoryId)} text-white`}>
                              {getCategoryName(thread.categoryId)}
                            </span>
                            {thread.isPinned && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs">
                                Pinned
                              </span>
                            )}
                            {thread.isLocked && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs">
                                Locked
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400">
                            {thread.title}
                          </h3>
                          
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                            {thread.content}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>{thread.author.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(thread.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>{thread.repliesCount} replies</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{thread.viewsCount} views</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showThreadEditor && (
        <ThreadEditor
          courseId={courseId}
          categories={categories}
          onClose={() => setShowThreadEditor(false)}
          onSave={handleThreadCreated}
        />
      )}

      {showThreadView && selectedThread && (
        <ThreadView
          thread={selectedThread}
          onClose={() => {
            setShowThreadView(false);
            setSelectedThread(null);
          }}
          onUpdate={handleThreadUpdated}
          onDelete={handleThreadDeleted}
        />
      )}
    </div>
  );
}; 