import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  Play, 
  Check, 
  MessageSquare,
  Award as AwardIcon,
  User,
  ChevronDown,
  FileText,
  Video,
  CreditCard,
  Shield,
  X,
  ArrowRight,
  Edit3,
  BarChart3,
  GraduationCap,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Course } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { ForumBoard } from '../../components/forum/ForumBoard';
import { getCourseDetails, dummyCourses } from '../../data/courseData';
import { useAuthStore } from '../../store/auth';

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
    { id: 'students', label: 'Students', icon: <Users className="h-4 w-4" /> },
    { id: 'curriculum', label: 'Curriculum', icon: <Play className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'forum', label: 'Forum', icon: <MessageSquare className="h-4 w-4" /> }
  ] : [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'curriculum', label: 'Curriculum', icon: <Play className="h-4 w-4" /> },
    { id: 'instructor', label: 'Instructor', icon: <User className="h-4 w-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="h-4 w-4" /> },
    { id: 'forum', label: 'Forum', icon: <MessageSquare className="h-4 w-4" /> }
  ];

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id) return;
      
      // Since we don't have a backend server, immediately use dummy data
      const dummyCourse = dummyCourses.find(c => c.id === id);
      
      if (dummyCourse) {
        setCourse(dummyCourse);
        setIsEnrolled(false); // Default to not enrolled for dummy data
      }
      
      // Set loading to false regardless
      setIsLoading(false);
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5 second timeout

    fetchCourseData();

    return () => clearTimeout(timeoutId);
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

  const getEnrollmentStats = () => {
    if (!course) return null;
    
    const totalStudents = course.enrolledStudents || course.enrollments.length;
    const activeStudents = Math.floor(totalStudents * 0.85);
    const completionRate = Math.floor(Math.random() * 30) + 70;
    const averageScore = Math.floor(Math.random() * 20) + 80;
    
    return { totalStudents, activeStudents, completionRate, averageScore };
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

  const courseDetails = getCourseDetails(id!);
  const enrollmentStats = getEnrollmentStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
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
                {isOwnCourse && (
                  <span className={`px-2 py-1 rounded-full ${
                    course.isActive 
                      ? 'bg-green-500 bg-opacity-20' 
                      : 'bg-yellow-500 bg-opacity-20'
                  }`}>
                    {course.isActive ? 'Active' : 'Draft'}
                  </span>
                )}
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
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-blue-100 mb-6">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-300 fill-current" />
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
              {isOwnCourse ? (
                // Teacher view - Course management stats
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
                  <h3 className="text-lg font-semibold mb-4">Course Overview</h3>
                  {enrollmentStats && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{enrollmentStats.totalStudents}</div>
                          <div className="text-sm text-blue-100">Total Students</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{enrollmentStats.activeStudents}</div>
                          <div className="text-sm text-blue-100">Active Students</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{enrollmentStats.completionRate}%</div>
                          <div className="text-sm text-blue-100">Completion Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{enrollmentStats.averageScore}%</div>
                          <div className="text-sm text-blue-100">Avg Score</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-6 pt-4 border-t border-white border-opacity-20">
                    <Link
                      to={`/courses/${course.id}/edit`}
                      className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors block text-center"
                    >
                      Manage Course
                    </Link>
                  </div>
                </div>
              ) : (
                // Student view - Enrollment card
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold mb-2">
                      ${course.price}
                    </div>
                    <div className="text-blue-100 text-sm">
                      {course.isPaid ? 'One-time payment' : 'Free'}
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleEnrollClick}
                    className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors mb-4"
                  >
                    {isEnrolled ? 'Continue Learning' : 'Enroll Now'}
                  </button>
                  
                  <div className="text-sm text-blue-100 space-y-2">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Content Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
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
                    {courseDetails.learningOutcomes.map((outcome, index) => (
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
                    {courseDetails.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'students' && isOwnCourse && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Enrolled Students
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {enrollmentStats?.totalStudents} total students
                  </div>
                </div>

                {enrollmentStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        <div className="ml-3">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {enrollmentStats.totalStudents}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Enrolled</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
                        <div className="ml-3">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {enrollmentStats.activeStudents}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Active Students</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                        <div className="ml-3">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {enrollmentStats.completionRate}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <GraduationCap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        <div className="ml-3">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {enrollmentStats.averageScore}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mock student list */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Enrollments</h4>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Student {index + 1}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Enrolled {Math.floor(Math.random() * 30) + 1} days ago
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {Math.floor(Math.random() * 100)}% complete
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Last active {Math.floor(Math.random() * 7) + 1} days ago
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                    {courseDetails.curriculum.length} weeks • {courseDetails.curriculum.reduce((acc, week) => acc + week.lessons.length, 0)} lessons
                  </div>
                </div>
                
                {courseDetails.curriculum.map((week) => (
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
                              {week.lessons.length} lessons
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
                        {week.lessons.map((lesson, index) => (
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

            {activeTab === 'analytics' && isOwnCourse && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Course Analytics
                </h3>
                
                {enrollmentStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Student Progress</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Completion Rate</span>
                            <span>{enrollmentStats.completionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${enrollmentStats.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Average Score</span>
                            <span>{enrollmentStats.averageScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${enrollmentStats.averageScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Engagement Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Active Students</span>
                          <span className="font-medium">{enrollmentStats.activeStudents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total Students</span>
                          <span className="font-medium">{enrollmentStats.totalStudents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Inactive Students</span>
                          <span className="font-medium">{enrollmentStats.totalStudents - enrollmentStats.activeStudents}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'instructor' && !isOwnCourse && (
              <div className="space-y-6">
                <div className="flex items-start space-x-6">
                  <img 
                    src={courseDetails.instructor.imageUrl} 
                    alt={courseDetails.instructor.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                      {courseDetails.instructor.name}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                      {courseDetails.instructor.title}
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span>{courseDetails.instructor.rating} Instructor Rating</span>
                      </div>
                      <div className="flex items-center">
                        <AwardIcon className="h-4 w-4 mr-1" />
                        <span>{courseDetails.instructor.students.toLocaleString()} Students</span>
                      </div>
                      <div className="flex items-center">
                        <Play className="h-4 w-4 mr-1" />
                        <span>{courseDetails.instructor.courses} Courses</span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {courseDetails.instructor.bio}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && !isOwnCourse && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Student Reviews
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {course.rating} out of 5
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Mock reviews */}
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Student {index + 1}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        This is a great course! The instructor explains everything clearly and the content is very practical.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'forum' && (
              <ForumBoard courseId={id!} />
            )}
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
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