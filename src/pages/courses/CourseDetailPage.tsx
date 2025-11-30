import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Play, 
  Users, 
  Star, 
  MessageSquare,
  Edit3,
  BarChart3,
  Clock,
  Check,
  ChevronDown,
  Video,
  FileText,
  X,
  CreditCard,
  Shield,
  ArrowRight,
  Plus,
  HelpCircle,
  Download,
  Award,
  Smartphone,
  Infinity,
  ThumbsUp,
  Share2,
  GraduationCap,
  TrendingUp,
  Eye
} from 'lucide-react';
import { Course } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { ForumBoard } from '../../components/forum/ForumBoard';
import { useAuthStore } from '../../store/auth';
import { apiService, createCourseModule, addLessonToModule, createLessonQuiz, getCourseReviews, updateModuleOrder, updateLessonOrder } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { DragDropCurriculumBuilder } from '../../components/curriculum/DragDropCurriculumBuilder';
import { VideoUploader } from '../../components/video/VideoUploader';
import { SwipeableTabs } from '../../components/mobile/SwipeableTabs';
import { BottomSheet } from '../../components/mobile/BottomSheet';
import { MobileAccordion } from '../../components/mobile/MobileAccordion';

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';
  
  // Check for preview mode from URL query params
  const searchParams = new URLSearchParams(location.search);
  const isPreviewMode = searchParams.get('preview') === 'true';
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState<'payment' | 'confirmation'>('payment');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Course Builder State
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({ title: '', description: '' });
  const [newLesson, setNewLesson] = useState({ title: '', content: '', scheduledAt: '', videoUrl: '' });
  const [newQuiz, setNewQuiz] = useState({ title: '', description: '', timeLimit: 30, passingScore: 70 });
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderError, setBuilderError] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [selectedReviewFilter, setSelectedReviewFilter] = useState<number | 'all'>('all');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const { showSuccess, showError } = useNotification();

  const isOwnCourse = isTeacher && course?.teacherId === user?.id;
  // In preview mode, show student view even if it's the teacher's own course
  const showStudentView = isPreviewMode || !isOwnCourse;

  const tabs = showStudentView ? [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'curriculum', label: 'Curriculum', icon: <Play className="h-4 w-4" /> },
    { id: 'instructor', label: 'Instructor', icon: <Users className="h-4 w-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="h-4 w-4" /> },
    { id: 'forum', label: 'Forum', icon: <MessageSquare className="h-4 w-4" /> }
  ] : [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'curriculum', label: 'Curriculum', icon: <Play className="h-4 w-4" /> },
    { id: 'students', label: 'Students', icon: <Users className="h-4 w-4" /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText className="h-4 w-4" /> },
    { id: 'forum', label: 'Forum', icon: <MessageSquare className="h-4 w-4" /> }
  ];

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  useEffect(() => {
    if (course) {
      // Get preview video from first lesson
      const firstLesson = (course as any)?.curriculum?.[0]?.lessons?.[0];
      if (firstLesson?.videoUrl) {
        setPreviewVideoUrl(firstLesson.videoUrl);
      }
      
      // Load reviews
      loadReviews();
    }
  }, [course]);

  const loadReviews = async () => {
    if (!id) return;
    try {
      const reviewsData = await getCourseReviews(id, { limit: 10, rating: selectedReviewFilter === 'all' ? undefined : selectedReviewFilter });
      setReviews(reviewsData.reviews || []);
      setReviewStats({
        total: reviewsData.total || 0,
        average: reviewsData.average || course?.rating || 0,
        distribution: reviewsData.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    }
  };

  const toggleWeekExpansion = (week: number) => {
    setExpandedWeeks(prev => 
      prev.includes(week) 
        ? prev.filter(w => w !== week)
        : [...prev, week]
    );
  };

  // Course Builder Handlers
  const handleCreateModule = async () => {
    if (!id || !newModule.title.trim()) {
      setBuilderError('Module title is required');
      return;
    }
    try {
      setBuilderLoading(true);
      setBuilderError('');
      await createCourseModule(Number(id), {
        title: newModule.title,
        description: newModule.description || undefined,
        order: (course as any)?.curriculum?.length || 0
      });
      // Reload course details
      await fetchCourseDetails();
      setShowModuleModal(false);
      setNewModule({ title: '', description: '' });
      showSuccess(
        'Module Created!',
        `"${newModule.title}" has been added to your course curriculum.`
      );
    } catch (error: any) {
      console.error('Error creating module:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create module. Please try again.';
      setBuilderError(errorMessage);
      showError('Failed to Create Module', errorMessage);
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!id || !selectedModuleId || !newLesson.title.trim()) {
      setBuilderError('Lesson title is required');
      return;
    }
    try {
      setBuilderLoading(true);
      setBuilderError('');
      await addLessonToModule(Number(id), selectedModuleId, {
        title: newLesson.title,
        content: newLesson.content || undefined,
        scheduledAt: newLesson.scheduledAt || new Date().toISOString(),
        videoUrl: newLesson.videoUrl || undefined
      });
      // Reload course details
      await fetchCourseDetails();
      setShowLessonModal(false);
      setNewLesson({ title: '', content: '', scheduledAt: '', videoUrl: '' });
      setSelectedModuleId(null);
      showSuccess(
        'Lesson Created!',
        `"${newLesson.title}" has been added to the module.`
      );
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create lesson. Please try again.';
      setBuilderError(errorMessage);
      showError('Failed to Create Lesson', errorMessage);
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!id || !selectedLessonId || !newQuiz.title.trim()) {
      setBuilderError('Quiz title is required');
      return;
    }
    try {
      setBuilderLoading(true);
      setBuilderError('');
      await createLessonQuiz(Number(id), Number(selectedLessonId), {
        title: newQuiz.title,
        description: newQuiz.description || undefined,
        timeLimit: newQuiz.timeLimit,
        passingScore: newQuiz.passingScore,
        questions: [] // Start with empty questions, can be added later
      });
      // Reload course details
      await fetchCourseDetails();
      setShowQuizModal(false);
      setNewQuiz({ title: '', description: '', timeLimit: 30, passingScore: 70 });
      setSelectedLessonId(null);
      showSuccess(
        'Quiz Created!',
        `"${newQuiz.title}" has been added to the lesson.`
      );
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create quiz. Please try again.';
      setBuilderError(errorMessage);
      showError('Failed to Create Quiz', errorMessage);
    } finally {
      setBuilderLoading(false);
    }
  };

  const fetchCourseDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const details = await apiService.getCourseDetails(Number(id));
      setCourse(details);
    } catch (err) {
      setCourse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollClick = () => {
    if (isEnrolled) {
      // Navigate to course learning page
      navigate(`/courses/${id}/learning`);
    } else {
      setShowEnrollmentModal(true);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setEnrollmentStep('confirmation');
    }, 2000);
  };

  const handleEnrollmentComplete = () => {
    setIsEnrolled(true);
    setShowEnrollmentModal(false);
    setEnrollmentStep('payment');
    // Redirect to course learning page
    navigate(`/courses/${id}/learning`);
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

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Course not found</h3>
        <p className="text-gray-500 dark:text-gray-400">The course you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F7FA' }}>
      {/* Mobile Hero Section */}
      <div className="lg:hidden relative" style={{ 
        background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
      }}>
        <div className="relative px-4 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BackButton to="/courses" showHome className="text-white" />
            {isOwnCourse && !isPreviewMode && (
              <div className="flex space-x-2">
                <Link
                  to={`/courses/${course.id}/edit`}
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <Edit3 className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 mb-4 flex-wrap">
            {course.category && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                {course.category}
              </span>
            )}
            {course.level && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                {course.level}
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-3">{course.title}</h1>
          <p className="text-sm mb-4 opacity-90 line-clamp-2">{course.description}</p>
          
          <div className="flex items-center space-x-4 text-sm mb-4">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
              <span className="font-semibold">{course.rating?.toFixed(1) || '4.5'}</span>
              <span className="opacity-80">({reviewStats.total || course.enrolledStudents || 0})</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{course.enrolledStudents?.toLocaleString() || 0} students</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration || '8 weeks'}</span>
            </div>
          </div>

          {/* Mobile Preview Video */}
          {previewVideoUrl && showStudentView && (
            <div className="relative rounded-lg overflow-hidden shadow-2xl mb-4">
              <div className="relative aspect-video bg-black">
                <video
                  className="w-full h-full"
                  controls
                  poster={course.imageUrl}
                >
                  <source src={previewVideoUrl} type="video/mp4" />
                </video>
                <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-70 rounded text-white text-xs font-semibold">
                  Preview
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Hero Section */}
      <div className="hidden lg:block relative" style={{ 
        background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
      }}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <BackButton to="/courses" showHome className="text-white hover:text-gray-200" />
              <div className="flex items-center space-x-2 text-sm">
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {course.category}
                </span>
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {course.level}
                </span>
              </div>
            </div>
            
            {isOwnCourse && !isPreviewMode && (
              <div className="flex space-x-3">
                <Link
                  to={`/courses/${course.id}/edit`}
                  className="flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Course
                </Link>
                <Link
                  to={`/analytics?courseId=${course.id}`}
                  className="flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl font-bold mb-4 text-white">{course.title}</h1>
              <p className="text-xl mb-6 text-white opacity-90 line-clamp-2">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-white mb-6">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 fill-current" style={{ color: '#F59E0B' }} />
                  <span className="font-semibold">{course.rating?.toFixed(1) || '4.5'}</span>
                  <span className="opacity-80">({reviewStats.total || course.enrolledStudents?.toLocaleString() || 0} {reviewStats.total > 0 ? 'reviews' : 'students enrolled'})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>{course.enrolledStudents?.toLocaleString() || 0} students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{course.duration || '8 weeks'}</span>
                </div>
                {course.level && (
                  <div className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-semibold">
                    {course.level}
                  </div>
                )}
              </div>

              {/* Preview Video Section */}
              {previewVideoUrl && showStudentView && (
                <div className="relative rounded-lg overflow-hidden shadow-2xl" style={{ maxWidth: '640px' }}>
                  <div className="relative aspect-video bg-black">
                    <video
                      className="w-full h-full"
                      controls
                      poster={course.imageUrl}
                    >
                      <source src={previewVideoUrl} type="video/mp4" />
                    </video>
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black bg-opacity-70 rounded text-white text-sm font-semibold">
                      Preview
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Sticky Enrollment Sidebar */}
            <div className="lg:col-span-1">
              {showStudentView && (
                <div className="sticky top-4 bg-white rounded-lg shadow-xl border-2 overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                  {/* Price Section */}
                  <div className="p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold mb-1" style={{ color: '#0B1E3F' }}>
                        {course.isPaid ? `$${course.price}` : 'Free'}
                      </div>
                      {course.isPaid && course.price && course.price > 50 && (
                        <div className="text-lg line-through opacity-60" style={{ color: '#6F73D2' }}>
                          ${Math.round(course.price * 1.5)}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleEnrollClick}
                      className="w-full py-4 text-white font-bold text-lg rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                      style={{ 
                        backgroundColor: '#00B5AD',
                        boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                      }}
                    >
                      {isEnrolled ? 'Continue Learning' : 'Enroll Now'}
                    </button>
                    
                    <p className="text-center text-sm mt-3" style={{ color: '#6F73D2' }}>
                      30-Day Money-Back Guarantee
                    </p>
                  </div>
                  
                  {/* Course Includes */}
                  <div className="p-6">
                    <h4 className="font-bold mb-4" style={{ color: '#0B1E3F' }}>This course includes:</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-3">
                        <Video className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#00B5AD' }} />
                        <div>
                          <div className="font-medium" style={{ color: '#0B1E3F' }}>
                            {(course as any)?.curriculum?.reduce((acc: number, week: any) => acc + (week.lessons?.length || 0), 0) || 0} on-demand video lessons
                          </div>
                        </div>
                      </div>
                      {(course as any)?.materials?.length > 0 && (
                        <div className="flex items-start space-x-3">
                          <Download className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#00B5AD' }} />
                          <div>
                            <div className="font-medium" style={{ color: '#0B1E3F' }}>
                              {(course as any).materials.length} downloadable resources
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start space-x-3">
                        <Award className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#00B5AD' }} />
                        <div>
                          <div className="font-medium" style={{ color: '#0B1E3F' }}>
                            Certificate of completion
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Infinity className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#00B5AD' }} />
                        <div>
                          <div className="font-medium" style={{ color: '#0B1E3F' }}>
                            Full lifetime access
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Smartphone className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#00B5AD' }} />
                        <div>
                          <div className="font-medium" style={{ color: '#0B1E3F' }}>
                            Access on mobile and TV
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Share Section */}
                  <div className="p-6 border-t bg-gray-50" style={{ borderColor: '#E5E7EB' }}>
                    <button className="w-full flex items-center justify-center space-x-2 py-2 text-sm font-medium transition-colors hover:opacity-80" style={{ color: '#6F73D2' }}>
                      <Share2 className="h-4 w-4" />
                      <span>Share this course</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* Preview Mode Banner */}
        {isPreviewMode && isOwnCourse && (
          <div 
            className="mb-6 p-4 rounded-xl border-2 flex items-center justify-between"
            style={{
              backgroundColor: 'rgba(111, 115, 210, 0.1)',
              borderColor: 'rgba(111, 115, 210, 0.3)'
            }}
          >
            <div className="flex items-center space-x-3">
              <Eye className="h-5 w-5" style={{ color: '#6F73D2' }} />
              <div>
                <p className="font-semibold" style={{ color: '#0B1E3F' }}>
                  Preview Mode - Student View
                </p>
                <p className="text-sm" style={{ color: '#6F73D2' }}>
                  You're viewing this course as a student would see it
                </p>
              </div>
            </div>
            <Link
              to={`/courses/${id}`}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200"
              style={{ 
                backgroundColor: '#6F73D2',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5a5fb8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6F73D2';
              }}
            >
              Exit Preview
            </Link>
          </div>
        )}

        {/* Mobile: Swipeable Tabs */}
        <div className="lg:hidden mb-6">
          <SwipeableTabs
            tabs={tabs.map(tab => ({
              id: tab.id,
              label: tab.label,
              content: (
                <div className="py-4">
                  {tab.id === 'overview' && (
                    <div className="space-y-6">
                      <MobileAccordion title="What you'll learn" defaultOpen>
                        <div className="space-y-3 pt-2">
                          {(course as any)?.learningOutcomes?.map((outcome: string, index: number) => (
                            <div key={index} className="flex items-start space-x-3">
                              <Check className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#00B5AD' }} />
                              <span style={{ color: '#0B1E3F' }}>{outcome}</span>
                            </div>
                          ))}
                        </div>
                      </MobileAccordion>
                      
                      <MobileAccordion title="Requirements">
                        <ul className="space-y-2 pt-2" style={{ color: '#0B1E3F' }}>
                          {(course as any)?.requirements?.map((req: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="mt-1">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </MobileAccordion>
                    </div>
                  )}
                  
                  {tab.id === 'curriculum' && (
                    <div className="space-y-4">
                      {(!(course as any)?.curriculum || (course as any).curriculum.length === 0) ? (
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No modules yet
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {!showStudentView 
                              ? 'Start building your course by adding your first module'
                              : 'This course doesn\'t have any content yet'}
                          </p>
                          {!showStudentView && (
                            <button
                              onClick={() => setShowModuleModal(true)}
                              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mx-auto"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Module
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {!showStudentView && (
                            <button
                              onClick={() => setShowModuleModal(true)}
                              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Module
                            </button>
                          )}
                          {(course as any)?.curriculum?.map((week: any, weekIndex: number) => (
                            <MobileAccordion key={week.week || weekIndex} title={`Module ${weekIndex + 1}: ${week.title || week.name || 'Untitled'}`}>
                              <div className="space-y-3 pt-2">
                                {week.lessons?.map((lesson: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(0, 181, 173, 0.05)' }}>
                                    <div className="flex items-center space-x-3 flex-1">
                                      {lesson.type === 'video' ? (
                                        <Video className="h-5 w-5" style={{ color: '#00B5AD' }} />
                                      ) : (
                                        <FileText className="h-5 w-5" style={{ color: '#6F73D2' }} />
                                      )}
                                      <span style={{ color: '#0B1E3F' }}>{lesson.title}</span>
                                      {lesson.quiz && (
                                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs">
                                          Quiz
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm" style={{ color: '#6F73D2' }}>{lesson.duration}</span>
                                      {!showStudentView && (
                                        <button
                                          onClick={() => {
                                            setSelectedLessonId(lesson.id);
                                            setShowQuizModal(true);
                                          }}
                                          className="p-1 text-purple-600"
                                          title="Add Quiz"
                                        >
                                          <HelpCircle className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {!showStudentView && (
                                  <button
                                    onClick={() => {
                                      setSelectedModuleId(week.id || weekIndex + 1);
                                      setShowLessonModal(true);
                                    }}
                                    className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 text-sm font-medium"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Lesson
                                  </button>
                                )}
                              </div>
                            </MobileAccordion>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                  
                  {tab.id === 'instructor' && showStudentView && course?.teacher && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 mb-4">
                        <div 
                          className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl overflow-hidden"
                          style={{ 
                            background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
                          }}
                        >
                          {course.teacher.avatarUrl ? (
                            <img src={course.teacher.avatarUrl} alt={course.teacher.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{course.teacher.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: '#0B1E3F' }}>
                            {course.teacher.name}
                          </h3>
                          <p style={{ color: '#6F73D2' }}>Instructor</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm mb-4">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
                          <span style={{ color: '#0B1E3F' }}>{course.rating || 0} Rating</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" style={{ color: '#6F73D2' }} />
                          <span style={{ color: '#0B1E3F' }}>{course.enrolledStudents?.toLocaleString() || 0} Students</span>
                        </div>
                      </div>
                      <p style={{ color: '#0B1E3F' }}>{course.description}</p>
                    </div>
                  )}
                  
                  {tab.id === 'forum' && (
                    <ForumBoard courseId={id!} />
                  )}
                </div>
              )
            }))}
            defaultTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Desktop: Course Content Tabs */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border" style={{ borderColor: '#E5E7EB' }}>
          <div className="border-b" style={{ borderColor: '#E5E7EB' }}>
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'text-[#00B5AD]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  style={{
                    borderBottomColor: activeTab === tab.id ? '#00B5AD' : 'transparent'
                  }}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* What you'll learn - Enhanced */}
                <div>
                  <h3 className="text-2xl font-bold mb-6" style={{ color: '#0B1E3F' }}>
                    What you'll learn
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(course as any)?.learningOutcomes?.length > 0 ? (
                      (course as any).learningOutcomes.map((outcome: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <Check className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#00B5AD' }} />
                          <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        No learning outcomes specified yet.
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Course Content Summary */}
                <div className="bg-gray-50 rounded-lg p-6" style={{ backgroundColor: 'rgba(0, 181, 173, 0.05)' }}>
                  <h3 className="text-xl font-semibold mb-4" style={{ color: '#0B1E3F' }}>
                    Course Content
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold mb-1" style={{ color: '#00B5AD' }}>
                        {(course as any)?.curriculum?.length || 0}
                      </div>
                      <div className="text-sm" style={{ color: '#6F73D2' }}>Modules</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold mb-1" style={{ color: '#00B5AD' }}>
                        {(course as any)?.curriculum?.reduce((acc: number, week: any) => acc + (week.lessons?.length || 0), 0) || 0}
                      </div>
                      <div className="text-sm" style={{ color: '#6F73D2' }}>Lessons</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold mb-1" style={{ color: '#00B5AD' }}>
                        {course.duration || '8 weeks'}
                      </div>
                      <div className="text-sm" style={{ color: '#6F73D2' }}>Duration</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold mb-1" style={{ color: '#00B5AD' }}>
                        {course.level || 'All'}
                      </div>
                      <div className="text-sm" style={{ color: '#6F73D2' }}>Level</div>
                    </div>
                  </div>
                </div>
                
                {/* Requirements */}
                {(course as any)?.requirements?.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4" style={{ color: '#0B1E3F' }}>
                      Requirements
                    </h3>
                    <ul className="list-disc list-inside space-y-2 pl-4" style={{ color: '#0B1E3F' }}>
                      {(course as any).requirements.map((req: string, index: number) => (
                        <li key={index} className="leading-relaxed">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Description - Full */}
                <div>
                  <h3 className="text-xl font-semibold mb-4" style={{ color: '#0B1E3F' }}>
                    Description
                  </h3>
                  <div 
                    className="prose max-w-none leading-relaxed"
                    style={{ color: '#0B1E3F' }}
                    dangerouslySetInnerHTML={{ __html: course.description || '' }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="space-y-6">
                {!showStudentView ? (
                  <>
                    {builderError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{builderError}</p>
                      </div>
                    )}
                    <DragDropCurriculumBuilder
                      modules={(course as any)?.curriculum || []}
                      onModulesChange={async (newModules) => {
                        if (!id) return;
                        try {
                          setBuilderError('');
                          // Update module order
                          const moduleIds = newModules.map(m => m.id);
                          await updateModuleOrder(id, moduleIds);
                          
                          // Update lesson orders within each module
                          for (const module of newModules) {
                            const lessonIds = module.lessons.map(l => l.id);
                            await updateLessonOrder(id, module.id, lessonIds);
                          }
                          
                          // Refresh course data
                          await fetchCourseDetails();
                        } catch (error) {
                          console.error('Error updating curriculum order:', error);
                          setBuilderError('Failed to update curriculum order. Please try again.');
                        }
                      }}
                      onEditModule={(moduleId) => {
                        const module = (course as any)?.curriculum?.find((m: any) => m.id === moduleId);
                        if (module) {
                          setNewModule({ title: module.title, description: module.description || '' });
                          setSelectedModuleId(moduleId as any);
                          setShowModuleModal(true);
                        }
                      }}
                      onEditLesson={(moduleId, lessonId) => {
                        const module = (course as any)?.curriculum?.find((m: any) => m.id === moduleId);
                        const lesson = module?.lessons?.find((l: any) => l.id === lessonId);
                        if (lesson) {
                          setNewLesson({
                            title: lesson.title,
                            content: lesson.content || '',
                            scheduledAt: lesson.scheduledAt || '',
                            videoUrl: lesson.videoUrl || ''
                          });
                          setSelectedLessonId(lessonId);
                          setSelectedModuleId(moduleId as any);
                          setShowLessonModal(true);
                        }
                      }}
                      onDeleteModule={async (moduleId) => {
                        if (window.confirm('Are you sure you want to delete this module? All lessons in this module will also be deleted.')) {
                          try {
                            // API call to delete module would go here
                            console.log('Deleting module:', moduleId);
                            await fetchCourseDetails();
                          } catch (error) {
                            console.error('Error deleting module:', error);
                            setBuilderError('Failed to delete module');
                          }
                        }
                      }}
                      onDeleteLesson={async (moduleId, lessonId) => {
                        if (window.confirm('Are you sure you want to delete this lesson?')) {
                          try {
                            // API call to delete lesson would go here
                            console.log('Deleting lesson:', moduleId, lessonId);
                            await fetchCourseDetails();
                          } catch (error) {
                            console.error('Error deleting lesson:', error);
                            setBuilderError('Failed to delete lesson');
                          }
                        }
                      }}
                      onAddModule={() => setShowModuleModal(true)}
                      onAddLesson={(moduleId) => {
                        setSelectedModuleId(moduleId as any);
                        setShowLessonModal(true);
                      }}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
                          Course Content
                        </h3>
                        <p className="text-sm" style={{ color: '#6F73D2' }}>
                          {(course as any).curriculum?.length ?? 0} modules • {(course as any).curriculum?.reduce((acc: number, week: any) => acc + (week.lessons?.length || 0), 0)} lessons • {course.duration || '8 weeks'} total
                        </p>
                      </div>
                    </div>
                    
                    {(!(course as any)?.curriculum || (course as any).curriculum.length === 0) ? (
                      <div className="text-center py-12 border border-gray-200 rounded-lg">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium mb-2" style={{ color: '#0B1E3F' }}>
                          No modules yet
                        </h4>
                        <p style={{ color: '#6F73D2' }}>
                          This course doesn't have any content yet
                        </p>
                      </div>
                    ) : (
                      (course as any)?.curriculum?.map((week: any, weekIndex: number) => {
                        const totalDuration = week.lessons?.reduce((acc: number, lesson: any) => {
                          const duration = lesson.duration || '0:00';
                          const parts = duration.split(':');
                          return acc + (parseInt(parts[0]) * 60 + parseInt(parts[1] || 0));
                        }, 0) || 0;
                        const formattedDuration = `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`;
                        
                        return (
                          <div key={week.week || weekIndex} className="border-2 rounded-lg overflow-hidden mb-4" style={{ borderColor: '#E5E7EB' }}>
                            <button
                              onClick={() => toggleWeekExpansion(week.week || weekIndex)}
                              className="w-full p-5 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-1">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)', color: '#00B5AD' }}>
                                    {weekIndex + 1}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <h4 className="font-semibold text-lg mb-1" style={{ color: '#0B1E3F' }}>
                                      {week.title || week.name || `Module ${weekIndex + 1}`}
                                    </h4>
                                    <div className="flex items-center space-x-4 text-sm" style={{ color: '#6F73D2' }}>
                                      <span>{week.lessons?.length ?? 0} lessons</span>
                                      {totalDuration > 0 && <span>• {formattedDuration}</span>}
                                    </div>
                                  </div>
                                </div>
                                <ChevronDown 
                                  className={`h-5 w-5 transition-transform ${expandedWeeks.includes(week.week || weekIndex) ? 'rotate-180' : ''}`}
                                  style={{ color: '#6F73D2' }}
                                />
                              </div>
                            </button>
                            {expandedWeeks.includes(week.week || weekIndex) && (
                              <div className="p-4 bg-gray-50 space-y-2" style={{ backgroundColor: 'rgba(0, 181, 173, 0.02)' }}>
                                {week.lessons?.map((lesson: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between py-3 px-4 rounded-lg bg-white hover:shadow-sm transition-all">
                                    <div className="flex items-center space-x-3 flex-1">
                                      {lesson.type === 'video' ? (
                                        <Video className="h-5 w-5" style={{ color: '#00B5AD' }} />
                                      ) : (
                                        <FileText className="h-5 w-5" style={{ color: '#6F73D2' }} />
                                      )}
                                      <div className="flex-1">
                                        <span className="font-medium" style={{ color: '#0B1E3F' }}>{lesson.title}</span>
                                        {lesson.quiz && (
                                          <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                            Quiz
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      {lesson.duration && (
                                        <span className="text-sm" style={{ color: '#6F73D2' }}>{lesson.duration}</span>
                                      )}
                                      {lesson.type === 'video' && (
                                        <Play className="h-4 w-4" style={{ color: '#6F73D2' }} />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'instructor' && showStudentView && course?.teacher && (
              <div className="space-y-6">
                <div className="flex items-start space-x-6">
                  <img 
                    src={course.teacher.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80'} 
                    alt={course.teacher.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                      {course.teacher.name}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                      Instructor
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span>{course.rating || 0} Instructor Rating</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{course.enrolledStudents?.toLocaleString() || 0} Students</span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && showStudentView && (
              <div className="space-y-6">
                {/* Review Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
                      {reviewStats.average.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${star <= Math.round(reviewStats.average) ? 'fill-current' : ''}`}
                          style={{ color: star <= Math.round(reviewStats.average) ? '#F59E0B' : '#E5E7EB' }}
                        />
                      ))}
                    </div>
                    <p className="text-sm" style={{ color: '#6F73D2' }}>
                      Course Rating
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#6F73D2' }}>
                      Based on {reviewStats.total} reviews
                    </p>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviewStats.distribution[rating as keyof typeof reviewStats.distribution] || 0;
                        const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                        return (
                          <div key={rating} className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1 w-20">
                              <span className="text-sm font-medium" style={{ color: '#0B1E3F' }}>{rating}</span>
                              <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
                            </div>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all duration-300"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: '#00B5AD'
                                }}
                              />
                            </div>
                            <span className="text-sm w-12 text-right" style={{ color: '#6F73D2' }}>
                              {Math.round(percentage)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Review Filters */}
                <div className="flex items-center space-x-2 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedReviewFilter('all');
                      loadReviews();
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedReviewFilter === 'all'
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedReviewFilter === 'all' ? '#00B5AD' : undefined
                    }}
                  >
                    All
                  </button>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => {
                        setSelectedReviewFilter(rating);
                        loadReviews();
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                        selectedReviewFilter === rating
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: selectedReviewFilter === rating ? '#00B5AD' : undefined
                      }}
                    >
                      <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
                      <span>{rating}</span>
                    </button>
                  ))}
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-30" style={{ color: '#6F73D2' }} />
                      <h4 className="text-lg font-medium mb-2" style={{ color: '#0B1E3F' }}>
                        No reviews yet
                      </h4>
                      <p style={{ color: '#6F73D2' }}>
                        Be the first to review this course!
                      </p>
                    </div>
                  ) : (
                    reviews.map((review: any) => (
                      <div key={review.id} className="border-b pb-6 last:border-b-0" style={{ borderColor: '#E5E7EB' }}>
                        <div className="flex items-start space-x-4 mb-3">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{
                              background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
                            }}
                          >
                            {review.studentName?.charAt(0) || 'S'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold" style={{ color: '#0B1E3F' }}>
                                {review.studentName || 'Anonymous'}
                              </h4>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${star <= review.rating ? 'fill-current' : ''}`}
                                    style={{ color: star <= review.rating ? '#F59E0B' : '#E5E7EB' }}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs mb-2" style={{ color: '#6F73D2' }}>
                              {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: '#0B1E3F' }}>
                              {review.comment || review.content}
                            </p>
                            {review.helpfulCount > 0 && (
                              <div className="flex items-center space-x-4 mt-3">
                                <button className="flex items-center space-x-1 text-sm" style={{ color: '#6F73D2' }}>
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>Helpful ({review.helpfulCount})</span>
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
            )}
            
            {activeTab === 'students' && !showStudentView && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                    Student Progress
                  </h3>
                  <Link
                    to={`/students/progress?courseId=${id}`}
                    className="flex items-center px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                    style={{ 
                      backgroundColor: '#00B5AD',
                      color: 'white',
                      boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Full Report
                  </Link>
                </div>
                <div 
                  className="rounded-2xl border-2 p-6"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#E5E7EB'
                  }}
                >
                  <p className="text-center py-8" style={{ color: '#6F73D2' }}>
                    Student progress data will be displayed here. Click "View Full Report" to see detailed analytics.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'assignments' && !showStudentView && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                    Grade Assignments
                  </h3>
                  <Link
                    to={`/assignments/grade?courseId=${id}`}
                    className="flex items-center px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                    style={{ 
                      backgroundColor: '#00B5AD',
                      color: 'white',
                      boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                    }}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Grade All Assignments
                  </Link>
                </div>
                <div 
                  className="rounded-2xl border-2 p-6"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#E5E7EB'
                  }}
                >
                  <p className="text-center py-8" style={{ color: '#6F73D2' }}>
                    Assignment submissions will be displayed here. Click "Grade All Assignments" to view and grade student submissions.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'forum' && (
              <ForumBoard courseId={id!} />
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Sticky Enroll Button */}
      {showStudentView && !isEnrolled && (
        <div className="lg:hidden fixed bottom-20 left-0 right-0 z-40 px-4 pb-4">
          <button
            onClick={handleEnrollClick}
            className="w-full py-4 text-white rounded-xl font-bold text-lg transition-all duration-300 active:scale-95"
            style={{ 
              backgroundColor: '#00B5AD',
              boxShadow: '0 10px 30px rgba(0, 181, 173, 0.4)'
            }}
          >
            {course.isPaid ? `Enroll Now - $${course.price}` : 'Enroll for Free'}
          </button>
        </div>
      )}

      {/* Enrollment Modal - Mobile Bottom Sheet */}
      <BottomSheet
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        title={enrollmentStep === 'payment' ? 'Complete Enrollment' : 'Success!'}
        maxHeight="90vh"
      >
        {enrollmentStep === 'payment' ? (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                {course.imageUrl && (
                  <img 
                    src={course.imageUrl} 
                    alt={course.title}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                )}
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#0B1E3F' }}>{course.title}</h3>
                  <p className="text-sm" style={{ color: '#6F73D2' }}>{course.duration}</p>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
                ${course.price}
              </div>
              <p className="text-sm" style={{ color: '#6F73D2' }}>
                {course.isPaid ? 'One-time payment' : 'Free enrollment'}
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: '#0B1E3F' }}>
                  Payment Method
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200" 
                    style={{ 
                      borderColor: paymentMethod === 'card' ? '#00B5AD' : '#E5E7EB',
                      backgroundColor: paymentMethod === 'card' ? 'rgba(0, 181, 173, 0.05)' : 'white'
                    }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'paypal')}
                      style={{ accentColor: '#00B5AD' }}
                    />
                    <CreditCard className="h-5 w-5" style={{ color: '#00B5AD' }} />
                    <span className="font-semibold" style={{ color: '#0B1E3F' }}>Credit Card</span>
                  </label>
                  <label className="flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
                    style={{ 
                      borderColor: paymentMethod === 'paypal' ? '#00B5AD' : '#E5E7EB',
                      backgroundColor: paymentMethod === 'paypal' ? 'rgba(0, 181, 173, 0.05)' : 'white'
                    }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'paypal')}
                      style={{ accentColor: '#00B5AD' }}
                    />
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: '#00B5AD' }}>
                      <span className="text-white text-xs font-bold">P</span>
                    </div>
                    <span className="font-semibold" style={{ color: '#0B1E3F' }}>PayPal</span>
                  </label>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
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
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                        Expiry
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
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
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
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
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
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
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm" style={{ color: '#6F73D2' }}>
                <Shield className="h-4 w-4" />
                <span>Your payment is secure and encrypted</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 text-white rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                style={{ 
                  backgroundColor: '#00B5AD',
                  boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                }}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Pay $${course.price}`
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
            >
              <Check className="h-10 w-10" style={{ color: '#00B5AD' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
              Enrollment Successful!
            </h2>
            <p className="mb-6" style={{ color: '#6F73D2' }}>
              You now have full access to "{course.title}". Start learning right away!
            </p>
            <button
              onClick={handleEnrollmentComplete}
              className="w-full py-4 text-white rounded-xl font-bold text-lg transition-all duration-300 active:scale-95"
              style={{ 
                backgroundColor: '#00B5AD',
                boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
              }}
            >
              Start Learning
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Desktop Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="hidden lg:flex fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {enrollmentStep === 'payment' ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Complete Enrollment
                  </h2>
                  <button
                    onClick={() => setShowEnrollmentModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <img 
                      src={course.imageUrl} 
                      alt={course.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{course.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{course.duration}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${course.price}
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Method
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'paypal')}
                          className="text-blue-600"
                        />
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">Credit Card</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'paypal')}
                          className="text-blue-600"
                        />
                        <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">P</span>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">PayPal</span>
                      </label>
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            CVV
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="h-4 w-4" />
                    <span>Your payment is secure and encrypted</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay ${course.price}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Enrollment Successful!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You now have full access to "{course.title}". Start learning right away!
                </p>
                <button
                  onClick={handleEnrollmentComplete}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Start Learning
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Course Builder Modals */}
      {/* Create Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Create Module</h2>
              <button
                onClick={() => {
                  setShowModuleModal(false);
                  setNewModule({ title: '', description: '' });
                  setBuilderError('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  value={newModule.title}
                  onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Introduction to React"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newModule.description}
                  onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Optional module description"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModuleModal(false);
                  setNewModule({ title: '', description: '' });
                  setBuilderError('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateModule}
                disabled={builderLoading || !newModule.title.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {builderLoading ? 'Creating...' : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Add Lesson</h2>
              <button
                onClick={() => {
                  setShowLessonModal(false);
                  setNewLesson({ title: '', content: '', scheduledAt: '', videoUrl: '' });
                  setSelectedModuleId(null);
                  setBuilderError('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Getting Started with React"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  value={newLesson.content}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Lesson content (markdown supported)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scheduled Date/Time
                </label>
                <input
                  type="datetime-local"
                  value={newLesson.scheduledAt}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {/* Video Upload */}
              <VideoUploader
                onUploadComplete={(videoUrl) => {
                  setNewLesson(prev => ({ ...prev, videoUrl }));
                }}
                onUploadError={(error) => {
                  setBuilderError(error);
                }}
                existingVideoUrl={newLesson.videoUrl}
                onRemove={() => {
                  setNewLesson(prev => ({ ...prev, videoUrl: '' }));
                }}
                maxSize={500}
              />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowLessonModal(false);
                  setNewLesson({ title: '', content: '', scheduledAt: '', videoUrl: '' });
                  setSelectedModuleId(null);
                  setBuilderError('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLesson}
                disabled={builderLoading || !newLesson.title.trim() || !selectedModuleId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {builderLoading ? 'Creating...' : 'Add Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Create Quiz</h2>
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  setNewQuiz({ title: '', description: '', timeLimit: 30, passingScore: 70 });
                  setSelectedLessonId(null);
                  setBuilderError('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Lesson 1 Quiz"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newQuiz.description}
                  onChange={(e) => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Optional quiz description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    value={newQuiz.timeLimit}
                    onChange={(e) => setNewQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    value={newQuiz.passingScore}
                    onChange={(e) => setNewQuiz(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Note: You can add questions after creating the quiz.
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  setNewQuiz({ title: '', description: '', timeLimit: 30, passingScore: 70 });
                  setSelectedLessonId(null);
                  setBuilderError('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuiz}
                disabled={builderLoading || !newQuiz.title.trim() || !selectedLessonId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {builderLoading ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};