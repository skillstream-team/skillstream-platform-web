import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, Zap, BarChart3, Search, Grid, List, Star, Clock, Users, Edit3, X, Save,
  Filter, SlidersHorizontal, ChevronDown
} from 'lucide-react';
import { Course } from '../../types';
import { useAuthStore } from '../../store/auth';
import { getCourses, getTeacherCourses } from '../../services/api';
import { MobileCourseCard } from '../../components/mobile/MobileCourseCard';
import { BottomSheet } from '../../components/mobile/BottomSheet';

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
    price: undefined as number | undefined,
    isPaid: false
  });

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

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      let coursesData;
      
      if (isTeacher) {
        coursesData = await getTeacherCourses(user?.id || '');
      } else {
        coursesData = await getCourses();
      }
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
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

  const handleCreateCourse = async () => {
    try {
      const newCourseId = `course-${Date.now()}`;
      const createdCourse: Course = {
        id: newCourseId,
        title: newCourse.title,
        description: newCourse.description,
        category: newCourse.category,
        price: newCourse.price || 0,
        isPaid: newCourse.isPaid,
        teacherId: user?.id || '',
        teacher: {
          id: user?.id || '',
          name: user?.name || '',
          email: user?.email || '',
          role: user?.role || 'TEACHER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        lessons: [],
        materials: [],
        enrollments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCourses(prev => [createdCourse, ...prev]);
      setShowCreateModal(false);
      setNewCourse({ title: '', description: '', category: '', price: undefined, isPaid: false });
      navigate(`/courses/${newCourseId}`);
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  const handleBoostCourse = (courseId: string) => {
    navigate(`/marketing-guide?courseId=${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F7FA' }}>
        <div 
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{ borderColor: '#00B5AD' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F7FA' }}>
      {/* Header Section */}
      <div 
        className="mb-8 rounded-[20px] p-8 backdrop-blur-xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 181, 173, 0.1) 0%, rgba(111, 115, 210, 0.1) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(11, 30, 63, 0.1)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
              {isTeacher ? 'My Courses' : 'Explore Courses'}
            </h1>
            <p className="text-lg" style={{ color: '#6F73D2' }}>
              {isTeacher 
                ? 'Manage your courses and track student progress'
                : 'Discover amazing courses and start learning'}
            </p>
          </div>
          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
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
              Create Course
            </button>
          )}
        </div>
      </div>

      {/* Top Performing Courses Section (for teachers) */}
      {isTeacher && getTopPerformingCourses().length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
              Top Performing Courses
            </h2>
            <Link
              to="/analytics"
              className="text-sm font-semibold transition-colors hover:opacity-80 flex items-center space-x-1"
              style={{ color: '#00B5AD' }}
            >
              <span>View All Analytics</span>
              <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getTopPerformingCourses().map(course => (
              <div
                key={course.id}
                className="p-6 rounded-[20px] border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg line-clamp-2" style={{ color: '#0B1E3F' }}>
                    {course.title}
                  </h3>
                  <button
                    onClick={() => handleBoostCourse(course.id)}
                    className="p-2 rounded-xl transition-all duration-200 hover:scale-110"
                    style={{ backgroundColor: 'rgba(154, 140, 255, 0.1)' }}
                  >
                    <Zap className="h-5 w-5" style={{ color: '#9A8CFF' }} />
                  </button>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#6F73D2' }}>Enrolled Students</span>
                    <span className="font-semibold" style={{ color: '#0B1E3F' }}>
                      {course.enrolledStudents?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#6F73D2' }}>Completion Rate</span>
                    <span className="font-semibold" style={{ color: '#0B1E3F' }}>
                      {course.completionRate || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#6F73D2' }}>Revenue</span>
                    <span className="font-semibold" style={{ color: '#00B5AD' }}>
                      ${(course.revenue ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link
                    to={`/courses/${course.id}`}
                    className="flex-1 px-4 py-2.5 text-white rounded-xl font-semibold text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
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
                    Manage
                  </Link>
                  <Link
                    to={`/analytics?courseId=${course.id}`}
                    className="px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                    style={{ backgroundColor: 'rgba(111, 115, 210, 0.1)' }}
                  >
                    <BarChart3 className="h-5 w-5" style={{ color: '#6F73D2' }} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div 
        className="mb-8 p-6 rounded-[20px] border-2"
        style={{
          backgroundColor: 'white',
          borderColor: '#E5E7EB'
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 relative">
            <Search 
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
                focusedSearch ? 'text-[#00B5AD]' : 'text-gray-400'
              }`} 
            />
            <input
              type="text"
              placeholder={isTeacher ? "Search your courses..." : "Search courses..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setFocusedSearch(true)}
              onBlur={() => setFocusedSearch(false)}
              className="w-full pl-12 pr-4 py-4 border-2 rounded-xl transition-all duration-200 focus:outline-none"
              style={{
                borderColor: focusedSearch ? '#00B5AD' : '#E5E7EB',
                backgroundColor: 'white',
                color: '#0B1E3F',
                fontSize: '16px',
                boxShadow: focusedSearch ? '0 0 0 4px rgba(0, 181, 173, 0.1)' : 'none'
              }}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-4 border-2 rounded-xl font-medium transition-all duration-200 ${
                showFilters ? 'text-white' : ''
              }`}
              style={{
                backgroundColor: showFilters ? '#00B5AD' : 'transparent',
                borderColor: showFilters ? '#00B5AD' : '#E5E7EB',
                color: showFilters ? 'white' : '#0B1E3F'
              }}
            >
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            
            <div className="flex items-center space-x-1 p-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid' ? 'text-white' : 'text-[#00B5AD]'
                }`}
                style={{
                  backgroundColor: viewMode === 'grid' ? '#00B5AD' : 'transparent'
                }}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' ? 'text-white' : 'text-[#00B5AD]'
                }`}
                style={{
                  backgroundColor: viewMode === 'list' ? '#00B5AD' : 'transparent'
                }}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Filter Panel */}
        {showFilters && (
          <div className="hidden lg:grid mt-6 pt-6 border-t grid-cols-2 md:grid-cols-4 gap-4" style={{ borderColor: '#E5E7EB' }}>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                Level
              </label>
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
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
          <div className="lg:hidden space-y-4">
            {filteredCourses.map(course => (
              <MobileCourseCard
                key={course.id}
                course={course}
                isTeacher={isTeacher}
                onBoost={handleBoostCourse}
              />
            ))}
          </div>
          
          {/* Desktop View */}
          <div className={`hidden lg:grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
            {filteredCourses.map(course => {
              const enrollmentStats = getEnrollmentStats(course);
              
              return (
                <div
                  key={course.id}
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
                            <button
                              onClick={() => handleBoostCourse(course.id)}
                              className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                              style={{ backgroundColor: 'rgba(154, 140, 255, 0.1)' }}
                            >
                              <Zap className="h-5 w-5" style={{ color: '#9A8CFF' }} />
                            </button>
                          )}
                          {isTeacher && (
                            <Link
                              to={`/courses/${course.id}`}
                              className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                              style={{ backgroundColor: 'rgba(111, 115, 210, 0.1)' }}
                            >
                              <Edit3 className="h-5 w-5" style={{ color: '#6F73D2' }} />
                            </Link>
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

      {/* Create Course Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(11, 30, 63, 0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="rounded-[20px] p-8 w-full max-w-lg backdrop-blur-xl border"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              boxShadow: '0 20px 60px rgba(11, 30, 63, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                Create New Course
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-110"
                style={{ color: '#6F73D2' }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                  Course Title
                </label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
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
                  placeholder="Enter course title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                  Description
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 resize-none"
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
                  rows={3}
                  placeholder="Enter course description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                  Category
                </label>
                <select
                  value={newCourse.category}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
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
                  <option value="">Select category</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={newCourse.isPaid}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, isPaid: e.target.checked }))}
                  className="h-4 w-4 rounded border-2"
                  style={{ 
                    accentColor: '#00B5AD',
                    borderColor: '#E5E7EB'
                  }}
                />
                <label htmlFor="isPaid" className="ml-3 text-sm font-medium" style={{ color: '#0B1E3F' }}>
                  Paid Course
                </label>
              </div>
              
              {newCourse.isPaid && (
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    value={newCourse.price || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? undefined : parseFloat(value);
                      setNewCourse(prev => ({ ...prev, price: numValue }));
                    }}
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
                    placeholder="Enter price (e.g., 99.99)"
                    min="0"
                    step="0.01"
                  />
                  {newCourse.price && newCourse.price > 0 && (
                    <div className="mt-2 text-sm font-medium" style={{ color: '#00B5AD' }}>
                      You will earn ${(newCourse.price * 0.7).toFixed(2)} per student
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
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
                onClick={handleCreateCourse}
                disabled={!newCourse.title || !newCourse.description || !newCourse.category}
                className="flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{ 
                  backgroundColor: '#00B5AD',
                  boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#00968d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#00B5AD';
                  }
                }}
              >
                <Save className="h-4 w-4 mr-2 inline" />
                Create Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
