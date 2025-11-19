import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Activity,
  TrendingUp,
  GraduationCap,
  ChevronDown,
  Video,
  FileText,
  X,
  CreditCard,
  Shield,
  ArrowRight
} from 'lucide-react';
import { Course } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { ForumBoard } from '../../components/forum/ForumBoard';
import { useAuthStore } from '../../store/auth';
import { apiService } from '../../services/api';
import { SwipeableTabs } from '../../components/mobile/SwipeableTabs';
import { BottomSheet } from '../../components/mobile/BottomSheet';
import { MobileAccordion } from '../../components/mobile/MobileAccordion';

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';
  
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

  const isOwnCourse = isTeacher && course?.teacherId === user?.id;

  const tabs = isOwnCourse ? [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'curriculum', label: 'Curriculum', icon: <Play className="h-4 w-4" /> },
    { id: 'forum', label: 'Forum', icon: <MessageSquare className="h-4 w-4" /> }
  ] : [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'curriculum', label: 'Curriculum', icon: <Play className="h-4 w-4" /> },
    { id: 'instructor', label: 'Instructor', icon: <Users className="h-4 w-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="h-4 w-4" /> },
    { id: 'forum', label: 'Forum', icon: <MessageSquare className="h-4 w-4" /> }
  ];

  useEffect(() => {
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
    fetchCourseDetails();
  }, [id]);

  const toggleWeekExpansion = (week: number) => {
    setExpandedWeeks(prev => 
      prev.includes(week) 
        ? prev.filter(w => w !== week)
        : [...prev, week]
    );
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            {isOwnCourse && (
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
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              {course.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              {course.level}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold mb-3">{course.title}</h1>
          <p className="text-sm mb-4 opacity-90 line-clamp-2">{course.description}</p>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
              <span>{course.rating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{course.enrolledStudents?.toLocaleString() || 0} students</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
          </div>
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
            
            {isOwnCourse && (
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
              <p className="text-xl mb-6 text-white opacity-90">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-white">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 fill-current" style={{ color: '#F59E0B' }} />
                  <span>{course.rating} ({course.enrolledStudents?.toLocaleString()} students enrolled)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>{course.enrolledStudents?.toLocaleString()} students</span>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              {!isOwnCourse && (
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold mb-2 text-white">
                      ${course.price}
                    </div>
                    <div className="text-sm text-white opacity-80">
                      {course.isPaid ? 'One-time payment' : 'Free'}
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleEnrollClick}
                    className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors mb-4"
                  >
                    {isEnrolled ? 'Continue Learning' : 'Enroll Now'}
                  </button>
                  
                  <div className="text-sm text-white opacity-80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Full lifetime access</span>
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Access on mobile and TV</span>
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Certificate of completion</span>
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>30-Day money-back guarantee</span>
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
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
                      {(course as any)?.curriculum?.map((week: any) => (
                        <MobileAccordion key={week.week} title={`Week ${week.week}: ${week.title}`}>
                          <div className="space-y-3 pt-2">
                            {week.lessons?.map((lesson: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(0, 181, 173, 0.05)' }}>
                                <div className="flex items-center space-x-3">
                                  {lesson.type === 'video' ? (
                                    <Video className="h-5 w-5" style={{ color: '#00B5AD' }} />
                                  ) : (
                                    <FileText className="h-5 w-5" style={{ color: '#6F73D2' }} />
                                  )}
                                  <span style={{ color: '#0B1E3F' }}>{lesson.title}</span>
                                </div>
                                <span className="text-sm" style={{ color: '#6F73D2' }}>{lesson.duration}</span>
                              </div>
                            ))}
                          </div>
                        </MobileAccordion>
                      ))}
                    </div>
                  )}
                  
                  {tab.id === 'instructor' && !isOwnCourse && course?.teacher && (
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
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    What you'll learn
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(course as any)?.learningOutcomes?.map((outcome: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Requirements
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    {(course as any)?.requirements?.map((req: string, index: number) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Course Content
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {(course as any).curriculum?.length ?? 0} weeks • {(course as any).curriculum?.reduce((acc: number, week: any) => acc + (week.lessons?.length ?? 0), 0)} lessons
                  </div>
                </div>
                
                {(course as any)?.curriculum?.map((week: any) => (
                  <div key={week.week} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                    <button
                      onClick={() => toggleWeekExpansion(week.week)}
                      className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {week.week}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white text-left">
                              {week.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {week.lessons?.length ?? 0} lessons
                            </p>
                          </div>
                        </div>
                        <ChevronDown 
                          className={`h-5 w-5 text-gray-500 transition-transform ${
                            expandedWeeks.includes(week.week) ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </button>
                    {expandedWeeks.includes(week.week) && (
                      <div className="p-4 space-y-3">
                        {week.lessons?.map((lesson: any, index: number) => (
                          <div key={index} className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              {lesson.type === 'video' ? (
                                <Video className="h-4 w-4 text-blue-500" />
                              ) : (
                                <FileText className="h-4 w-4 text-green-500" />
                              )}
                              <span className="text-gray-700 dark:text-gray-300">{lesson.title}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">{lesson.duration}</span>
                              {lesson.type === 'video' && (
                                <Play className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'instructor' && !isOwnCourse && course?.teacher && (
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
            
            {activeTab === 'forum' && (
              <ForumBoard courseId={id!} />
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Sticky Enroll Button */}
      {!isOwnCourse && !isEnrolled && (
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
    </div>
  );
};