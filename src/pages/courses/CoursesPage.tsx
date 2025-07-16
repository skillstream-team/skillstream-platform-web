import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, Zap, BarChart3, Search, Grid, List, Star, Clock, Users, Edit3, X, Save
} from 'lucide-react';
import { Course } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { useAuthStore } from '../../store/auth';
import { getCourses, getTeacherCourses } from '../../services/api';

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

  // Check URL parameters for auto-opening the create modal
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('create') === 'true' && isTeacher) {
      setShowCreateModal(true);
      // Clean up the URL by removing the query parameter
      navigate('/courses', { replace: true });
    }
  }, [location.search, isTeacher, navigate]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      let coursesData;
      
      if (isTeacher) {
        // For teachers, get their own courses with pagination
        coursesData = await getTeacherCourses(user?.id || '', {
          page: 1,
          limit: 50
        });
      } else {
        // For students, get all available courses with filtering
        coursesData = await getCourses({
          page: 1,
          limit: 50
        });
      }
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]); // Show empty state if API fails or not implemented
    } finally {
      setIsLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Level filter
    if (filters.level) {
      filtered = filtered.filter(course => {
        if (filters.level === 'BEGINNER') return course.level === 'Beginner';
        if (filters.level === 'INTERMEDIATE') return course.level === 'Intermediate';
        if (filters.level === 'ADVANCED') return course.level === 'Advanced';
        return true;
      });
    }

    // Price filter
    if (filters.price) {
      filtered = filtered.filter(course => {
        if (filters.price === 'FREE') return !course.isPaid;
        if (filters.price === 'PAID') return course.isPaid;
        return true;
      });
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(course => 
        course.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Status filter (for teachers)
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
    const totalStudents = course.enrolledStudents || course.enrollments.length;
    const activeStudents = Math.floor(totalStudents * 0.85); // Mock active students
    const completionRate = Math.floor(Math.random() * 30) + 70; // Mock completion rate
    
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
      
      // In a real app, this would call the API
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
      
      // Navigate to the new course for editing
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <BackButton showHome />
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isTeacher ? 'My Courses' : 'Courses'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {isTeacher 
                    ? 'Manage your courses and track student progress'
                    : 'Explore our comprehensive course catalog'
                  }
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              {isTeacher && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Performing Courses Section (for teachers) */}
        {isTeacher && getTopPerformingCourses().length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Top Performing Courses
              </h2>
              <Link
                to="/analytics"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                View All Analytics →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getTopPerformingCourses().map(course => (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {course.title}
                    </h3>
                    <button
                      onClick={() => handleBoostCourse(course.id)}
                      className="flex items-center px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Boost!
                    </button>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Enrolled Students</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {course.enrolledStudents?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Completion Rate</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {course.completionRate || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Revenue</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        ${(course.revenue ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/courses/${course.id}`}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                    >
                      Manage
                    </Link>
                    <Link
                      to={`/analytics?courseId=${course.id}`}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={isTeacher ? "Search your courses..." : "Search courses..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
            <select
              value={filters.price}
              onChange={(e) => setFilters(prev => ({ ...prev, price: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Prices</option>
              <option value="FREE">Free</option>
              <option value="PAID">Paid</option>
            </select>
            {isTeacher && (
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Course Grid/List */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isTeacher ? 'No courses found' : 'No courses found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
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
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredCourses.map(course => {
              const enrollmentStats = getEnrollmentStats(course);
              
              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <>
                      {/* Course Image */}
                      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                        <img 
                          src={getCourseImage(course)} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col space-y-1">
                          {!course.isPaid && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Free
                            </span>
                          )}
                          {course.level && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              {course.level}
                            </span>
                          )}
                          {isTeacher && (
                            <span className={`text-white text-xs px-2 py-1 rounded-full font-medium ${
                              course.isActive ? 'bg-green-500' : 'bg-yellow-500'
                            }`}>
                              {course.isActive ? 'Active' : 'Draft'}
                            </span>
                          )}
                        </div>
                        
                        {course.enrolledStudents && course.enrolledStudents > 1000 && (
                          <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Popular
                          </span>
                        )}
                      </div>

                      {/* Course Content */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {course.category}
                          </span>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            {course.rating || 4.5}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {course.title}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                          {course.description}
                        </p>
                        
                        {/* Course Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {course.duration || '8 weeks'}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {enrollmentStats.totalStudents.toLocaleString()} students
                          </div>
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {course.materials.length} materials
                          </div>
                        </div>

                        {/* Teacher-specific stats */}
                        {isTeacher && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {enrollmentStats.activeStudents}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400">Active</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {enrollmentStats.completionRate}%
                                </div>
                                <div className="text-gray-500 dark:text-gray-400">Completion</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Instructor */}
                        {!isTeacher && (
                          <div className="flex items-center mb-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                              {course.teacher.avatarUrl ? (
                                <img 
                                  src={course.teacher.avatarUrl} 
                                  alt={course.teacher.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                    {course.teacher.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {course.teacher.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Course Instructor
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Price and Action */}
                        <div className="flex items-center justify-between">
                          <div>
                            {course.price === 0 ? (
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">Free</span>
                            ) : (
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                ${course.price}
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            {isTeacher && course.status === 'published' && (
                              <button
                                onClick={() => handleBoostCourse(course.id)}
                                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium text-sm"
                              >
                                <Zap className="h-4 w-4" />
                              </button>
                            )}
                            {isTeacher && (
                              <Link
                                to={`/courses/${course.id}`}
                                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Link>
                            )}
                            <Link
                              to={`/courses/${course.id}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                            >
                              {isTeacher ? 'Manage' : 'View Course'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // List View
                    <div className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img 
                            src={getCourseImage(course)} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {course.title}
                            </h3>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {course.rating || 4.8}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {course.description}
                          </p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{enrollmentStats.totalStudents.toLocaleString()} students</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{course.duration || '8 weeks'}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
                                {course.level || 'Beginner'}
                              </span>
                            </div>
                            {isTeacher && (
                              <div className="flex items-center">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  course.isActive 
                                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                                }`}>
                                  {course.isActive ? 'Active' : 'Draft'}
                                </span>
                              </div>
                            )}
                            {!isTeacher && (
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                  {course.teacher.avatarUrl ? (
                                    <img 
                                      src={course.teacher.avatarUrl} 
                                      alt={course.teacher.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {course.teacher.name.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <span className="ml-2">{course.teacher.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {course.isPaid ? `$${course.price}` : 'Free'}
                          </div>
                          {course.isPaid && course.price && course.price < 100 && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                              $99
                            </div>
                          )}
                          <div className="flex space-x-2 mt-2">
                            {isTeacher && course.status === 'published' && (
                              <button
                                onClick={() => handleBoostCourse(course.id)}
                                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
                              >
                                <Zap className="h-4 w-4" />
                              </button>
                            )}
                            {isTeacher && (
                              <Link
                                to={`/courses/${course.id}`}
                                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Link>
                            )}
                            <Link
                              to={`/courses/${course.id}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              {isTeacher ? 'Manage' : 'View Course'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Course
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter course title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Enter course description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={newCourse.category}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select category</option>
                  {/* categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))} */}
                </select>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPaid"
                    checked={newCourse.isPaid}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, isPaid: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPaid" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Paid Course
                  </label>
                </div>
              </div>
              
              {newCourse.isPaid && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter price (e.g., 99.99)"
                    min="0"
                    step="0.01"
                  />
                  {newCourse.price && newCourse.price > 0 && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                      You will earn ${(newCourse.price * 0.7).toFixed(2)} per student
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={!newCourse.title || !newCourse.description || !newCourse.category}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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