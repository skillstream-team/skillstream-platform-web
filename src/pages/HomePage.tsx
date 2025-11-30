import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Compass, 
  Calendar, 
  MessageCircle,
  ArrowRight,
  Clock,
  Star,
  Users,
  Bell,
  Play,
  Zap,
  Code,
  Palette,
  Briefcase,
  BarChart3,
  Camera,
  Music,
  Hand,
  DollarSign,
  Video,
  GraduationCap,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { findNextUncompletedLesson } from '../utils/courseProgress';
import { useAuthStore } from '../store/auth';
import {
  getCourses,
  getMyCalendarEvents,
  getMyCourses,
  getProgress,
  getGlobalAnnouncements,
  getUserAnnouncements,
  getCourseRecommendations,
  getTeacherStats,
  getEarningsReport
} from '../services/api';
import { Course, Progress } from '../types';
import { MobileCourseCard } from '../components/mobile/MobileCourseCard';

export const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'TEACHER';
  
  const [continueLearning, setContinueLearning] = useState<Course[]>([]);
  const [recommendedLessons, setRecommendedLessons] = useState<Course[]>([]);
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [coursesInProgress, setCoursesInProgress] = useState<Array<{ course: Course; progress: Progress | null }>>([]);
  const [hasStartedLearning, setHasStartedLearning] = useState(false);
  const [continueLoading, setContinueLoading] = useState<Record<string, boolean>>({});
  const [teacherStats, setTeacherStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingAssignments: 0,
    averageCompletionRate: 0,
    activeStudents: 0,
    totalLessons: 0
  });
  const [teacherEarnings, setTeacherEarnings] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0
  });

  // Check if this is the user's first visit in this session
  useEffect(() => {
    if (user?.id) {
      // Check if user account was created recently (within last hour) - indicates brand new user
      let isNewUser = false;
      if (user.createdAt) {
        const accountCreated = new Date(user.createdAt);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60);
        // If account was created within last hour, it's their first login
        isNewUser = hoursSinceCreation < 1;
      }
      
      // Check if this is first visit to home page in current session
      const hasVisitedThisSession = sessionStorage.getItem(`home_visited_${user.id}`);
      
      if (isNewUser || !hasVisitedThisSession) {
        setIsFirstVisit(true);
        sessionStorage.setItem(`home_visited_${user.id}`, 'true');
      }
    }
  }, [user?.id, user?.createdAt]);

  useEffect(() => {
    loadHomeData();
    if (isTeacher) {
      loadTeacherData();
    } else {
      loadCoursesInProgress();
    }
  }, [isTeacher]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const courses = await getCourses({ limit: 30 });
      
      // Load continue learning courses from courses in progress
      // This will be updated after loadCoursesInProgress completes
      
      // Load recommended lessons (only for students)
      if (!isTeacher && user?.id) {
        try {
          const recommended = await getCourseRecommendations(user.id, 10);
          setRecommendedLessons(recommended.slice(0, 6));
        } catch (recError) {
          console.error('Error loading course recommendations:', recError);
          setRecommendedLessons(courses.slice(3, 9));
        }
      } else if (!isTeacher) {
        setRecommendedLessons(courses.slice(3, 9));
      }
      
      // Load popular courses (sorted by rating and enrolled students)
      const sortedByPopularity = [...courses]
        .sort((a, b) => {
          const aScore = (a.rating || 0) * 0.6 + (a.enrolledStudents || 0) * 0.4;
          const bScore = (b.rating || 0) * 0.6 + (b.enrolledStudents || 0) * 0.4;
          return bScore - aScore;
        })
        .slice(0, 6);
      setPopularCourses(sortedByPopularity);
      
      // Load upcoming sessions
      try {
        const events = await getMyCalendarEvents({});
        setUpcomingSessions(events.slice(0, 3));
      } catch {
        setUpcomingSessions([]);
      }
      
      // Load announcements from API
      try {
        const globalAnnouncements = await getGlobalAnnouncements();
        const userAnnouncements = user?.id
          ? await getUserAnnouncements(user.id)
          : [];
        setAnnouncements([...(globalAnnouncements || []), ...(userAnnouncements || [])]);
      } catch (annError) {
        console.error('Error loading announcements:', annError);
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherData = async () => {
    try {
      if (!user?.id) return;
      
      // Load teacher stats
      try {
        const stats = await getTeacherStats(user.id);
        setTeacherStats(stats);
      } catch (err) {
        console.error('Error loading teacher stats:', err);
      }
      
      // Load earnings
      try {
        const earnings = await getEarningsReport(user.id);
        setTeacherEarnings(earnings);
      } catch (err) {
        console.error('Error loading earnings:', err);
      }
      
      // Load teacher's courses
      try {
        const myCourses = await getMyCourses();
        setContinueLearning(myCourses.slice(0, 6));
      } catch (err) {
        console.error('Error loading teacher courses:', err);
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
    }
  };

  const loadCoursesInProgress = async () => {
    try {
      const myCourses = await getMyCourses();
      const coursesWithProgress = await Promise.all(
        myCourses.map(async (course) => {
          try {
            const progress = await getProgress(course.id);
            return { course, progress };
          } catch {
            return { course, progress: null };
          }
        })
      );

      // Filter courses that are in progress (progress > 0 and < 100)
      const inProgress = coursesWithProgress.filter(({ progress }) => {
        if (!progress) return false;
        return progress.overallProgress > 0 && progress.overallProgress < 100;
      });

      setCoursesInProgress(inProgress);
      setHasStartedLearning(inProgress.length > 0);
      
      // Update continue learning with courses that have progress
      const continueCourses = inProgress
        .slice(0, 3)
        .map(({ course }) => course);
      setContinueLearning(continueCourses);
    } catch (error) {
      console.error('Error loading courses in progress:', error);
      setCoursesInProgress([]);
      setHasStartedLearning(false);
      setContinueLearning([]);
    }
  };

  const handleContinueLearning = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContinueLoading(prev => ({ ...prev, [courseId]: true }));
    try {
      const nextLessonId = await findNextUncompletedLesson(courseId);
      if (nextLessonId) {
        navigate(`/courses/${courseId}/learn/${nextLessonId}`);
      } else {
        navigate(`/courses/${courseId}`);
      }
    } catch (error) {
      console.error('Error finding next lesson:', error);
      navigate(`/courses/${courseId}`);
    } finally {
      setContinueLoading(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const categories = [
    { id: 'web-dev', name: 'Web Development', icon: Code, color: '#00B5AD' },
    { id: 'design', name: 'Design', icon: Palette, color: '#6F73D2' },
    { id: 'business', name: 'Business', icon: Briefcase, color: '#9A8CFF' },
    { id: 'marketing', name: 'Marketing', icon: BarChart3, color: '#00B5AD' },
    { id: 'photography', name: 'Photography', icon: Camera, color: '#6F73D2' },
    { id: 'music', name: 'Music', icon: Music, color: '#9A8CFF' },
  ];


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Welcome Card */}
      <div className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-text">
            <h1 className="home-hero-title">
              {isFirstVisit ? 'Welcome' : 'Welcome back'}, {user?.name || 'there'}!
              <Hand className="home-hero-title-icon" />
            </h1>
            <p className="home-hero-subtitle">
              {isTeacher 
                ? 'Ready to inspire your students today?' 
                : 'Continue your learning journey and discover new skills'}
            </p>
            
            {/* Quick Access Cards */}
            <div className="home-quick-access">
              {isTeacher ? (
                <>
                  <Link to="/courses" className="home-quick-access-card">
                    <BookOpen className="home-quick-access-card-icon home-quick-access-card-icon--teal" />
                    <p className="home-quick-access-card-text">My Courses</p>
                  </Link>
                  
                  <Link to="/courses?create=true" className="home-quick-access-card">
                    <Zap className="home-quick-access-card-icon home-quick-access-card-icon--purple" />
                    <p className="home-quick-access-card-text">Create Course</p>
                  </Link>
                  
                  <Link to="/lessons/create" className="home-quick-access-card">
                    <Video className="home-quick-access-card-icon home-quick-access-card-icon--teal" />
                    <p className="home-quick-access-card-text">Create Lesson</p>
                  </Link>
                  
                  <Link to="/assignments/grade" className="home-quick-access-card">
                    <GraduationCap className="home-quick-access-card-icon home-quick-access-card-icon--purple" />
                    <p className="home-quick-access-card-text">Grade Assignments</p>
                  </Link>
                  
                  <Link to="/analytics" className="home-quick-access-card">
                    <BarChart3 className="home-quick-access-card-icon home-quick-access-card-icon--light-purple" />
                    <p className="home-quick-access-card-text">Analytics</p>
                  </Link>
                  
                  <Link to="/students/progress" className="home-quick-access-card">
                    <Users className="home-quick-access-card-icon home-quick-access-card-icon--teal" />
                    <p className="home-quick-access-card-text">Student Progress</p>
                  </Link>
                  
                  <Link to="/earnings-report" className="home-quick-access-card">
                    <DollarSign className="home-quick-access-card-icon home-quick-access-card-icon--purple" />
                    <p className="home-quick-access-card-text">Earnings</p>
                  </Link>
                  
                  <Link to="/schedule" className="home-quick-access-card">
                    <Calendar className="home-quick-access-card-icon home-quick-access-card-icon--teal" />
                    <p className="home-quick-access-card-text">Schedule</p>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/learn" className="home-quick-access-card">
                    <BookOpen className="home-quick-access-card-icon home-quick-access-card-icon--teal" />
                    <p className="home-quick-access-card-text">My Learning</p>
                  </Link>
                  
                  <Link to="/discover" className="home-quick-access-card">
                    <Compass className="home-quick-access-card-icon home-quick-access-card-icon--purple" />
                    <p className="home-quick-access-card-text">Discover</p>
                  </Link>
                  
                  <Link to="/schedule" className="home-quick-access-card">
                    <Calendar className="home-quick-access-card-icon home-quick-access-card-icon--light-purple" />
                    <p className="home-quick-access-card-text">Schedule</p>
                  </Link>
                  
                  <Link to="/messages" className="home-quick-access-card">
                    <MessageCircle className="home-quick-access-card-icon home-quick-access-card-icon--teal" />
                    <p className="home-quick-access-card-text">Messages</p>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Stats Section */}
      {isTeacher && (
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">
              Your Teaching Overview
            </h2>
            <Link to="/analytics" className="home-section-link">
              <span>View Analytics</span>
              <ArrowRight className="home-course-card-meta-icon" />
            </Link>
          </div>
          
          <div className="home-stats-grid">
            <div className="home-stat-card">
              <div className="home-stat-card-icon" style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}>
                <BookOpen className="home-stat-card-icon-svg" style={{ color: '#00B5AD' }} />
              </div>
              <div className="home-stat-card-content">
                <p className="home-stat-card-label">Total Courses</p>
                <p className="home-stat-card-value">{teacherStats.totalCourses}</p>
              </div>
            </div>
            
            <div className="home-stat-card">
              <div className="home-stat-card-icon" style={{ backgroundColor: 'rgba(111, 115, 210, 0.1)' }}>
                <Users className="home-stat-card-icon-svg" style={{ color: '#6F73D2' }} />
              </div>
              <div className="home-stat-card-content">
                <p className="home-stat-card-label">Total Students</p>
                <p className="home-stat-card-value">{teacherStats.totalStudents}</p>
              </div>
            </div>
            
            <div className="home-stat-card">
              <div className="home-stat-card-icon" style={{ backgroundColor: 'rgba(154, 140, 255, 0.1)' }}>
                <DollarSign className="home-stat-card-icon-svg" style={{ color: '#9A8CFF' }} />
              </div>
              <div className="home-stat-card-content">
                <p className="home-stat-card-label">Monthly Revenue</p>
                <p className="home-stat-card-value">${teacherEarnings.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="home-stat-card">
              <div className="home-stat-card-icon" style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}>
                <BarChart3 className="home-stat-card-icon-svg" style={{ color: '#00B5AD' }} />
              </div>
              <div className="home-stat-card-content">
                <p className="home-stat-card-label">Completion Rate</p>
                <p className="home-stat-card-value">{Math.round(teacherStats.averageCompletionRate)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Your Courses Preview - Teacher Only */}
      {isTeacher && continueLearning.length > 0 && (
        <div className="home-section">
          <div className="home-section-header">
            <div>
              <h2 className="home-section-title">
                Your Courses Preview
              </h2>
              <p className="home-progress-subtitle" style={{ marginTop: '0.5rem' }}>
                See how your courses appear to students
              </p>
            </div>
            <Link to="/courses" className="home-section-link">
              <span>Manage Courses</span>
              <ArrowRight className="home-course-card-meta-icon" />
            </Link>
          </div>
          
          {/* Mobile: Horizontal Scroll */}
          <div className="home-course-scroll">
            <div className="home-course-scroll-container">
              {continueLearning.slice(0, 6).map((course) => (
                <div key={course.id} className="home-course-card-mobile">
                  <Link
                    to={`/courses/${course.id}?preview=true`}
                    className="block"
                  >
                    <MobileCourseCard course={course} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop: Grid */}
          <div className="home-course-grid">
            {continueLearning.slice(0, 6).map((course) => (
              <div key={course.id} className="home-course-card">
                <Link
                  to={`/courses/${course.id}?preview=true`}
                  className="home-course-card-link"
                >
                  <div className="home-course-card-image home-course-card-image--small">
                    {course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.title} />
                    ) : (
                      <BookOpen className="home-course-card-image-placeholder" />
                    )}
                    <span className="home-course-card-category-badge">
                      {course.category || 'Course'}
                    </span>
                  </div>
                  <div className="home-course-card-body">
                    <h3 className="home-course-card-title">
                      {course.title}
                    </h3>
                    <div className="home-course-card-rating">
                      <div className="home-course-card-meta-item">
                        <Star className="home-course-card-rating-icon" />
                        <span className="home-course-card-rating-text">{course.rating?.toFixed(1) || '4.5'}</span>
                      </div>
                      <div className="home-course-card-meta-item">
                        <Users className="home-course-card-meta-icon" />
                        <span>{course.enrolledStudents || 0}</span>
                      </div>
                    </div>
                    {course.price === 0 || !course.isPaid ? (
                      <span className="home-course-card-price home-course-card-price--free">Free</span>
                    ) : (
                      <span className="home-course-card-price home-course-card-price--paid">${course.price}</span>
                    )}
                  </div>
                </Link>
                <Link
                  to={`/courses/${course.id}?preview=true`}
                  className="home-course-card-continue-button"
                  style={{ textDecoration: 'none' }}
                >
                  <Eye className="home-course-card-continue-icon" />
                  <span>Preview as Student</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue Learning / My Courses Section */}
      {continueLearning.length > 0 && (
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">
              {isTeacher ? 'My Courses' : 'Continue Learning'}
            </h2>
            <Link to={isTeacher ? "/courses" : "/learn"} className="home-section-link">
              <span>View All</span>
              <ArrowRight className="home-course-card-meta-icon" />
            </Link>
          </div>
          
          {/* Mobile: Horizontal Scroll */}
          <div className="home-course-scroll">
            <div className="home-course-scroll-container">
              {continueLearning.map((course) => (
                <div key={course.id} className="home-course-card-mobile">
                  <MobileCourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop: Grid */}
          <div className="home-course-grid">
            {continueLearning.map((course) => {
              const courseProgress = coursesInProgress.find(cp => cp.course.id === course.id)?.progress;
              const hasProgress = courseProgress && courseProgress.overallProgress > 0;
              
              return (
                <div key={course.id} className="home-course-card">
                  <Link
                    to={`/courses/${course.id}`}
                    className="home-course-card-link"
                  >
                    <div className="home-course-card-image">
                      {course.imageUrl ? (
                        <img src={course.imageUrl} alt={course.title} />
                      ) : (
                        <BookOpen className="home-course-card-image-placeholder" />
                      )}
                      <div className="home-course-card-image-overlay" />
                      <div className="home-course-card-image-content">
                        <div className="home-course-card-image-badge">
                          <span className="home-course-card-image-category">
                            {course.category}
                          </span>
                          <div className="home-course-card-image-rating">
                            <Star className="home-course-card-image-rating-icon" />
                            <span className="home-course-card-image-rating-text">{course.rating?.toFixed(1) || '4.5'}</span>
                          </div>
                        </div>
                        <h3 className="home-course-card-image-title">{course.title}</h3>
                      </div>
                    </div>
                    <div className="home-course-card-body">
                      <div className="home-course-card-meta">
                        <div className="home-course-card-meta-items">
                          <div className="home-course-card-meta-item">
                            <Clock className="home-course-card-meta-icon" />
                            <span>{course.duration || '8 weeks'}</span>
                          </div>
                          <div className="home-course-card-meta-item">
                            <Users className="home-course-card-meta-icon" />
                            <span>{course.enrolledStudents || 0}</span>
                          </div>
                        </div>
                      </div>
                      {courseProgress && (
                        <div className="home-course-card-progress">
                          <div className="home-course-card-progress-bar">
                            <div 
                              className="home-course-card-progress-fill"
                              style={{ width: `${courseProgress.overallProgress}%` }}
                            />
                          </div>
                          <span className="home-course-card-progress-text">
                            {Math.round(courseProgress.overallProgress)}% complete
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={(e) => handleContinueLearning(course.id, e)}
                    disabled={continueLoading[course.id]}
                    className="home-course-card-continue-button"
                  >
                    {continueLoading[course.id] ? (
                      <span>Loading...</span>
                    ) : hasProgress ? (
                      <>
                        <Play className="home-course-card-continue-icon" />
                        <span>Continue</span>
                      </>
                    ) : (
                      <>
                        <Play className="home-course-card-continue-icon" />
                        <span>Start</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Lessons - Only for students */}
      {!isTeacher && recommendedLessons.length > 0 && (
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">
              Recommended for You
            </h2>
            <Link to="/discover" className="home-section-link">
              <span>Explore More</span>
              <ArrowRight className="home-course-card-meta-icon" />
            </Link>
          </div>
          
          {/* Mobile: Vertical List */}
          <div className="home-course-list-mobile">
            {recommendedLessons.slice(0, 3).map((course) => (
              <MobileCourseCard key={course.id} course={course} />
            ))}
          </div>
          
          {/* Desktop: Grid */}
          <div className="home-course-grid">
            {recommendedLessons.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="home-course-card"
              >
                <div className="home-course-card-image home-course-card-image--small">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} />
                  ) : (
                    <BookOpen className="home-course-card-image-placeholder" />
                  )}
                  <span className="home-course-card-category-badge">
                    {course.category || 'Course'}
                  </span>
                </div>
                <div className="home-course-card-body">
                  <h3 className="home-course-card-title">
                    {course.title}
                  </h3>
                  <div className="home-course-card-rating">
                    <div className="home-course-card-meta-item">
                      <Star className="home-course-card-rating-icon" />
                      <span className="home-course-card-rating-text">{course.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                    <div className="home-course-card-meta-item">
                      <Users className="home-course-card-meta-icon" />
                      <span>{course.enrolledStudents || 0}</span>
                    </div>
                  </div>
                  {course.price === 0 || !course.isPaid ? (
                    <span className="home-course-card-price home-course-card-price--free">Free</span>
                  ) : (
                    <span className="home-course-card-price home-course-card-price--paid">${course.price}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Your Current Courses - Only shown if user has progress (students only) */}
      {!isTeacher && hasStartedLearning && (
        <div className="home-section">
          <div className="home-section-header">
            <div>
              <h2 className="home-section-title">
                Your Current Courses
              </h2>
              <p className="home-progress-subtitle">
                Pick up where you left off and keep making progress
              </p>
            </div>
            <Link to="/learn" className="home-section-link">
              <span>View All</span>
              <ArrowRight className="home-course-card-meta-icon" />
            </Link>
          </div>
          
          {/* Mobile: Vertical List */}
          <div className="home-course-list-mobile">
            {coursesInProgress.slice(0, 3).map(({ course, progress }) => (
              <div key={course.id} className="home-progress-card">
                <div className="home-progress-card-header">
                  <div className="home-progress-card-title">
                    {course.title}
                  </div>
                </div>
                {progress && (
                  <div className="home-progress-info">
                    <div className="home-progress-info-header">
                      <span>Progress</span>
                      <span className="home-progress-info-percent">{Math.round(progress.overallProgress)}%</span>
                    </div>
                    <div className="home-progress-bar-container">
                      <div 
                        className="home-progress-bar"
                        style={{ width: `${progress.overallProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <Link to={`/courses/${course.id}/learn`} className="home-progress-button">
                  <Play className="home-progress-button-icon" />
                  Continue
                </Link>
              </div>
            ))}
          </div>
          
          {/* Desktop: Grid */}
          <div className="home-progress-grid">
            {coursesInProgress.slice(0, 6).map(({ course, progress }) => (
              <div key={course.id} className="home-progress-card">
                <div>
                  <h3 className="home-progress-card-title">
                    {course.title}
                  </h3>
                  {progress && (
                    <div className="home-progress-info">
                      <div className="home-progress-info-header">
                        <span>Your Progress</span>
                        <span className="home-progress-info-percent">{Math.round(progress.overallProgress)}%</span>
                      </div>
                      <div className="home-progress-bar-container">
                        <div 
                          className="home-progress-bar"
                          style={{ width: `${progress.overallProgress}%` }}
                        />
                      </div>
                      {progress.completedLessons > 0 && (
                        <p className="home-progress-stats">
                          {progress.completedLessons} of {progress.totalLessons} lessons completed
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <Link to={`/courses/${course.id}/learn`} className="home-progress-button">
                  <Play className="home-progress-button-icon" />
                  Continue
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories - Only for students */}
      {!isTeacher && (
        <div className="home-section">
          <h2 className="home-section-title">
            Browse Categories
          </h2>
        
        {/* Mobile: Horizontal Scroll */}
        <div className="home-categories-scroll">
          <div className="home-categories-scroll-container">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link
                  key={category.id}
                  to={`/discover?category=${category.id}`}
                  className="home-category-card"
                  data-color={category.color}
                >
                  <IconComponent className="home-category-icon" style={{ color: category.color }} />
                  <span className="home-category-text">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Desktop: Grid */}
        <div className="home-categories-grid">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link
                key={category.id}
                to={`/discover?category=${category.id}`}
                className="home-category-card"
                data-color={category.color}
              >
                <IconComponent className="home-category-icon" style={{ color: category.color }} />
                <span className="home-category-text">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      )}

      {/* Popular Courses */}
      {popularCourses.length > 0 && (
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">
              Popular Courses
            </h2>
            <Link to="/discover" className="home-section-link">
              <span>View All</span>
              <ArrowRight className="home-course-card-meta-icon" />
            </Link>
          </div>
          
          {/* Mobile: Horizontal Scroll */}
          <div className="home-course-scroll">
            <div className="home-course-scroll-container">
              {popularCourses.map((course) => (
                <div key={course.id} className="home-course-card-mobile">
                  <MobileCourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop: Grid */}
          <div className="home-course-grid">
            {popularCourses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="home-course-card"
              >
                <div className="home-course-card-image home-course-card-image--small">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} />
                  ) : (
                    <BookOpen className="home-course-card-image-placeholder" />
                  )}
                  <span className="home-course-card-category-badge">
                    {course.category || 'Course'}
                  </span>
                </div>
                <div className="home-course-card-body">
                  <h3 className="home-course-card-title">
                    {course.title}
                  </h3>
                  <div className="home-course-card-rating">
                    <div className="home-course-card-meta-item">
                      <Star className="home-course-card-rating-icon" />
                      <span className="home-course-card-rating-text">{course.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                    <div className="home-course-card-meta-item">
                      <Users className="home-course-card-meta-icon" />
                      <span>{course.enrolledStudents || 0}</span>
                    </div>
                  </div>
                  {course.price === 0 || !course.isPaid ? (
                    <span className="home-course-card-price home-course-card-price--free">Free</span>
                  ) : (
                    <span className="home-course-card-price home-course-card-price--paid">${course.price}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">
              Upcoming Sessions
            </h2>
            <Link to="/schedule" className="home-section-link">
              <span>View Calendar</span>
              <ArrowRight className="home-course-card-meta-icon" />
            </Link>
          </div>
          
          <div className="home-sessions-list">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="home-session-card">
                <div className="home-session-content">
                  <div className="home-session-info">
                    <h3 className="home-session-title">
                      {session.title || 'Live Session'}
                    </h3>
                    <div className="home-session-meta">
                      <div className="home-session-meta-item">
                        <Calendar className="home-session-meta-icon" />
                        <span>{new Date(session.startTime || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <div className="home-session-meta-item">
                        <Clock className="home-session-meta-icon" />
                        <span>{new Date(session.startTime || Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <button className="home-session-button">
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="home-section">
          <h2 className="home-section-title">
            Announcements
          </h2>
          
          <div className="home-announcements-list">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`home-announcement-card ${announcement.type === 'challenge' ? 'home-announcement-card--challenge' : 'home-announcement-card--default'}`}
              >
                <div className="home-announcement-content">
                  <div className={`home-announcement-icon-wrapper ${announcement.type === 'challenge' ? 'home-announcement-icon-wrapper--challenge' : 'home-announcement-icon-wrapper--default'}`}>
                    {announcement.type === 'challenge' ? (
                      <Zap className="home-announcement-icon home-announcement-icon--challenge" />
                    ) : (
                      <Bell className="home-announcement-icon home-announcement-icon--default" />
                    )}
                  </div>
                  <div className="home-announcement-text">
                    <h3 className="home-announcement-title">
                      {announcement.title}
                    </h3>
                    <p className="home-announcement-message">
                      {announcement.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

