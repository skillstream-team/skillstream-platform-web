import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { getCourses } from '../services/api';
import { Course } from '../types';
import { SwipeableTabs } from '../components/mobile/SwipeableTabs';
import { MobileCourseCard } from '../components/mobile/MobileCourseCard';
import { BottomSheet } from '../components/mobile/BottomSheet';

export const LearnPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'saved'>('active');
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses({ limit: 50 });
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Simulate course progress and status
  const getCourseProgress = (courseId: string) => {
    // Mock progress data
    const progressMap: Record<string, number> = {
      '1': 65,
      '2': 30,
      '3': 100,
      '4': 0,
    };
    return progressMap[courseId] || Math.floor(Math.random() * 100);
  };

  const activeCourses = courses.filter(c => {
    const progress = getCourseProgress(c.id);
    return progress > 0 && progress < 100;
  });

  const completedCourses = courses.filter(c => {
    const progress = getCourseProgress(c.id);
    return progress === 100;
  });

  const savedCourses = courses.slice(0, 5); // Mock saved courses

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F7FA' }}>
        <div 
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{ borderColor: '#00B5AD' }}
        ></div>
      </div>
    );
  }

  const renderCourseCard = (course: Course, progress?: number) => (
    <Link
      key={course.id}
      to={`/courses/${course.id}`}
      className="group rounded-[20px] border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{
        backgroundColor: 'white',
        borderColor: '#E5E7EB'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#00B5AD';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E5E7EB';
      }}
    >
      <div className="flex">
        <div className="w-32 lg:w-48 h-32 lg:h-40 bg-gray-200 flex items-center justify-center relative overflow-hidden flex-shrink-0">
          {course.imageUrl ? (
            <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="h-12 w-12" style={{ color: '#00B5AD' }} />
          )}
          {progress !== undefined && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90 w-16 h-16">
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
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{progress}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <span 
                className="inline-block px-2 py-1 rounded-full text-xs font-bold mb-2"
                style={{ 
                  backgroundColor: 'rgba(0, 181, 173, 0.1)',
                  color: '#00B5AD'
                }}
              >
                {course.category || 'Course'}
              </span>
              <h3 className="text-lg font-bold mb-2 line-clamp-2" style={{ color: '#0B1E3F' }}>
                {course.title}
              </h3>
            </div>
            {progress === 100 && (
              <CheckCircle className="h-6 w-6 flex-shrink-0 ml-2" style={{ color: '#00B5AD' }} />
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm mb-3" style={{ color: '#6F73D2' }}>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
              <span className="font-semibold">{course.rating?.toFixed(1) || '4.5'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration || '8 weeks'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{course.enrolledStudents || 0}</span>
            </div>
          </div>
          
          {progress !== undefined && progress < 100 && (
            <div className="mb-3">
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: '#00B5AD'
                  }}
                />
              </div>
            </div>
          )}
          
          <button
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-white transition-all duration-300"
            style={{ 
              backgroundColor: '#00B5AD',
              boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
            }}
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/courses/${course.id}/learn`;
            }}
          >
            <span>{progress === 100 ? 'Review' : progress && progress > 0 ? 'Resume' : 'Start'}</span>
            <Play className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F7FA' }}>
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
          My Learning
        </h1>
        <p className="text-base" style={{ color: '#6F73D2' }}>
          Track your progress and continue your learning journey
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#6F73D2' }} />
          <input
            type="text"
            placeholder="Search your courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
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
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="px-6 py-3 border-2 rounded-xl font-semibold transition-all duration-200 active:scale-95"
          style={{
            borderColor: '#E5E7EB',
            color: '#0B1E3F',
            backgroundColor: 'white'
          }}
        >
          <Filter className="h-5 w-5 inline mr-2" />
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
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 mx-auto mb-4" style={{ color: '#6F73D2', opacity: 0.5 }} />
                      <p className="text-lg font-semibold mb-2" style={{ color: '#0B1E3F' }}>No active courses</p>
                      <p className="text-sm" style={{ color: '#6F73D2' }}>Start learning to see your progress here</p>
                      <Link
                        to="/discover"
                        className="inline-flex items-center space-x-2 mt-4 px-6 py-3 rounded-xl font-semibold text-white"
                        style={{ 
                          backgroundColor: '#00B5AD',
                          boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                        }}
                      >
                        <span>Discover Courses</span>
                        <ArrowRight className="h-4 w-4" />
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
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: '#6F73D2', opacity: 0.5 }} />
                      <p className="text-lg font-semibold mb-2" style={{ color: '#0B1E3F' }}>No completed courses yet</p>
                      <p className="text-sm" style={{ color: '#6F73D2' }}>Complete your first course to see it here</p>
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
                    <div className="text-center py-12">
                      <Bookmark className="h-16 w-16 mx-auto mb-4" style={{ color: '#6F73D2', opacity: 0.5 }} />
                      <p className="text-lg font-semibold mb-2" style={{ color: '#0B1E3F' }}>No saved courses</p>
                      <p className="text-sm" style={{ color: '#6F73D2' }}>Save courses to access them later</p>
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
        <div className="flex space-x-2 mb-6">
          {[
            { id: 'active', label: 'Active', count: filteredCourses.active.length },
            { id: 'completed', label: 'Completed', count: filteredCourses.completed.length },
            { id: 'saved', label: 'Saved', count: filteredCourses.saved.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'active' | 'completed' | 'saved')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === tab.id ? 'scale-105' : ''
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? '#00B5AD' : 'rgba(0, 181, 173, 0.1)',
                color: activeTab === tab.id ? 'white' : '#0B1E3F',
                boxShadow: activeTab === tab.id ? '0 4px 14px rgba(0, 181, 173, 0.3)' : 'none'
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: activeTab === tab.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 181, 173, 0.2)' }}>
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
                  const progress = getCourseProgress(course.id);
                  return renderCourseCard(course, progress);
                })
              ) : (
                <div className="text-center py-16 rounded-2xl border-2" style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }}>
                  <BookOpen className="h-16 w-16 mx-auto mb-4" style={{ color: '#6F73D2', opacity: 0.5 }} />
                  <p className="text-xl font-bold mb-2" style={{ color: '#0B1E3F' }}>No active courses</p>
                  <p className="text-sm mb-6" style={{ color: '#6F73D2' }}>Start learning to see your progress here</p>
                  <Link
                    to="/discover"
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white"
                    style={{ 
                      backgroundColor: '#00B5AD',
                      boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                    }}
                  >
                    <span>Discover Courses</span>
                    <ArrowRight className="h-4 w-4" />
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
                <div className="text-center py-16 rounded-2xl border-2" style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }}>
                  <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: '#6F73D2', opacity: 0.5 }} />
                  <p className="text-xl font-bold mb-2" style={{ color: '#0B1E3F' }}>No completed courses yet</p>
                  <p className="text-sm" style={{ color: '#6F73D2' }}>Complete your first course to see it here</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'saved' && (
            <>
              {filteredCourses.saved.length > 0 ? (
                filteredCourses.saved.map(course => renderCourseCard(course))
              ) : (
                <div className="text-center py-16 rounded-2xl border-2" style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }}>
                  <Bookmark className="h-16 w-16 mx-auto mb-4" style={{ color: '#6F73D2', opacity: 0.5 }} />
                  <p className="text-xl font-bold mb-2" style={{ color: '#0B1E3F' }}>No saved courses</p>
                  <p className="text-sm" style={{ color: '#6F73D2' }}>Save courses to access them later</p>
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

