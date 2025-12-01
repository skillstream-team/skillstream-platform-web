import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, Zap, BarChart3, Search, Grid, List, Star, Clock, Users, Edit3, X, Save,
  Filter, SlidersHorizontal, ChevronDown, Image as ImageIcon, Upload, Trash2, Copy, Eye, MoreVertical, MessageSquare,
  GraduationCap, TrendingUp, CheckSquare, Square, Check
} from 'lucide-react';
import { Course } from '../../types';
import { useAuthStore } from '../../store/auth';
import { getCourses, getTeacherCourses, createCourse, apiService, duplicateCourse, getCoursePreview, sendBulkMessageToStudents } from '../../services/api';
import { MobileCourseCard } from '../../components/mobile/MobileCourseCard';
import { BottomSheet } from '../../components/mobile/BottomSheet';
import { RichTextEditor } from '../../components/editor/RichTextEditor';
import { useNotification } from '../../hooks/useNotification';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Tooltip } from '../../components/common/Tooltip';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useUndo } from '../../hooks/useUndo';
import { UndoButton } from '../../components/common/UndoButton';

export const CoursesPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isTeacher = user?.role === 'TEACHER';
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    level: '',
    price: '',
    category: '',
    status: ''
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [focusedSearch, setFocusedSearch] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: '',
    // Additional metadata to make course creation more complete
    level: '' as '' | 'Beginner' | 'Intermediate' | 'Advanced',
    duration: '',
    status: 'draft' as 'draft' | 'published',
    imageUrl: '' as string | undefined,
    imageFile: null as File | null
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [courseMenuOpen, setCourseMenuOpen] = useState<string | null>(null);
  const [duplicatingCourseId, setDuplicatingCourseId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [bulkMessageCourseId, setBulkMessageCourseId] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState({ subject: '', content: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { addAction, undo, canUndo, getLastAction } = useUndo();
  
  // Use a per-user storage key so drafts are isolated per teacher
  const draftStorageKey = user?.id ? `course-draft:${user.id}` : undefined;
  
  // Auto-save for course creation
  const { loadDraft, clearDraft } = useAutoSave({
    data: newCourse,
    onSave: async (data) => {
      // Just save to localStorage, actual save happens on submit
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    },
    interval: 30000,
    // Only save drafts for the currently logged-in teacher
    storageKey: showCreateModal ? draftStorageKey : undefined,
    enabled: showCreateModal && (newCourse.title.trim().length > 0 || newCourse.description.trim().length > 0),
    debounceMs: 2000
  });
  
  // Load draft on modal open
  useEffect(() => {
    if (showCreateModal) {
      console.log('Create course modal opened, showCreateModal =', showCreateModal);
      const draft = loadDraft();
      if (draft) {
        console.log('Draft found, restoring...', draft);
        // Auto-restore draft without blocking confirmation
        setNewCourse(draft);
      } else {
        console.log('No draft found, starting fresh');
      }
    } else {
      clearDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateModal]);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery, filters]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('create') === 'true' && isTeacher) {
      setShowCreateModal(true);
      navigate('/courses', { replace: true });
    }
  }, [location.search, isTeacher, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseMenuOpen && !(event.target as Element).closest('.course-menu-container')) {
        setCourseMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [courseMenuOpen]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      let coursesData;
      
      if (isTeacher) {
        if (!user?.id) {
          console.error('User ID is required to load teacher courses');
          setCourses([]);
          return;
        }
        coursesData = await getTeacherCourses(user.id);
      } else {
        coursesData = await getCourses();
      }
      
      setCourses(coursesData || []);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      setCourses([]);
      // Error is handled gracefully - empty state will be shown
    } finally {
      setIsLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.level) {
      filtered = filtered.filter(course => {
        if (filters.level === 'BEGINNER') return course.level === 'Beginner';
        if (filters.level === 'INTERMEDIATE') return course.level === 'Intermediate';
        if (filters.level === 'ADVANCED') return course.level === 'Advanced';
        return true;
      });
    }

    if (filters.price) {
      filtered = filtered.filter(course => {
        if (filters.price === 'FREE') return !course.isPaid;
        if (filters.price === 'PAID') return course.isPaid;
        return true;
      });
    }

    if (filters.category) {
      filtered = filtered.filter(course => 
        course.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (isTeacher && filters.status) {
      filtered = filtered.filter(course => {
        if (filters.status === 'ACTIVE') return course.isActive !== false;
        if (filters.status === 'DRAFT') return course.isActive === false;
        if (filters.status === 'PUBLISHED') return course.isPublished === true;
        return true;
      });
    }

    setFilteredCourses(filtered);
  };

  const getCourseImage = (course: Course) => {
    return course.imageUrl || 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=200&fit=crop';
  };

  const getEnrollmentStats = (course: Course) => {
    const totalStudents = course.enrolledStudents || course.enrollments?.length || 0;
    const activeStudents = (course as any).activeStudents ?? totalStudents;
    const completionRate = course.completionRate ?? 0;
    return { totalStudents, activeStudents, completionRate };
  };

  const getTopPerformingCourses = () => {
    return courses
      .filter(course => course.status === 'published' && typeof course.revenue === 'number')
      .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
      .slice(0, 3);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const uploadedFile = await apiService.uploadFile(file, 'course-banner', {});
      setNewCourse(prev => ({ 
        ...prev, 
        imageUrl: uploadedFile.url,
        imageFile: file
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Upload Failed', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('File Too Large', 'Image size must be less than 5MB. Please choose a smaller file.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showError('Invalid File Type', 'Please select an image file (JPG, PNG, etc.)');
        return;
      }
      handleImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setNewCourse(prev => ({ 
      ...prev, 
      imageUrl: undefined,
      imageFile: null
    }));
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleCreateCourse = async () => {
    try {
      // Check authentication
      if (!user?.id) {
        showError('Authentication Required', 'You must be logged in to create a course');
        return;
      }

      // Check if user is a teacher
      if (user.role !== 'TEACHER') {
        showError('Permission Denied', 'Only teachers can create courses. Please contact support if you believe this is an error.');
        return;
      }

      // Verify token exists
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Authentication Required', 'Your session has expired. Please log in again.');
        return;
      }

      if (!newCourse.title.trim()) {
        showError('Missing Information', 'Please enter a course title');
        return;
      }

      // Description is optional but if provided, use it
      const description = newCourse.description || '';

      // Build payload according to API signature
      // Note: Backend might expect numeric IDs, so we'll try both string and number
      const userId = user.id;
      const payload: any = {
        title: newCourse.title.trim(),
        description: description.trim() || undefined, // Make it undefined if empty
        // For now all courses are created as free on the platform
        price: 0,
        order: courses.length,
        createdBy: userId,
        instructorId: userId
      };
      
      // Add optional fields only if they have values
      if (newCourse.imageUrl) {
        payload.imageUrl = newCourse.imageUrl;
      }
      
      // Note: these fields are not formally in the API signature, but the backend
      // may accept or ignore them. We send them to better capture course metadata.
      if (newCourse.category) {
        payload.category = newCourse.category;
      }
      if (newCourse.level) {
        payload.level = newCourse.level;
      }
      if (newCourse.duration) {
        payload.duration = newCourse.duration;
      }
      if (newCourse.status) {
        payload.status = newCourse.status;
        // Keep isPublished in sync with status if backend uses it
        payload.isPublished = newCourse.status === 'published';
      }

      console.log('Creating course with payload:', payload);
      
      try {
        const createdCourse = await createCourse(payload);
        setCourses(prev => [createdCourse as Course, ...prev]);
        setShowCreateModal(false);
        setNewCourse({
          title: '', 
          description: '', 
          category: '', 
          level: '',
          duration: '',
          status: 'draft',
          imageUrl: undefined,
          imageFile: null
        });
        showSuccess(
          'Course Created!',
          `"${createdCourse.title}" has been created successfully. You can now add content and publish it.`
        );
        navigate(`/courses/${createdCourse.id}`);
      } catch (apiError: any) {
        console.error('API Error creating course:', apiError);
        throw apiError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      console.error('User info:', { id: user?.id, role: user?.role, email: user?.email });
      console.error('Token exists:', !!localStorage.getItem('token'));
      console.error('Payload sent:', payload);
      
      let errorMessage = 'Failed to create course. Please try again.';
      let errorTitle = 'Failed to Create Course';
      
      if (error?.response?.status === 403) {
        errorTitle = 'Permission Denied';
        errorMessage = 'You do not have permission to create courses.\n\n' +
          'Possible reasons:\n' +
          '• Your account role is not set to TEACHER on the backend\n' +
          '• Your session token may be invalid or expired\n\n' +
          'Please try:\n' +
          '1. Log out completely\n' +
          '2. Log back in with a TEACHER account\n' +
          '3. If the issue persists, contact support';
      } else if (error?.response?.status === 401) {
        errorTitle = 'Authentication Required';
        errorMessage = 'Your session has expired or is invalid. Please log out and log back in.';
      } else if (error?.response?.status === 400) {
        errorTitle = 'Invalid Data';
        errorMessage = error?.response?.data?.message || 'Invalid course data. Please check all fields and try again.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 500) {
        errorTitle = 'Server Error';
        errorMessage = 'Server error. Please try again later.';
      } else if (!error?.response) {
        errorTitle = 'Network Error';
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showError(errorTitle, errorMessage);
      
      // Keep modal open so user can see the error and try again
    }
  };

  const handleBoostCourse = (courseId: string) => {
    navigate(`/marketing-guide?courseId=${courseId}`);
  };

  const handleDuplicateCourse = async (courseId: string) => {
    try {
      setDuplicatingCourseId(courseId);
      const duplicatedCourse = await duplicateCourse(courseId);
      setCourses(prev => [duplicatedCourse, ...prev]);
      setCourseMenuOpen(null);
      showSuccess(
        'Course Duplicated!',
        `"${duplicatedCourse.title}" has been duplicated successfully.`
      );
    } catch (error: any) {
      console.error('Error duplicating course:', error);
      showError(
        'Failed to Duplicate Course',
        error?.response?.data?.message || 'Failed to duplicate course. Please try again.'
      );
    } finally {
      setDuplicatingCourseId(null);
    }
  };

  const handlePreviewCourse = async (courseId: string) => {
    try {
      const preview = await getCoursePreview(courseId);
      setPreviewCourse(preview);
      setShowPreviewModal(true);
      setCourseMenuOpen(null);
    } catch (error: any) {
      console.error('Error loading preview:', error);
      showError(
        'Failed to Load Preview',
        'Unable to load course preview. Please try again.'
      );
    }
  };

  const handleSendBulkMessage = async () => {
    if (!bulkMessageCourseId || !bulkMessage.subject || !bulkMessage.content) {
      showError('Missing Information', 'Please fill in all fields (subject and message)');
      return;
    }

    try {
      await sendBulkMessageToStudents(bulkMessageCourseId, bulkMessage);
      showSuccess(
        'Message Sent!',
        'Your message has been sent successfully to all enrolled students.'
      );
      setShowBulkMessageModal(false);
      setBulkMessage({ subject: '', content: '' });
      setBulkMessageCourseId(null);
    } catch (error: any) {
      console.error('Error sending bulk message:', error);
      showError(
        'Failed to Send Message',
        error?.response?.data?.message || 'Failed to send message. Please try again.'
      );
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const courseToDelete = courses.find(c => c.id === courseId);
      await apiService.axios.delete(`/courses/${courseId}`, { withCredentials: true });
      
      // Add undo action
      if (courseToDelete) {
        addAction({
          type: 'delete_course',
          description: `Delete "${courseToDelete.title}"`,
          undo: async () => {
            // Restore course (would need to call API to restore)
            // For now, just show a message
            showSuccess('Course Restored', `"${courseToDelete.title}" has been restored.`);
            setCourses(prev => [...prev, courseToDelete]);
          }
        });
      }
      
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setShowDeleteConfirm(null);
      showSuccess(
        'Course Deleted',
        courseToDelete ? `"${courseToDelete.title}" has been permanently deleted.` : 'The course has been permanently deleted.'
      );
    } catch (error: any) {
      console.error('Error deleting course:', error);
      showError(
        'Failed to Delete Course',
        error?.response?.data?.message || 'Failed to delete course. Please try again.'
      );
      setShowDeleteConfirm(null);
    }
  };
  
  const handleUndo = async () => {
    try {
      await undo();
      const lastAction = getLastAction();
      if (lastAction) {
        showSuccess('Action Undone', `"${lastAction.description}" has been undone.`);
      }
    } catch (error) {
      showError('Undo Failed', 'Unable to undo the last action. Please try again.');
    }
  };

  // Bulk operations
  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    setSelectedCourses(new Set());
    setShowBulkActions(false);
  };

  const toggleCourseSelection = (courseId: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllCourses = () => {
    if (selectedCourses.size === filteredCourses.length) {
      setSelectedCourses(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedCourses(new Set(filteredCourses.map(c => c.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedCourses.size === 0) return;
    
    try {
      const promises = Array.from(selectedCourses).map(courseId =>
        apiService.axios.put(`/courses/${courseId}`, { status: 'PUBLISHED' }, { withCredentials: true })
      );
      await Promise.all(promises);
      
      setCourses(prev => prev.map(c => 
        selectedCourses.has(c.id) ? { ...c, status: 'PUBLISHED' } : c
      ));
      
      showSuccess(
        'Courses Published',
        `${selectedCourses.size} course(s) have been published successfully.`
      );
      setSelectedCourses(new Set());
      setShowBulkActions(false);
    } catch (error: any) {
      console.error('Error publishing courses:', error);
      showError(
        'Failed to Publish Courses',
        error?.response?.data?.message || 'Failed to publish courses. Please try again.'
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCourses.size === 0) return;
    
    const courseNames = courses
      .filter(c => selectedCourses.has(c.id))
      .map(c => c.title)
      .join(', ');
    
    if (window.confirm(`Are you sure you want to delete ${selectedCourses.size} course(s)? This action cannot be undone.\n\nCourses: ${courseNames}`)) {
      try {
        const promises = Array.from(selectedCourses).map(courseId =>
          apiService.axios.delete(`/courses/${courseId}`, { withCredentials: true })
        );
        await Promise.all(promises);
        
        setCourses(prev => prev.filter(c => !selectedCourses.has(c.id)));
        showSuccess(
          'Courses Deleted',
          `${selectedCourses.size} course(s) have been deleted successfully.`
        );
        setSelectedCourses(new Set());
        setShowBulkActions(false);
      } catch (error: any) {
        console.error('Error deleting courses:', error);
        showError(
          'Failed to Delete Courses',
          error?.response?.data?.message || 'Failed to delete courses. Please try again.'
        );
      }
    }
  };

  const handleBulkDuplicate = async () => {
    if (selectedCourses.size === 0) return;
    
    try {
      const promises = Array.from(selectedCourses).map(courseId =>
        duplicateCourse(courseId)
      );
      const duplicatedCourses = await Promise.all(promises);
      
      setCourses(prev => [...prev, ...duplicatedCourses]);
      showSuccess(
        'Courses Duplicated',
        `${selectedCourses.size} course(s) have been duplicated successfully.`
      );
      setSelectedCourses(new Set());
      setShowBulkActions(false);
    } catch (error: any) {
      console.error('Error duplicating courses:', error);
      showError(
        'Failed to Duplicate Courses',
        error?.response?.data?.message || 'Failed to duplicate courses. Please try again.'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      {/* Header Section */}
      <div className="courses-header">
        <div className="courses-header-content">
          <div className="courses-header-text">
            <h1 className="courses-header-title">
              {isTeacher ? 'My Courses' : 'Explore Courses'}
            </h1>
            <p className="courses-header-subtitle">
              {isTeacher 
                ? 'Manage your courses and track student progress'
                : 'Discover amazing courses and start learning'}
            </p>
          </div>
          {isTeacher && (
            <div className="flex items-center space-x-3">
              <Tooltip content={isBulkMode ? "Exit bulk mode" : "Select multiple courses"}>
                <button
                  onClick={toggleBulkMode}
                  className={`courses-create-button button-press hover-lift ${isBulkMode ? 'bg-blue-600' : ''}`}
                  style={isBulkMode ? { backgroundColor: '#2563eb' } : {}}
                >
                  {isBulkMode ? (
                    <>
                      <X className="courses-create-button-icon" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <CheckSquare className="courses-create-button-icon" />
                      Select
                    </>
                  )}
                </button>
              </Tooltip>
              <Tooltip content="Create a new course">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Create Course button clicked, opening modal...');
                    setShowCreateModal(true);
                  }}
                  className="courses-create-button button-press hover-lift"
                  type="button"
                >
                  <Plus className="courses-create-button-icon" />
                  Create Course
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Courses Section (for teachers) */}
      {isTeacher && getTopPerformingCourses().length > 0 && (
        <div className="courses-top-performing">
          <div className="courses-top-performing-header">
            <h2 className="courses-top-performing-title">
              Top Performing Courses
            </h2>
            <Link
              to="/analytics"
              className="courses-top-performing-link"
            >
              <span>View All Analytics</span>
              <ChevronDown className="courses-top-performing-link-icon" />
            </Link>
          </div>
          <div className="courses-top-performing-grid">
            {getTopPerformingCourses().map(course => (
              <div
                key={course.id}
                className="courses-top-performing-card"
              >
                <div className="courses-top-performing-card-header">
                  <h3 className="courses-top-performing-card-title">
                    {course.title}
                  </h3>
                  <button
                    onClick={() => handleBoostCourse(course.id)}
                    className="courses-top-performing-card-boost"
                  >
                    <Zap className="courses-top-performing-card-boost-icon" />
                  </button>
                </div>
                
                <div className="courses-top-performing-card-stats">
                  <div className="courses-top-performing-card-stat">
                    <span className="courses-top-performing-card-stat-label">Enrolled Students</span>
                    <span className="courses-top-performing-card-stat-value">
                      {course.enrolledStudents?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="courses-top-performing-card-stat">
                    <span className="courses-top-performing-card-stat-label">Completion Rate</span>
                    <span className="courses-top-performing-card-stat-value">
                      {course.completionRate || 0}%
                    </span>
                  </div>
                  <div className="courses-top-performing-card-stat">
                    <span className="courses-top-performing-card-stat-label">Revenue</span>
                    <span className="courses-top-performing-card-stat-value courses-top-performing-card-stat-value--revenue">
                      ${(course.revenue ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="courses-top-performing-card-actions">
                  <Link
                    to={`/courses/${course.id}`}
                    className="courses-top-performing-card-manage"
                  >
                    Manage
                  </Link>
                  <Link
                    to={`/analytics?courseId=${course.id}`}
                    className="courses-top-performing-card-analytics"
                  >
                    <BarChart3 className="courses-top-performing-card-analytics-icon" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="courses-search-filters">
        <div className="courses-search-filters-content">
          <div className="courses-search-wrapper">
            <Search 
              className={`courses-search-icon ${focusedSearch ? 'courses-search-icon--focused' : 'courses-search-icon--unfocused'}`}
            />
            <input
              type="text"
              placeholder={isTeacher ? "Search your courses..." : "Search courses..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setFocusedSearch(true)}
              onBlur={() => setFocusedSearch(false)}
              className="courses-search-input"
            />
          </div>
          
          <div className="courses-filters-actions">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`courses-filters-button ${showFilters ? 'courses-filters-button--active' : 'courses-filters-button--inactive'}`}
            >
              <SlidersHorizontal className="courses-filters-button-icon" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            
            <div className="courses-view-mode">
                <Tooltip content="Grid view">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`courses-view-mode-button button-press ${viewMode === 'grid' ? 'courses-view-mode-button--active' : 'courses-view-mode-button--inactive'}`}
                    aria-label="Grid view"
                  >
                    <Grid className="courses-view-mode-button-icon" />
                  </button>
                </Tooltip>
                <Tooltip content="List view">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`courses-view-mode-button button-press ${viewMode === 'list' ? 'courses-view-mode-button--active' : 'courses-view-mode-button--inactive'}`}
                    aria-label="List view"
                  >
                    <List className="courses-view-mode-button-icon" />
                  </button>
                </Tooltip>
            </div>
          </div>
        </div>

        {/* Desktop Filter Panel */}
        {showFilters && (
          <div className="courses-filter-panel">
            <div className="courses-filter-group">
              <label className="courses-filter-label">
                Level
              </label>
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                className="courses-filter-select"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00B5AD';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 181, 173, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                Price
              </label>
              <select
                value={filters.price}
                onChange={(e) => setFilters(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: 'white',
                  color: '#0B1E3F',
                  fontSize: '16px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00B5AD';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 181, 173, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">All Prices</option>
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            
            {isTeacher && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
                  style={{
                    borderColor: '#E5E7EB',
                    backgroundColor: 'white',
                    color: '#0B1E3F',
                    fontSize: '16px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#00B5AD';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 181, 173, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Courses"
        maxHeight="80vh"
      >
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: '#0B1E3F' }}>
              Level
            </label>
            <div className="space-y-2">
              {['', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilters(prev => ({ ...prev, level }))}
                  className={`w-full px-4 py-3 rounded-xl font-semibold text-left transition-all duration-200 ${
                    filters.level === level ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: filters.level === level ? '#00B5AD' : 'rgba(0, 181, 173, 0.1)',
                    color: filters.level === level ? 'white' : '#0B1E3F'
                  }}
                >
                  {level || 'All Levels'}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: '#0B1E3F' }}>
              Price
            </label>
            <div className="space-y-2">
              {['', 'FREE', 'PAID'].map((price) => (
                <button
                  key={price}
                  onClick={() => setFilters(prev => ({ ...prev, price }))}
                  className={`w-full px-4 py-3 rounded-xl font-semibold text-left transition-all duration-200 ${
                    filters.price === price ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: filters.price === price ? '#00B5AD' : 'rgba(0, 181, 173, 0.1)',
                    color: filters.price === price ? 'white' : '#0B1E3F'
                  }}
                >
                  {price || 'All Prices'}
                </button>
              ))}
            </div>
          </div>
          
          {isTeacher && (
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#0B1E3F' }}>
                Status
              </label>
              <div className="space-y-2">
                {['', 'ACTIVE', 'DRAFT', 'PUBLISHED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilters(prev => ({ ...prev, status }))}
                    className={`w-full px-4 py-3 rounded-xl font-semibold text-left transition-all duration-200 ${
                      filters.status === status ? 'text-white' : ''
                    }`}
                    style={{
                      backgroundColor: filters.status === status ? '#00B5AD' : 'rgba(0, 181, 173, 0.1)',
                      color: filters.status === status ? 'white' : '#0B1E3F'
                    }}
                  >
                    {status || 'All Status'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <button
              onClick={() => {
                setFilters({ level: '', price: '', category: '', status: '' });
                setShowFilters(false);
              }}
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 border-2"
              style={{ 
                borderColor: '#E5E7EB',
                color: '#0B1E3F',
                backgroundColor: 'white'
              }}
            >
              Clear All
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300"
              style={{ 
                backgroundColor: '#00B5AD',
                boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Bulk Actions Bar */}
      {isBulkMode && showBulkActions && selectedCourses.size > 0 && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedCourses.size} course{selectedCourses.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkPublish}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Publish
              </button>
              <button
                onClick={handleBulkDuplicate}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Duplicate
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Grid/List */}
      {filteredCourses.length === 0 ? (
        <div 
          className="text-center py-16 rounded-[20px] border-2"
          style={{
            backgroundColor: 'white',
            borderColor: '#E5E7EB'
          }}
        >
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
          >
            <BookOpen className="h-10 w-10" style={{ color: '#00B5AD' }} />
          </div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
            No courses found
          </h3>
          <p className="mb-6" style={{ color: '#6F73D2' }}>
            {searchQuery || filters.level || filters.price 
              ? 'Try adjusting your search or filters'
              : isTeacher 
                ? "You haven't created any courses yet"
                : 'No courses available at the moment'
            }
          </p>
          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-8 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              style={{ 
                backgroundColor: '#00B5AD',
                boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00968d';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#00B5AD';
              }}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Course
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile View */}
          {isBulkMode && filteredCourses.length > 0 && (
            <div className="lg:hidden mb-4 flex items-center space-x-2">
              <button
                onClick={selectAllCourses}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {selectedCourses.size === filteredCourses.length ? (
                  <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
                <span>Select All ({filteredCourses.length})</span>
              </button>
            </div>
          )}
          <div className="lg:hidden space-y-4">
            {filteredCourses.map(course => {
              const isSelected = selectedCourses.has(course.id);
              return (
                <div key={course.id} className="relative">
                  {isBulkMode && (
                    <div className="absolute top-4 left-4 z-10">
                      <button
                        onClick={() => toggleCourseSelection(course.id)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                  <div className={isBulkMode && isSelected ? 'ring-2 ring-blue-500 rounded-lg' : ''}>
                    <MobileCourseCard
                      course={course}
                      isTeacher={isTeacher}
                      onBoost={handleBoostCourse}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Desktop View */}
          {isBulkMode && filteredCourses.length > 0 && (
            <div className="mb-4 flex items-center space-x-2">
              <button
                onClick={selectAllCourses}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {selectedCourses.size === filteredCourses.length ? (
                  <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
                <span>Select All ({filteredCourses.length})</span>
              </button>
            </div>
          )}
          <div className={`hidden lg:grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
            {filteredCourses.map(course => {
              const enrollmentStats = getEnrollmentStats(course);
              const isSelected = selectedCourses.has(course.id);
              
              return (
                <div
                  key={course.id}
                  className={`group rounded-[20px] border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative ${
                    isBulkMode && isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
                  }`}
                  style={{
                    backgroundColor: 'white',
                    borderColor: isBulkMode && isSelected ? '#3b82f6' : '#E5E7EB'
                  }}
                  onMouseEnter={(e) => {
                    if (!isBulkMode) {
                      e.currentTarget.style.borderColor = '#00B5AD';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isBulkMode) {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }
                  }}
                >
                  {/* Bulk Mode Checkbox */}
                  {isBulkMode && (
                    <div className="absolute top-4 left-4 z-10">
                      <button
                        onClick={() => toggleCourseSelection(course.id)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                {viewMode === 'grid' ? (
                  <>
                    {/* Course Image */}
                    <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                      {getCourseImage(course) ? (
                        <img 
                          src={getCourseImage(course)} 
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
                        >
                          <BookOpen className="h-16 w-16" style={{ color: '#00B5AD' }} />
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col space-y-2">
                        {!course.isPaid && (
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: '#00B5AD' }}
                          >
                            Free
                          </span>
                        )}
                        {course.level && (
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: '#6F73D2' }}
                          >
                            {course.level}
                          </span>
                        )}
                        {isTeacher && (
                          <span 
                            className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                              course.isActive ? 'bg-[#00B5AD]' : 'bg-[#9A8CFF]'
                            }`}
                          >
                            {course.isActive ? 'Active' : 'Draft'}
                          </span>
                        )}
                      </div>
                      
                      {course.enrolledStudents && course.enrolledStudents > 1000 && (
                        <span 
                          className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: '#9A8CFF' }}
                        >
                          Popular
                        </span>
                      )}
                    </div>

                    {/* Course Content */}
                    <div className="p-6">
                      <div className="mb-3">
                        <span 
                          className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full"
                          style={{ 
                            backgroundColor: 'rgba(0, 181, 173, 0.1)',
                            color: '#00B5AD'
                          }}
                        >
                          {course.category || 'Course'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold mb-3 line-clamp-2 min-h-[3rem]" style={{ color: '#0B1E3F' }}>
                        {course.title}
                      </h3>

                      <div className="flex items-center space-x-2 mb-4">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
                          <span className="text-sm font-semibold" style={{ color: '#0B1E3F' }}>
                            {course.rating?.toFixed(1) || '4.5'}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: '#6F73D2' }}>
                          ({course.enrolledStudents || 0})
                        </span>
                      </div>
                      
                      {/* Course Stats */}
                      <div className="flex items-center space-x-4 text-sm mb-4" style={{ color: '#6F73D2' }}>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration || '8 weeks'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Users className="h-4 w-4" />
                          <span>{enrollmentStats.totalStudents.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Teacher-specific stats */}
                      {isTeacher && (
                        <div 
                          className="rounded-xl p-4 mb-4"
                          style={{ backgroundColor: 'rgba(111, 115, 210, 0.05)' }}
                        >
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-lg mb-1" style={{ color: '#0B1E3F' }}>
                                {enrollmentStats.activeStudents}
                              </div>
                              <div style={{ color: '#6F73D2' }}>Active</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-lg mb-1" style={{ color: '#0B1E3F' }}>
                                {enrollmentStats.completionRate}%
                              </div>
                              <div style={{ color: '#6F73D2' }}>Completion</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Instructor */}
                      {!isTeacher && (
                        <div className="flex items-center mb-4">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 overflow-hidden text-white font-semibold"
                            style={{ 
                              background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
                            }}
                          >
                            {course.teacher.avatarUrl ? (
                              <img 
                                src={course.teacher.avatarUrl} 
                                alt={course.teacher.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{course.teacher.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#0B1E3F' }}>
                              {course.teacher.name}
                            </p>
                            <p className="text-xs" style={{ color: '#6F73D2' }}>
                              Instructor
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Price and Action */}
                      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                        <div>
                          {course.price === 0 || !course.isPaid ? (
                            <span className="text-2xl font-bold" style={{ color: '#00B5AD' }}>Free</span>
                          ) : (
                            <div>
                              <span className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                                ${course.price}
                              </span>
                              {course.price && course.price > 50 && (
                                <span className="text-sm ml-2 line-through" style={{ color: '#6F73D2' }}>
                                  ${Math.round(course.price * 1.5)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {isTeacher && course.status === 'published' && (
                            <Tooltip content="Boost course visibility">
                              <button
                                onClick={() => handleBoostCourse(course.id)}
                                className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 button-press"
                                style={{ backgroundColor: 'rgba(154, 140, 255, 0.1)' }}
                                aria-label="Boost course"
                              >
                                <Zap className="h-5 w-5" style={{ color: '#9A8CFF' }} />
                              </button>
                            </Tooltip>
                          )}
                          {isTeacher && (
                            <div className="relative course-menu-container">
                              <Tooltip content="Course options">
                                <button
                                  onClick={() => setCourseMenuOpen(courseMenuOpen === course.id ? null : course.id)}
                                  className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 relative button-press"
                                  style={{ backgroundColor: 'rgba(111, 115, 210, 0.1)' }}
                                  aria-label="Course options"
                                >
                                  <MoreVertical className="h-5 w-5" style={{ color: '#6F73D2' }} />
                                </button>
                              </Tooltip>
                              {courseMenuOpen === course.id && (
                                <div 
                                  className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border-2 z-50 min-w-[200px]"
                                  style={{ borderColor: '#E5E7EB' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handlePreviewCourse(course.id)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 transition-colors rounded-t-xl"
                                  >
                                    <Eye className="h-4 w-4" style={{ color: '#6F73D2' }} />
                                    <span style={{ color: '#0B1E3F' }}>Preview</span>
                                  </button>
                                  <Link
                                    to={`/courses/${course.id}`}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                                    onClick={() => setCourseMenuOpen(null)}
                                  >
                                    <Edit3 className="h-4 w-4" style={{ color: '#6F73D2' }} />
                                    <span style={{ color: '#0B1E3F' }}>Edit</span>
                                  </Link>
                                  <button
                                    onClick={() => handleDuplicateCourse(course.id)}
                                    disabled={duplicatingCourseId === course.id}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 transition-colors disabled:opacity-50"
                                  >
                                    <Copy className="h-4 w-4" style={{ color: '#6F73D2' }} />
                                    <span style={{ color: '#0B1E3F' }}>
                                      {duplicatingCourseId === course.id ? 'Duplicating...' : 'Duplicate'}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setBulkMessageCourseId(course.id);
                                      setShowBulkMessageModal(true);
                                      setCourseMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                                  >
                                    <MessageSquare className="h-4 w-4" style={{ color: '#6F73D2' }} />
                                    <span style={{ color: '#0B1E3F' }}>Message Students</span>
                                  </button>
                                  <Link
                                    to={`/assignments/grade?courseId=${course.id}`}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                                    onClick={() => setCourseMenuOpen(null)}
                                  >
                                    <GraduationCap className="h-4 w-4" style={{ color: '#6F73D2' }} />
                                    <span style={{ color: '#0B1E3F' }}>Grade Assignments</span>
                                  </Link>
                                  <Link
                                    to={`/students/progress?courseId=${course.id}`}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                                    onClick={() => setCourseMenuOpen(null)}
                                  >
                                    <TrendingUp className="h-4 w-4" style={{ color: '#6F73D2' }} />
                                    <span style={{ color: '#0B1E3F' }}>Student Progress</span>
                                  </Link>
                                  <div className="border-t my-1" style={{ borderColor: '#E5E7EB' }} />
                                  <button
                                    onClick={() => {
                                      setShowDeleteConfirm(course.id);
                                      setCourseMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center space-x-2 transition-colors rounded-b-xl"
                                    style={{ color: '#DC2626' }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete Course</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          <Link
                            to={`/courses/${course.id}`}
                            className="px-5 py-2.5 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                            style={{ 
                              backgroundColor: '#00B5AD',
                              boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#00968d';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#00B5AD';
                            }}
                          >
                            {isTeacher ? 'Manage' : 'View'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // List View
                  <div className="p-6 flex items-center space-x-6">
                    <div 
                      className="w-24 h-24 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
                    >
                      {getCourseImage(course) ? (
                        <img 
                          src={getCourseImage(course)} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-12 w-12" style={{ color: '#00B5AD' }} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold" style={{ color: '#0B1E3F' }}>
                          {course.title}
                        </h3>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
                          <span className="text-sm font-semibold" style={{ color: '#0B1E3F' }}>
                            {course.rating || 4.8}
                          </span>
                        </div>
                      </div>
                      
                      <p className="mb-3 line-clamp-2" style={{ color: '#6F73D2' }}>
                        {course.description}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm" style={{ color: '#6F73D2' }}>
                        <div className="flex items-center space-x-1.5">
                          <Users className="h-4 w-4" />
                          <span>{enrollmentStats.totalStudents.toLocaleString()} students</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration || '8 weeks'}</span>
                        </div>
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ 
                            backgroundColor: 'rgba(111, 115, 210, 0.1)',
                            color: '#6F73D2'
                          }}
                        >
                          {course.level || 'Beginner'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
                        {course.isPaid ? `$${course.price}` : 'Free'}
                      </div>
                      <Link
                        to={`/courses/${course.id}`}
                        className="inline-block px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                        style={{ 
                          backgroundColor: '#00B5AD',
                          boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#00968d';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#00B5AD';
                        }}
                      >
                        {isTeacher ? 'Manage' : 'View Course'}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
      )}

      {/* Create Course Modal - simplified, no decorative shapes, focused on core fields */}
      {showCreateModal && (
        <div
          // Soft, non-distracting backdrop (not fully black) that still hides background shapes
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/75"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              clearDraft();
            }
          }}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] flex flex-col relative z-[10000]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create a new course</h2>
                <p className="text-sm text-gray-500">
                  Add the essential details for your course. You can build out modules and lessons after this step.
                </p>
                {draftSaved && (
                  <p className="text-xs text-green-600 mt-1">
                    Draft saved locally
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  clearDraft();
                }}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Course title<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Complete JavaScript Bootcamp"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Description
                </label>
                <div className="border border-gray-300 rounded-lg">
                  <RichTextEditor
                    value={newCourse.description}
                    onChange={(value) => setNewCourse(prev => ({ ...prev, description: value }))}
                    placeholder="Describe what students will learn, course structure, and any key highlights."
                    height="150px"
                  />
                </div>
              </div>

              {/* Category & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select category</option>
                    <option value="programming">Programming</option>
                    <option value="web-development">Web Development</option>
                    <option value="data-science">Data Science</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                    <option value="marketing">Marketing</option>
                    <option value="photography">Photography</option>
                    <option value="music">Music</option>
                    <option value="language">Language</option>
                    <option value="science">Science</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="health">Health & Fitness</option>
                    <option value="personal-development">Personal Development</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Level
                  </label>
                  <div className="flex gap-2">
                    {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setNewCourse(prev => ({ ...prev, level: level as 'Beginner' | 'Intermediate' | 'Advanced' }))}
                        className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                          newCourse.level === level
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Estimated duration
                </label>
                <input
                  type="text"
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 4 weeks, 10 hours total"
                />
              </div>

              {/* Banner image (simple, optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Banner image (optional)
                </label>
                {newCourse.imageUrl ? (
                  <div className="relative">
                    <img
                      src={newCourse.imageUrl}
                      alt="Course banner"
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 rounded-full bg-white/90 border border-gray-300 p-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full h-28 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-gray-50"
                  >
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    {uploadingImage ? (
                      <span>Uploading...</span>
                    ) : (
                      <>
                        <span>Click to upload an image</span>
                        <span className="mt-1 text-[11px] text-gray-400">Recommended 1200×675, max 5MB</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCourse(prev => ({ ...prev, status: 'draft' }))}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                      newCourse.status === 'draft'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCourse(prev => ({ ...prev, status: 'published' }))}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                      newCourse.status === 'published'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    Publish
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  You can always change this later from the course settings.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  clearDraft();
                }}
                className="w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCourse}
                disabled={!newCourse.title.trim() || uploadingImage}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {uploadingImage ? 'Uploading...' : 'Create course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Preview Modal */}
      {showPreviewModal && previewCourse && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(11, 30, 63, 0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowPreviewModal(false)}
        >
          <div 
            className="rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2"
            style={{
              backgroundColor: 'white',
              borderColor: '#E5E7EB',
              boxShadow: '0 25px 70px rgba(11, 30, 63, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                Course Preview
              </h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-110"
                style={{ color: '#6F73D2' }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {previewCourse.imageUrl && (
                <img 
                  src={previewCourse.imageUrl} 
                  alt={previewCourse.title}
                  className="w-full h-64 object-cover rounded-xl"
                />
              )}
              <div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
                  {previewCourse.title}
                </h3>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewCourse.description || '' }}
                />
              </div>
              <div className="flex items-center space-x-4 text-sm" style={{ color: '#6F73D2' }}>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{previewCourse.duration || '8 weeks'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{previewCourse.enrolledStudents || 0} students</span>
                </div>
                {previewCourse.level && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(111, 115, 210, 0.1)', color: '#6F73D2' }}>
                    {previewCourse.level}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Message Modal */}
      {showBulkMessageModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(11, 30, 63, 0.6)', backdropFilter: 'blur(8px)' }}
        >
          <div 
            className="rounded-2xl p-8 w-full max-w-2xl border-2"
            style={{
              backgroundColor: 'white',
              borderColor: '#E5E7EB',
              boxShadow: '0 25px 70px rgba(11, 30, 63, 0.4)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                Send Message to Students
              </h2>
              <button
                onClick={() => {
                  setShowBulkMessageModal(false);
                  setBulkMessage({ subject: '', content: '' });
                  setBulkMessageCourseId(null);
                }}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-110"
                style={{ color: '#6F73D2' }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={bulkMessage.subject}
                  onChange={(e) => setBulkMessage(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
                  style={{
                    borderColor: '#E5E7EB',
                    backgroundColor: 'white',
                    color: '#0B1E3F',
                    fontSize: '16px'
                  }}
                  placeholder="Enter message subject"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                  Message
                </label>
                <div className="border-2 rounded-xl overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                  <RichTextEditor
                    value={bulkMessage.content}
                    onChange={(value) => setBulkMessage(prev => ({ ...prev, content: value }))}
                    placeholder="Enter your message to students..."
                    height="250px"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowBulkMessageModal(false);
                  setBulkMessage({ subject: '', content: '' });
                  setBulkMessageCourseId(null);
                }}
                className="flex-1 px-6 py-3 border-2 rounded-xl font-semibold transition-all duration-200 hover:shadow-md"
                style={{ 
                  borderColor: '#E5E7EB',
                  color: '#0B1E3F',
                  backgroundColor: 'white'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendBulkMessage}
                disabled={!bulkMessage.subject || !bulkMessage.content}
                className="flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#00B5AD',
                  boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2 inline" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={!!showDeleteConfirm}
          title="Delete Course"
          message={`Are you sure you want to delete this course? This action cannot be undone and will permanently remove the course and all its content.`}
          confirmText="Delete Course"
          cancelText="Cancel"
          type="danger"
          onConfirm={() => {
            const courseToDelete = courses.find(c => c.id === showDeleteConfirm);
            if (courseToDelete) {
              handleDeleteCourse(showDeleteConfirm);
            }
          }}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
