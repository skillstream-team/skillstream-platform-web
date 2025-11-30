import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, ThumbsUp, ThumbsDown, Reply, MoreVertical, Edit3, Trash2, Flag, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

interface Question {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  timestamp: string;
  upvotes: number;
  downvotes: number;
  replies: Reply[];
  isResolved?: boolean;
  userVote?: 'up' | 'down' | null;
}

interface Reply {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  timestamp: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  isInstructor?: boolean;
}

interface LessonQandAProps {
  lessonId: string;
  courseId?: string;
}

export const LessonQandA: React.FC<LessonQandAProps> = ({ lessonId, courseId }) => {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [lessonId]);

  const loadQuestions = () => {
    // Load from localStorage (in production, this would be an API call)
    const saved = localStorage.getItem(`lesson-qa-${lessonId}`);
    if (saved) {
      try {
        setQuestions(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading questions:', error);
        setQuestions([]);
      }
    } else {
      setQuestions([]);
    }
  };

  const saveQuestions = (newQuestions: Question[]) => {
    localStorage.setItem(`lesson-qa-${lessonId}`, JSON.stringify(newQuestions));
    setQuestions(newQuestions);
  };

  const handlePostQuestion = () => {
    if (!newQuestion.trim() || !user) return;

    const question: Question = {
      id: Date.now().toString(),
      content: newQuestion.trim(),
      author: {
        id: user.id,
        name: user.name || 'Anonymous',
        avatarUrl: user.avatarUrl
      },
      timestamp: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      replies: [],
      isResolved: false,
      userVote: null
    };

    saveQuestions([question, ...questions]);
    setNewQuestion('');
  };

  const handlePostReply = (questionId: string) => {
    if (!replyContent.trim() || !user) return;

    const reply: Reply = {
      id: Date.now().toString(),
      content: replyContent.trim(),
      author: {
        id: user.id,
        name: user.name || 'Anonymous',
        avatarUrl: user.avatarUrl
      },
      timestamp: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      isInstructor: user.role === 'TEACHER'
    };

    const updated = questions.map(q =>
      q.id === questionId
        ? { ...q, replies: [...q.replies, reply] }
        : q
    );

    saveQuestions(updated);
    setReplyingTo(null);
    setReplyContent('');
  };

  const handleVote = (questionId: string, type: 'up' | 'down', isReply: boolean = false, replyId?: string) => {
    if (!user) return;

    const updated = questions.map(q => {
      if (q.id === questionId) {
        if (isReply && replyId) {
          const updatedReplies = q.replies.map(r => {
            if (r.id === replyId) {
              const currentVote = r.userVote;
              let newUpvotes = r.upvotes;
              let newDownvotes = r.downvotes;
              let newVote: 'up' | 'down' | null = type;

              if (currentVote === type) {
                // Remove vote
                newVote = null;
                if (type === 'up') newUpvotes--;
                else newDownvotes--;
              } else if (currentVote) {
                // Change vote
                if (currentVote === 'up') newUpvotes--;
                else newDownvotes--;
                if (type === 'up') newUpvotes++;
                else newDownvotes++;
              } else {
                // New vote
                if (type === 'up') newUpvotes++;
                else newDownvotes++;
              }

              return { ...r, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newVote };
            }
            return r;
          });
          return { ...q, replies: updatedReplies };
        } else {
          const currentVote = q.userVote;
          let newUpvotes = q.upvotes;
          let newDownvotes = q.downvotes;
          let newVote: 'up' | 'down' | null = type;

          if (currentVote === type) {
            newVote = null;
            if (type === 'up') newUpvotes--;
            else newDownvotes--;
          } else if (currentVote) {
            if (currentVote === 'up') newUpvotes--;
            else newDownvotes--;
            if (type === 'up') newUpvotes++;
            else newDownvotes++;
          } else {
            if (type === 'up') newUpvotes++;
            else newDownvotes++;
          }

          return { ...q, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newVote };
        }
      }
      return q;
    });

    saveQuestions(updated);
  };

  const handleResolve = (questionId: string) => {
    const updated = questions.map(q =>
      q.id === questionId ? { ...q, isResolved: !q.isResolved } : q
    );
    saveQuestions(updated);
  };

  const handleDelete = (questionId: string, replyId?: string) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;

    if (replyId) {
      const updated = questions.map(q =>
        q.id === questionId
          ? { ...q, replies: q.replies.filter(r => r.id !== replyId) }
          : q
      );
      saveQuestions(updated);
    } else {
      saveQuestions(questions.filter(q => q.id !== questionId));
    }
    setShowMenu(null);
  };

  const handleEdit = (questionId: string, replyId?: string) => {
    if (replyId) {
      const question = questions.find(q => q.id === questionId);
      const reply = question?.replies.find(r => r.id === replyId);
      if (reply) {
        setEditContent(reply.content);
        setEditingId(replyId);
      }
    } else {
      const question = questions.find(q => q.id === questionId);
      if (question) {
        setEditContent(question.content);
        setEditingId(questionId);
      }
    }
    setShowMenu(null);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;

    const updated = questions.map(q => {
      if (q.id === editingId) {
        return { ...q, content: editContent.trim() };
      }
      if (q.replies.some(r => r.id === editingId)) {
        return {
          ...q,
          replies: q.replies.map(r =>
            r.id === editingId ? { ...r, content: editContent.trim() } : r
          )
        };
      }
      return q;
    });

    saveQuestions(updated);
    setEditingId(null);
    setEditContent('');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 7) return date.toLocaleDateString();
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-white rounded-lg border-2" style={{ borderColor: '#E5E7EB' }}>
      <div className="p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
        <h3 className="text-xl font-bold" style={{ color: '#0B1E3F' }}>
          Questions & Answers
        </h3>
        <p className="text-sm mt-1" style={{ color: '#6F73D2' }}>
          Ask questions and get help from instructors and other students
        </p>
      </div>

      {/* Post Question */}
      <div className="p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-start space-x-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
            style={{ backgroundColor: '#00B5AD' }}
          >
            {user ? getInitials(user.name || 'U') : '?'}
          </div>
          <div className="flex-1">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ask a question about this lesson..."
              className="w-full p-3 border-2 rounded-lg resize-none focus:outline-none transition-all"
              style={{
                borderColor: '#E5E7EB',
                backgroundColor: 'white',
                color: '#0B1E3F',
                minHeight: '80px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00B5AD';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 181, 173, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handlePostQuestion}
              disabled={!newQuestion.trim()}
              className="mt-3 flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: newQuestion.trim() ? '#00B5AD' : '#9CA3AF',
                boxShadow: newQuestion.trim() ? '0 4px 14px rgba(0, 181, 173, 0.3)' : 'none'
              }}
            >
              <Send className="h-4 w-4" />
              <span>Post Question</span>
            </button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="divide-y" style={{ borderColor: '#E5E7EB' }}>
        {questions.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: '#9CA3AF' }} />
            <p className="text-sm" style={{ color: '#6F73D2' }}>
              No questions yet. Be the first to ask!
            </p>
          </div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="p-6">
              <div className="flex items-start space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: question.isResolved ? '#10B981' : '#00B5AD' }}
                >
                  {getInitials(question.author.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm" style={{ color: '#0B1E3F' }}>
                          {question.author.name}
                        </span>
                        {question.isResolved && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 bg-green-100 rounded-full text-xs font-medium" style={{ color: '#059669' }}>
                            <CheckCircle className="h-3 w-3" />
                            <span>Resolved</span>
                          </span>
                        )}
                        <span className="text-xs" style={{ color: '#6F73D2' }}>
                          {formatTime(question.timestamp)}
                        </span>
                      </div>
                      {editingId === question.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 border-2 rounded-lg resize-none"
                            style={{ borderColor: '#E5E7EB' }}
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1.5 text-sm rounded-lg text-white"
                              style={{ backgroundColor: '#00B5AD' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditContent('');
                              }}
                              className="px-3 py-1.5 text-sm rounded-lg border-2"
                              style={{ borderColor: '#E5E7EB', color: '#0B1E3F' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm mb-3" style={{ color: '#0B1E3F' }}>
                          {question.content}
                        </p>
                      )}
                    </div>
                    {user && (user.id === question.author.id || user.role === 'TEACHER') && (
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === question.id ? null : question.id)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" style={{ color: '#6F73D2' }} />
                        </button>
                        {showMenu === question.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border-2 z-10" style={{ borderColor: '#E5E7EB' }}>
                            <button
                              onClick={() => handleEdit(question.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                              style={{ color: '#0B1E3F' }}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            {user.role === 'TEACHER' && (
                              <button
                                onClick={() => handleResolve(question.id)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                                style={{ color: '#0B1E3F' }}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>{question.isResolved ? 'Unresolve' : 'Mark Resolved'}</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(question.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center space-x-2"
                              style={{ color: '#EF4444' }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Vote and Reply */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVote(question.id, 'up')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                          question.userVote === 'up' ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <ThumbsUp className={`h-4 w-4 ${question.userVote === 'up' ? 'fill-current' : ''}`} style={{ color: question.userVote === 'up' ? '#00B5AD' : '#6F73D2' }} />
                        <span className="text-xs font-medium" style={{ color: '#0B1E3F' }}>
                          {question.upvotes}
                        </span>
                      </button>
                      <button
                        onClick={() => handleVote(question.id, 'down')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                          question.userVote === 'down' ? 'bg-red-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <ThumbsDown className={`h-4 w-4 ${question.userVote === 'down' ? 'fill-current' : ''}`} style={{ color: question.userVote === 'down' ? '#EF4444' : '#6F73D2' }} />
                        <span className="text-xs font-medium" style={{ color: '#0B1E3F' }}>
                          {question.downvotes}
                        </span>
                      </button>
                    </div>
                    <button
                      onClick={() => setReplyingTo(replyingTo === question.id ? null : question.id)}
                      className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                    >
                      <Reply className="h-4 w-4" style={{ color: '#6F73D2' }} />
                      <span className="text-xs font-medium" style={{ color: '#0B1E3F' }}>
                        Reply ({question.replies.length})
                      </span>
                    </button>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === question.id && (
                    <div className="ml-13 mb-4">
                      <div className="flex items-start space-x-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs flex-shrink-0"
                          style={{ backgroundColor: '#00B5AD' }}
                        >
                          {user ? getInitials(user.name || 'U') : '?'}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full p-2 border-2 rounded-lg resize-none focus:outline-none"
                            style={{ borderColor: '#E5E7EB', minHeight: '60px' }}
                            rows={2}
                          />
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handlePostReply(question.id)}
                              disabled={!replyContent.trim()}
                              className="px-3 py-1.5 text-sm rounded-lg font-medium text-white disabled:opacity-50"
                              style={{ backgroundColor: '#00B5AD' }}
                            >
                              Post Reply
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                              }}
                              className="px-3 py-1.5 text-sm rounded-lg font-medium border-2"
                              style={{ borderColor: '#E5E7EB', color: '#0B1E3F' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {question.replies.length > 0 && (
                    <div className="ml-13 space-y-4 mt-4">
                      {question.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs flex-shrink-0 ${
                              reply.isInstructor ? 'ring-2 ring-yellow-400' : ''
                            }`}
                            style={{ backgroundColor: reply.isInstructor ? '#F59E0B' : '#6F73D2' }}
                          >
                            {getInitials(reply.author.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-xs" style={{ color: '#0B1E3F' }}>
                                  {reply.author.name}
                                </span>
                                {reply.isInstructor && (
                                  <span className="px-2 py-0.5 bg-yellow-100 rounded-full text-xs font-medium" style={{ color: '#D97706' }}>
                                    Instructor
                                  </span>
                                )}
                                <span className="text-xs" style={{ color: '#6F73D2' }}>
                                  {formatTime(reply.timestamp)}
                                </span>
                              </div>
                              {user && (user.id === reply.author.id || user.role === 'TEACHER') && (
                                <div className="relative">
                                  <button
                                    onClick={() => setShowMenu(showMenu === reply.id ? null : reply.id)}
                                    className="p-1 rounded hover:bg-gray-100"
                                  >
                                    <MoreVertical className="h-3 w-3" style={{ color: '#6F73D2' }} />
                                  </button>
                                  {showMenu === reply.id && (
                                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border-2 z-10" style={{ borderColor: '#E5E7EB' }}>
                                      <button
                                        onClick={() => handleEdit(question.id, reply.id)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center space-x-2"
                                        style={{ color: '#0B1E3F' }}
                                      >
                                        <Edit3 className="h-3 w-3" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={() => handleDelete(question.id, reply.id)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 flex items-center space-x-2"
                                        style={{ color: '#EF4444' }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {editingId === reply.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="w-full p-2 border-2 rounded-lg resize-none text-sm"
                                  style={{ borderColor: '#E5E7EB' }}
                                  rows={2}
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="px-2 py-1 text-xs rounded-lg text-white"
                                    style={{ backgroundColor: '#00B5AD' }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditContent('');
                                    }}
                                    className="px-2 py-1 text-xs rounded-lg border-2"
                                    style={{ borderColor: '#E5E7EB', color: '#0B1E3F' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs mb-2" style={{ color: '#0B1E3F' }}>
                                {reply.content}
                              </p>
                            )}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleVote(question.id, 'up', true, reply.id)}
                                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs ${
                                  reply.userVote === 'up' ? 'bg-blue-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <ThumbsUp className={`h-3 w-3 ${reply.userVote === 'up' ? 'fill-current' : ''}`} style={{ color: reply.userVote === 'up' ? '#00B5AD' : '#6F73D2' }} />
                                <span>{reply.upvotes}</span>
                              </button>
                              <button
                                onClick={() => handleVote(question.id, 'down', true, reply.id)}
                                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs ${
                                  reply.userVote === 'down' ? 'bg-red-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <ThumbsDown className={`h-3 w-3 ${reply.userVote === 'down' ? 'fill-current' : ''}`} style={{ color: reply.userVote === 'down' ? '#EF4444' : '#6F73D2' }} />
                                <span>{reply.downvotes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

