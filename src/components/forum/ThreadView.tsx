import React, { useState, useEffect } from 'react';
import { X, Reply, Edit3, Trash2, Pin, Lock, ThumbsUp, ThumbsDown, CheckCircle, MessageCircle, Save } from 'lucide-react';
import { ForumThread, ForumReply } from '../../types';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/auth';

interface ThreadViewProps {
  thread: ForumThread;
  onClose: () => void;
  onUpdate: (thread: ForumThread) => void;
  onDelete: (threadId: string) => void;
}

export const ThreadView: React.FC<ThreadViewProps> = ({
  thread,
  onClose,
  onUpdate,
  onDelete
}) => {
  const { user } = useAuthStore();
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [editingReply, setEditingReply] = useState<ForumReply | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyLoading, setReplyLoading] = useState(false);
  const [threadData, setThreadData] = useState<ForumThread>(thread);

  useEffect(() => {
    loadReplies();
  }, [thread.id]);

  const loadReplies = async () => {
    try {
      setLoading(true);
      const threadReplies = await apiService.getForumReplies(thread.id);
      setReplies(threadReplies);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: 'upvote' | 'downvote', target: 'thread' | 'reply', id: string) => {
    try {
      if (target === 'thread') {
        const updatedThread = type === 'upvote' 
          ? await apiService.upvoteThread(id)
          : await apiService.downvoteThread(id);
        setThreadData(updatedThread);
        onUpdate(updatedThread);
      } else {
        const updatedReply = type === 'upvote'
          ? await apiService.upvoteReply(id)
          : await apiService.downvoteReply(id);
        setReplies(prev => prev.map(reply => 
          reply.id === id ? updatedReply : reply
        ));
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handlePinThread = async () => {
    try {
      const updatedThread = threadData.isPinned 
        ? await apiService.unpinForumThread(thread.id)
        : await apiService.pinForumThread(thread.id);
      setThreadData(updatedThread);
      onUpdate(updatedThread);
    } catch (error) {
      console.error('Error pinning thread:', error);
    }
  };

  const handleLockThread = async () => {
    try {
      const updatedThread = threadData.isLocked 
        ? await apiService.unlockForumThread(thread.id)
        : await apiService.lockForumThread(thread.id);
      setThreadData(updatedThread);
      onUpdate(updatedThread);
    } catch (error) {
      console.error('Error locking thread:', error);
    }
  };

  const handleAcceptReply = async (replyId: string) => {
    try {
      const updatedReply = await apiService.acceptReply(replyId);
      setReplies(prev => prev.map(reply => 
        reply.id === replyId ? updatedReply : reply
      ));
    } catch (error) {
      console.error('Error accepting reply:', error);
    }
  };

  const handleSubmitReply = async () => {
    if (!newReply.trim()) return;

    try {
      setReplyLoading(true);
      const replyData = { threadId: thread.id, content: newReply.trim(), authorId: user?.id || '', parentReplyId: undefined, attachments: [], isAccepted: false, isEdited: false };

      const savedReply = await apiService.createForumReply(replyData);
      setReplies(prev => [...prev, savedReply]);
      setNewReply('');
      setShowReplyEditor(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleEditReply = async (replyId: string, content: string) => {
    try {
      const updatedReply = await apiService.updateForumReply(replyId, { content });
      setReplies(prev => prev.map(reply => 
        reply.id === replyId ? updatedReply : reply
      ));
      setEditingReply(null);
    } catch (error) {
      console.error('Error updating reply:', error);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    try {
      await apiService.deleteForumReply(replyId);
      setReplies(prev => prev.filter(reply => reply.id !== replyId));
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
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

  const canModerate = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const canEdit = user?.id === thread.authorId || canModerate;
  const canDelete = user?.id === thread.authorId || canModerate;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {threadData.isPinned && <Pin className="h-5 w-5 text-yellow-500" />}
              {threadData.isLocked && <Lock className="h-5 w-5 text-red-500" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {threadData.title}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                <span>by {threadData.author.name}</span>
                <span>{formatDate(threadData.createdAt)}</span>
                <span>{threadData.viewsCount} views</span>
                <span>{replies.length} replies</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {canModerate && (
              <>
                <button
                  onClick={handlePinThread}
                  className={`p-2 rounded-lg transition-colors ${
                    threadData.isPinned 
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title={threadData.isPinned ? 'Unpin Thread' : 'Pin Thread'}
                >
                  <Pin className="h-4 w-4" />
                </button>
                <button
                  onClick={handleLockThread}
                  className={`p-2 rounded-lg transition-colors ${
                    threadData.isLocked 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title={threadData.isLocked ? 'Unlock Thread' : 'Lock Thread'}
                >
                  {threadData.isLocked ? <Lock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </button>
              </>
            )}
            {canEdit && (
              <button
                onClick={() => {
                  // This button is removed as per the edit hint
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Edit Thread"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this thread?')) {
                    onDelete(thread.id);
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                title="Delete Thread"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Thread Content */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-4">
                {/* Voting */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => handleVote('upvote', 'thread', thread.id)}
                    className={`p-1 rounded transition-colors ${
                      threadData.upvotes > 0 ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <ThumbsUp className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {threadData.upvotes - threadData.downvotes}
                  </span>
                  <button
                    onClick={() => handleVote('downvote', 'thread', thread.id)}
                    className={`p-1 rounded transition-colors ${
                      threadData.downvotes > 0 ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <ThumbsDown className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="prose dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: threadData.content }} />
                  </div>
                  
                  {/* Tags */}
                  {threadData.tags.length > 0 && (
                    <div className="flex flex-wrap items-center space-x-2 mt-4">
                      {threadData.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Attachments */}
                  {threadData.attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Attachments</h4>
                      <div className="space-y-2">
                        {threadData.attachments.map(attachment => (
                          <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <img src={attachment.url} alt={attachment.originalName} className="h-4 w-4 text-gray-400" />
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {attachment.originalName}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Replies */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Replies ({replies.length})
                </h3>
                {!threadData.isLocked && (
                  <button
                    onClick={() => setShowReplyEditor(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </button>
                )}
              </div>

              {replies.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    No replies yet. Be the first to respond!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {replies.map(reply => (
                    <div key={reply.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        {/* Voting */}
                        <div className="flex flex-col items-center space-y-2">
                          <button
                            onClick={() => handleVote('upvote', 'reply', reply.id)}
                            className={`p-1 rounded transition-colors ${
                              reply.upvotes > 0 ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {reply.upvotes - reply.downvotes}
                          </span>
                          <button
                            onClick={() => handleVote('downvote', 'reply', reply.id)}
                            className={`p-1 rounded transition-colors ${
                              reply.downvotes > 0 ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {reply.author.name}
                              </span>
                              {reply.isAccepted && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(reply.createdAt)}
                              </span>
                              {reply.isEdited && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">(edited)</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {canModerate && !reply.isAccepted && (
                                <button
                                  onClick={() => handleAcceptReply(reply.id)}
                                  className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                  title="Accept Answer"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {(user?.id === reply.authorId || canModerate) && (
                                <>
                                  <button
                                    onClick={() => setEditingReply(reply)}
                                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    title="Edit Reply"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReply(reply.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    title="Delete Reply"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {editingReply?.id === reply.id ? (
                            <div className="space-y-4">
                              <textarea
                                value={editingReply.content}
                                onChange={(e) => setEditingReply({ ...editingReply, content: e.target.value })}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                rows={4}
                              />
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditReply(reply.id, editingReply.content)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingReply(null)}
                                  className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="prose dark:prose-invert max-w-none">
                              <div dangerouslySetInnerHTML={{ __html: reply.content }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reply Editor */}
        {showReplyEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Write a Reply</h3>
                  <button
                    onClick={() => setShowReplyEditor(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={6}
                  placeholder="Write your reply here..."
                />

                <div className="flex items-center justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowReplyEditor(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReply}
                    disabled={replyLoading || !newReply.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {replyLoading ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 