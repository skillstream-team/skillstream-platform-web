import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Announcement, Course } from '../../types';
import { getCourseByIdWithLanguage, getAnnouncements, createAnnouncement, deleteAnnouncement } from '../../services/api';
import { ArrowLeftIcon, PlusIcon, ExclamationTriangleIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/auth';

const CourseAnnouncementsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [scheduledAnnouncements, setScheduledAnnouncements] = useState<Array<Announcement & { scheduledAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    title: '', 
    content: '',
    isScheduled: false,
    scheduledDate: '',
    scheduledTime: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      loadCourseAndAnnouncements();
      loadScheduledAnnouncements();
    }
  }, [courseId]);
  
  useEffect(() => {
    // Check for scheduled announcements that should be sent
    const interval = setInterval(() => {
      checkScheduledAnnouncements();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [scheduledAnnouncements, courseId]);
  
  const loadScheduledAnnouncements = () => {
    if (!courseId) return;
    try {
      const stored = localStorage.getItem(`scheduled-announcements-${courseId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setScheduledAnnouncements(parsed);
      }
    } catch (error) {
      console.error('Error loading scheduled announcements:', error);
    }
  };
  
  const saveScheduledAnnouncements = (announcements: Array<Announcement & { scheduledAt: string }>) => {
    if (!courseId) return;
    try {
      localStorage.setItem(`scheduled-announcements-${courseId}`, JSON.stringify(announcements));
      setScheduledAnnouncements(announcements);
    } catch (error) {
      console.error('Error saving scheduled announcements:', error);
    }
  };
  
  const checkScheduledAnnouncements = async () => {
    if (!courseId) return;
    const now = new Date();
    const toSend = scheduledAnnouncements.filter(sa => {
      const scheduledDate = new Date(sa.scheduledAt);
      return scheduledDate <= now;
    });
    
    if (toSend.length > 0) {
      for (const announcement of toSend) {
        try {
          await createAnnouncement(
            Number(courseId),
            announcement.title,
            announcement.content
          );
          // Remove from scheduled
          const updated = scheduledAnnouncements.filter(sa => sa.id !== announcement.id);
          saveScheduledAnnouncements(updated);
        } catch (error) {
          console.error('Error sending scheduled announcement:', error);
        }
      }
    }
  };

  const loadCourseAndAnnouncements = async () => {
    try {
      setLoading(true);
      const [courseData, announcementsData] = await Promise.all([
        getCourseByIdWithLanguage(Number(courseId)),
        getAnnouncements(Number(courseId))
      ]);
      setCourse(courseData);
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Failed to load course or announcements:', error);
      setError('Failed to load course information');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    if (newAnnouncement.isScheduled) {
      if (!newAnnouncement.scheduledDate || !newAnnouncement.scheduledTime) {
        setError('Please select both date and time for scheduled announcement');
        return;
      }
      
      const scheduledDateTime = new Date(`${newAnnouncement.scheduledDate}T${newAnnouncement.scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        setError('Scheduled date and time must be in the future');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');
      
      if (newAnnouncement.isScheduled) {
        // Save as scheduled announcement
        const scheduledDateTime = new Date(`${newAnnouncement.scheduledDate}T${newAnnouncement.scheduledTime}`);
        const scheduledAnnouncement: Announcement & { scheduledAt: string } = {
          id: Date.now().toString(),
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          courseId: courseId!,
          authorId: user?.id || '',
          author: {
            id: user?.id || '',
            name: user?.name || 'Teacher',
            avatar: user?.avatar
          },
          isPinned: false,
          isLocked: false,
          isSticky: false,
          upvotes: 0,
          downvotes: 0,
          viewsCount: 0,
          repliesCount: 0,
          tags: [],
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          scheduledAt: scheduledDateTime.toISOString()
        };
        
        const updated = [...scheduledAnnouncements, scheduledAnnouncement];
        saveScheduledAnnouncements(updated);
      } else {
        // Create immediately
        const announcement = await createAnnouncement(
          Number(courseId),
          newAnnouncement.title,
          newAnnouncement.content
        );
        setAnnouncements(prev => [announcement, ...prev]);
      }
      
      setNewAnnouncement({ title: '', content: '', isScheduled: false, scheduledDate: '', scheduledTime: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create announcement:', error);
      setError('Failed to create announcement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancelScheduled = (announcementId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled announcement?')) return;
    const updated = scheduledAnnouncements.filter(sa => sa.id !== announcementId);
    saveScheduledAnnouncements(updated);
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!courseId) return;
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteAnnouncement(Number(courseId), announcementId);
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      setError('Failed to delete announcement');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Course not found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The course you're looking for doesn't exist or you don't have access to it.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/courses')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Course
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Announcements</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Stay updated with the latest news and updates for "{course.title}"
              </p>
            </div>
            {user && course.teacherId === user.id && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Announcement
              </button>
            )}
          </div>
        </div>

        {/* Create Announcement Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create New Announcement
            </h2>
            <form onSubmit={handleCreateAnnouncement}>
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter announcement title..."
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter announcement content..."
                  required
                />
              </div>

              {/* Schedule Option */}
              <div className="mb-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAnnouncement.isScheduled}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, isScheduled: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Schedule for later
                  </span>
                </label>
                
                {newAnnouncement.isScheduled && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <CalendarIcon className="w-4 h-4 inline mr-1" />
                        Date *
                      </label>
                      <input
                        type="date"
                        value={newAnnouncement.scheduledDate}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, scheduledDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        required={newAnnouncement.isScheduled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <ClockIcon className="w-4 h-4 inline mr-1" />
                        Time *
                      </label>
                      <input
                        type="time"
                        value={newAnnouncement.scheduledTime}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        required={newAnnouncement.isScheduled}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewAnnouncement({ title: '', content: '', isScheduled: false, scheduledDate: '', scheduledTime: '' });
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Announcement'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Scheduled Announcements */}
        {scheduledAnnouncements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Scheduled Announcements
            </h2>
            <div className="space-y-4">
              {scheduledAnnouncements.map((announcement) => {
                const scheduledDate = new Date(announcement.scheduledAt);
                return (
                  <div
                    key={announcement.id}
                    className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {announcement.title}
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200 rounded-full">
                            Scheduled
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                          {announcement.content}
                        </p>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          Scheduled for: {scheduledDate.toLocaleString()}
                        </div>
                      </div>
                      {user && course.teacherId === user.id && (
                        <button
                          onClick={() => handleCancelScheduled(announcement.id)}
                          className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Published Announcements
          </h2>
          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No announcements</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                There are no announcements for this course yet.
              </p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {announcement.title}
                        </h3>
                      </div>
                      
                      <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-400 mb-4">
                        <p className="whitespace-pre-wrap">{announcement.content}</p>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          {announcement.author.name}
                        </div>
                        <div className="flex items-center">
                          {new Date(announcement.createdAt).toLocaleDateString()} at{' '}
                          {new Date(announcement.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    {user && announcement.authorId === user.id && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                          // onClick={() => handleEditAnnouncement(announcement.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="inline-flex items-center text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseAnnouncementsPage; 