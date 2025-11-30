import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Bookmark,
  Clock,
  Users,
  Star,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { getCourses, getProgress, getUserProgressCourses } from '../services/api';
import { Course } from '../types';
import { SwipeableTabs } from '../components/mobile/SwipeableTabs';
import { MobileCourseCard } from '../components/mobile/MobileCourseCard';
import { BottomSheet } from '../components/mobile/BottomSheet';
import { findNextUncompletedLesson } from '../utils/courseProgress';

export const LearnPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'saved'>('active');
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseIds, setActiveCourseIds] = useState<string[]>([]);
  const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [continueLoading, setContinueLoading] = useState<Record<string, boolean>>({});
  const [courseProgressMap, setCourseProgressMap] = useState<Record<string, number>>({});

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    // Load progress for active courses
    if (activeCourses.length > 0) {
      activeCourses.forEach(async (course) => {
        try {
          const progress = await getCourseProgress(course.id);
          setCourseProgressMap(prev => ({ ...prev, [course.id]: progress }));
        } catch (error) {
          console.error(`Error loading progress for course ${course.id}:`, error);
        }
      });
    }
  }, [activeCourses]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses({ limit: 50 });
      let activeIds: string[] = [];
      let completedIds: string[] = [];

      if (user?.id) {
        try {
          const [activeCoursesResp, completedCoursesResp] = await Promise.all([
            getUserProgressCourses(user.id, 'in_progress'),
            getUserProgressCourses(user.id, 'completed')
          ]);
          activeIds = activeCoursesResp.map(c => c.id);
          completedIds = completedCoursesResp.map(c => c.id);
        } catch (progressError) {
          console.error('Error loading user progress course lists:', progressError);
        }
      }

      setCourses(data);
      setActiveCourseIds(activeIds);
      setCompletedCourseIds(completedIds);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Get course progress from API
  const getCourseProgress = async (courseId: string) => {
    try {
      const progress = await getProgress(courseId);
      return progress?.overallProgress ?? 0;
    } catch {
      return 0;
    }
  };

  // Filter courses based on progress lists
  const activeCourses = activeCourseIds.length
    ? courses.filter(c => activeCourseIds.includes(c.id))
    : courses;
  const completedCourses: Course[] = completedCourseIds.length
    ? courses.filter(c => completedCourseIds.includes(c.id))
    : [];
  const savedCourses: Course[] = [];

  const filteredCourses = {
    active: activeCourses.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    completed: completedCourses.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    saved: savedCourses.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  };

  if (loading) {
    return (
      <div className="learn-loading">
        <div className="learn-loading-spinner"></div>
      </div>
    );
  }

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

  const renderCourseCard = (course: Course, progress?: number) => {
    const courseProgress = progress ?? courseProgressMap[course.id] ?? 0;
    const hasProgress = courseProgress > 0;
    
    return (
    <div key={course.id} className="learn-course-card">
      <Link
        to={`/courses/${course.id}`}
        className="learn-course-card-link"
      >
      <div className="learn-course-card-content">
        <div className="learn-course-image-wrapper">
          {course.imageUrl ? (
            <img src={course.imageUrl} alt={course.title} />
          ) : (
            <BookOpen className="learn-course-image-icon" />
          )}
          {courseProgress > 0 && (
            <div className="learn-course-progress-overlay">
              <div className="learn-course-progress-circle">
                <svg>
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#E5E7EB"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#00B5AD"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - courseProgress / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="learn-course-progress-text">
                  <span>{Math.round(courseProgress)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="learn-course-info">
          <div className="learn-course-header">
            <div className="learn-course-header-left">
              <span className="learn-course-category">
                {course.category || 'Course'}
              </span>
              <h3 className="learn-course-title">
                {course.title}
              </h3>
            </div>
            {courseProgress === 100 && (
              <CheckCircle className="learn-course-complete-icon" />
            )}
          </div>
          
          <div className="learn-course-meta">
            <div className="learn-course-meta-item">
              <Star className="learn-course-meta-icon learn-course-meta-icon--star" />
              <span className="font-semibold">{course.rating?.toFixed(1) || '4.5'}</span>
            </div>
            <div className="learn-course-meta-item">
              <Clock className="learn-course-meta-icon" />
              <span>{course.duration || '8 weeks'}</span>
            </div>
            <div className="learn-course-meta-item">
              <Users className="learn-course-meta-icon" />
              <span>{course.enrolledStudents || 0}</span>
            </div>
          </div>
          
          {courseProgress > 0 && courseProgress < 100 && (
            <div className="learn-course-progress-bar">
              <div className="learn-course-progress-bar-bg">
                <div 
                  className="learn-course-progress-bar-fill"
                  style={{ width: `${courseProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
    <button
      className="learn-course-action-button"
      onClick={(e) => handleContinueLearning(course.id, e)}
      disabled={continueLoading[course.id]}
    >
      {continueLoading[course.id] ? (
        <span>Loading...</span>
      ) : courseProgress === 100 ? (
        <>
          <span>Review</span>
          <Play className="learn-course-action-button-icon" />
        </>
      ) : hasProgress ? (
        <>
          <span>Continue</span>
          <Play className="learn-course-action-button-icon" />
        </>
      ) : (
        <>
          <span>Start</span>
          <Play className="learn-course-action-button-icon" />
        </>
      )}
    </button>
    </div>
    );
  };

  return (
    <div className="learn-page">
      {/* Header Section */}
      <div className="courses-header">
        <div className="courses-header-content">
          <div className="courses-header-text">
            <h1 className="courses-header-title">
              My Learning
            </h1>
            <p className="courses-header-subtitle">
              Continue your courses and track your progress
            </p>
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="learn-header">
        <h1 className="learn-title">
          My Learning
        </h1>
        <p className="learn-subtitle">
          Track your progress and continue your learning journey
        </p>
      </div>

      {/* Search and Filter */}
      <div className="learn-search-filter">
        <div className="learn-search-wrapper">
          <Search className="learn-search-icon" />
          <input
            type="text"
            placeholder="Search your courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="learn-search-input"
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="learn-filters-button"
        >
          <Filter className="learn-filters-button-icon" />
          Filters
        </button>
      </div>

      {/* Mobile: Swipeable Tabs */}
      <div className="lg:hidden mb-6">
        <SwipeableTabs
          tabs={[
            {
              id: 'active',
              label: 'Active',
              content: (
                <div className="space-y-4">
                  {filteredCourses.active.length > 0 ? (
                    filteredCourses.active.map(course => (
                      <div key={course.id}>
                        <MobileCourseCard course={course} />
                      </div>
                    ))
                  ) : (
                    <div className="learn-empty-state">
                      <BookOpen className="learn-empty-state-icon" />
                      <p className="learn-empty-state-title">No active courses</p>
                      <p className="learn-empty-state-text">Start learning to see your progress here</p>
                      <Link
                        to="/discover"
                        className="learn-empty-state-button"
                      >
                        <span>Discover Courses</span>
                        <ArrowRight className="learn-empty-state-button-icon" />
                      </Link>
                    </div>
                  )}
                </div>
              )
            },
            {
              id: 'completed',
              label: 'Completed',
              content: (
                <div className="space-y-4">
                  {filteredCourses.completed.length > 0 ? (
                    filteredCourses.completed.map(course => (
                      <div key={course.id}>
                        <MobileCourseCard course={course} />
                      </div>
                    ))
                  ) : (
                    <div className="learn-empty-state">
                      <CheckCircle className="learn-empty-state-icon" />
                      <p className="learn-empty-state-title">No completed courses yet</p>
                      <p className="learn-empty-state-text">Complete your first course to see it here</p>
                    </div>
                  )}
                </div>
              )
            },
            {
              id: 'saved',
              label: 'Saved',
              content: (
                <div className="space-y-4">
                  {filteredCourses.saved.length > 0 ? (
                    filteredCourses.saved.map(course => (
                      <div key={course.id}>
                        <MobileCourseCard course={course} />
                      </div>
                    ))
                  ) : (
                    <div className="learn-empty-state">
                      <Bookmark className="learn-empty-state-icon" />
                      <p className="learn-empty-state-title">No saved courses</p>
                      <p className="learn-empty-state-text">Save courses to access them later</p>
                    </div>
                  )}
                </div>
              )
            }
          ]}
          defaultTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as 'active' | 'completed' | 'saved')}
        />
      </div>

      {/* Desktop: Tabs */}
      <div className="hidden lg:block">
        <div className="learn-desktop-tabs">
          {[
            { id: 'active', label: 'Active', count: filteredCourses.active.length },
            { id: 'completed', label: 'Completed', count: filteredCourses.completed.length },
            { id: 'saved', label: 'Saved', count: filteredCourses.saved.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'active' | 'completed' | 'saved')}
              className={`learn-tab-button ${activeTab === tab.id ? 'learn-tab-button--active' : 'learn-tab-button--inactive'}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`learn-tab-count ${activeTab === tab.id ? 'learn-tab-count--active' : 'learn-tab-count--inactive'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'active' && (
            <>
              {filteredCourses.active.length > 0 ? (
                filteredCourses.active.map(course => {
                  // TODO: Load actual progress when API is available
                  return renderCourseCard(course);
                })
              ) : (
                <div className="learn-empty-state-desktop">
                  <BookOpen className="learn-empty-state-desktop-icon" />
                  <p className="learn-empty-state-desktop-title">No active courses</p>
                  <p className="learn-empty-state-desktop-text">Start learning to see your progress here</p>
                  <Link
                    to="/discover"
                    className="learn-empty-state-button"
                  >
                    <span>Discover Courses</span>
                    <ArrowRight className="learn-empty-state-button-icon" />
                  </Link>
                </div>
              )}
            </>
          )}

          {activeTab === 'completed' && (
            <>
              {filteredCourses.completed.length > 0 ? (
                filteredCourses.completed.map(course => renderCourseCard(course, 100))
              ) : (
                <div className="learn-empty-state-desktop">
                  <CheckCircle className="learn-empty-state-desktop-icon" />
                  <p className="learn-empty-state-desktop-title">No completed courses yet</p>
                  <p className="learn-empty-state-desktop-text">Complete your first course to see it here</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'saved' && (
            <>
              {filteredCourses.saved.length > 0 ? (
                filteredCourses.saved.map(course => renderCourseCard(course))
              ) : (
                <div className="learn-empty-state-desktop">
                  <Bookmark className="learn-empty-state-desktop-icon" />
                  <p className="learn-empty-state-desktop-title">No saved courses</p>
                  <p className="learn-empty-state-desktop-text">Save courses to access them later</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Courses"
        maxHeight="70vh"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: '#0B1E3F' }}>
              Sort By
            </label>
            <div className="space-y-2">
              {['Recent', 'Progress', 'Title', 'Rating'].map((option) => (
                <button
                  key={option}
                  className="w-full px-4 py-3 rounded-xl font-semibold text-left transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(0, 181, 173, 0.1)',
                    color: '#0B1E3F'
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

