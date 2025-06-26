import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  Search, 
  Filter, 
  Grid, 
  List,
  Play,
  Download,
  Calendar,
  CheckCircle,
  Circle,
  ArrowLeft,
  Plus,
  MessageCircle,
  Video,
  Bell,
  Share2,
  Edit3,
  BarChart3,
  GraduationCap,
  Eye,
  Settings
} from 'lucide-react';
import { apiService } from '../../services/api';
import { Course } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { dummyCourses } from '../../data/courseData';
import { useAuthStore } from '../../store/auth';

export const CoursesPage: React.FC = () => {
  const { user } = useAuthStore();
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

  const categories = [
    'Web Development',
    'Frontend Development',
    'Data Science',
    'DevOps',
    'Mobile Development',
    'Design',
    'Business',
    'Marketing',
    'Language',
    'Music',
    'Photography',
    'Fitness'
  ];

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery, filters]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      let coursesData;
      
      if (isTeacher) {
        // For teachers, get their own courses
        coursesData = await apiService.getTeacherCourses(user?.id || '');
      } else {
        // For students, get all available courses
        coursesData = await apiService.getCourses();
      }
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      // Use the comprehensive dummy course data
      // For teachers, filter to show only their courses
      if (isTeacher) {
        const teacherCourses = dummyCourses.filter(course => 
          course.teacher.id === user?.id || course.teacher.name === user?.name
        );
        setCourses(teacherCourses);
      } else {
        setCourses(dummyCourses);
      }
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
                <Link
                  to="/course-builder"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <Link
                to="/course-builder"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Link>
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
                            {isTeacher && (
                              <Link
                                to={`/course-builder/${course.id}`}
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
                            {isTeacher && (
                              <Link
                                to={`/course-builder/${course.id}`}
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
    </div>
  );
}; 