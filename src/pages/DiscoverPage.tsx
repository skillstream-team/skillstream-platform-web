import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Star,
  Users,
  Clock,
  ArrowRight,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { getCourses, getTeachers } from '../services/api';
import { Course, User } from '../types';
import { MobileCourseCard } from '../components/mobile/MobileCourseCard';
import { BottomSheet } from '../components/mobile/BottomSheet';
import { MobileChips } from '../components/mobile/MobileUtils';

export const DiscoverPage: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [featuredInstructors, setFeaturedInstructors] = useState<Array<{
    id: string;
    name: string;
    specialty: string;
    students: number;
    rating: number;
    avatar: string | null;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const search = params.get('search');
    if (category) {
      setSelectedCategory(category);
    }
    if (search) {
      setSearchQuery(search);
    }
    loadCourses();
    loadFeaturedInstructors();
  }, [location.search]);

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

  const loadFeaturedInstructors = async () => {
    try {
      const teachers = await getTeachers();
      const allCourses = await getCourses({ limit: 100 });
      
      // Calculate stats for each teacher
      const instructorsWithStats = teachers.map((teacher: User) => {
        // Find all courses by this teacher
        const teacherCourses = allCourses.filter(
          (course: Course) =>
            course.teacherId === teacher.id ||
            course.teacher?.id === teacher.id
        );
        
        // Calculate total students
        const totalStudents = teacherCourses.reduce(
          (sum: number, course: Course) => sum + (course.enrolledStudents || 0),
          0
        );
        
        // Calculate average rating
        const ratings = teacherCourses
          .map((course: Course) => course.rating || 0)
          .filter((rating: number) => rating > 0);
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
          : 0;
        
        // Get most common category as specialty
        const categories = teacherCourses
          .map((course: Course) => course.category)
          .filter((cat: string | undefined) => cat);
        const categoryCounts: Record<string, number> = {};
        categories.forEach((cat: string) => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        const specialty = Object.keys(categoryCounts).length > 0
          ? Object.keys(categoryCounts).reduce((a, b) =>
              categoryCounts[a] > categoryCounts[b] ? a : b
            )
          : 'Instructor';
        
        return {
          id: teacher.id,
          name: teacher.name,
          specialty: specialty,
          students: totalStudents,
          rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
          avatar: teacher.avatar || null,
        };
      });
      
      // Sort by popularity (students + rating) and take top 3
      const sorted = instructorsWithStats
        .sort((a, b) => {
          const aScore = a.students * 0.7 + a.rating * 100 * 0.3;
          const bScore = b.students * 0.7 + b.rating * 100 * 0.3;
          return bScore - aScore;
        })
        .slice(0, 3);
      
      setFeaturedInstructors(sorted);
    } catch (error) {
      console.error('Error loading featured instructors:', error);
      setFeaturedInstructors([]);
    }
  };

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'web-dev', label: 'Web Development' },
    { id: 'design', label: 'Design' },
    { id: 'business', label: 'Business' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'photography', label: 'Photography' },
    { id: 'music', label: 'Music' },
  ];

  const levels = [
    { id: 'all', name: 'All Levels' },
    { id: 'BEGINNER', name: 'Beginner' },
    { id: 'INTERMEDIATE', name: 'Intermediate' },
    { id: 'ADVANCED', name: 'Advanced' },
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const trendingCourses = courses
    .sort((a, b) => (b.enrolledStudents || 0) - (a.enrolledStudents || 0))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="discover-loading">
        <div className="discover-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="discover-page">
      {/* Header Section */}
      <div className="courses-header">
        <div className="courses-header-content">
          <div className="courses-header-text">
            <h1 className="courses-header-title">
              Discover Courses
            </h1>
            <p className="courses-header-subtitle">
              Explore amazing courses and find your next learning adventure
            </p>
          </div>
        </div>
      </div>
      {/* Sticky Search Bar */}
      <div className="discover-search-bar">
        <div className="discover-search-content">
          <div className="discover-search-wrapper">
            <Search className="discover-search-icon" />
            <input
              type="text"
              placeholder="Search lessons, instructors, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="discover-search-input"
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="discover-filters-button"
          >
            <Filter className="discover-filters-button-icon" />
            Filters
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="mb-6 lg:mb-8">
        <MobileChips
          items={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Trending Lessons */}
      {searchQuery === '' && (
        <div className="discover-section">
          <div className="discover-section-header">
            <div className="discover-section-title-wrapper">
              <TrendingUp className="discover-section-icon" />
              <h2 className="discover-section-title">
                Trending Now
              </h2>
            </div>
          </div>
          
          {/* Mobile: Horizontal Scroll */}
          <div className="discover-trending-mobile">
            <div className="discover-trending-mobile-list">
              {trendingCourses.map((course) => (
                <div key={course.id} className="discover-trending-mobile-item">
                  <MobileCourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop: Grid */}
          <div className="discover-trending-desktop">
            {trendingCourses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="discover-course-card"
              >
                <div className="discover-course-image">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} />
                  ) : (
                    <BookOpen className="discover-course-image-icon" />
                  )}
                  <div className="discover-course-trending-badge">
                    <TrendingUp className="discover-course-trending-icon" />
                    <span className="discover-course-trending-text">Trending</span>
                  </div>
                </div>
                <div className="discover-course-content">
                  <span className="discover-course-category">
                    {course.category || 'Course'}
                  </span>
                  <h3 className="discover-course-title">
                    {course.title}
                  </h3>
                  <div className="discover-course-meta">
                    <div className="discover-course-meta-item">
                      <Star className="discover-course-meta-icon discover-course-meta-icon--star" />
                      <span className="font-semibold">{course.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                    <div className="discover-course-meta-item">
                      <Users className="discover-course-meta-icon" />
                      <span>{(course.enrolledStudents || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  {course.price === 0 || !course.isPaid ? (
                    <span className="discover-course-price discover-course-price--free">Free</span>
                  ) : (
                    <span className="discover-course-price discover-course-price--paid">${course.price}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Instructors */}
      {searchQuery === '' && featuredInstructors.length > 0 && (
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6" style={{ color: '#9A8CFF' }} />
              <h2 className="text-xl lg:text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                Featured Instructors
              </h2>
            </div>
          </div>
          
          {/* Mobile: Horizontal Scroll */}
          <div className="lg:hidden overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex space-x-4" style={{ width: 'max-content' }}>
              {featuredInstructors.map((instructor) => (
                <div
                  key={instructor.id}
                  className="w-64 p-5 rounded-2xl border-2 flex-shrink-0"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#E5E7EB'
                  }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ 
                        background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
                      }}
                    >
                      {instructor.avatar ? (
                        <img src={instructor.avatar} alt={instructor.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span>{instructor.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate" style={{ color: '#0B1E3F' }}>{instructor.name}</h3>
                      <p className="text-xs truncate" style={{ color: '#6F73D2' }}>{instructor.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-current" style={{ color: '#F59E0B' }} />
                      <span className="font-semibold" style={{ color: '#0B1E3F' }}>{instructor.rating.toFixed(1)}</span>
                    </div>
                    <span style={{ color: '#6F73D2' }}>{instructor.students.toLocaleString()} students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop: Grid */}
          <div className="hidden lg:grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9A8CFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                    style={{ 
                      background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
                    }}
                  >
                    {instructor.avatar ? (
                      <img src={instructor.avatar} alt={instructor.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <span>{instructor.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1" style={{ color: '#0B1E3F' }}>{instructor.name}</h3>
                    <p className="text-sm" style={{ color: '#6F73D2' }}>{instructor.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
                    <span className="font-semibold" style={{ color: '#0B1E3F' }}>{instructor.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm" style={{ color: '#6F73D2' }}>{instructor.students.toLocaleString()} students</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <h2 className="text-xl lg:text-2xl font-bold" style={{ color: '#0B1E3F' }}>
            {searchQuery ? `Search Results (${filteredCourses.length})` : 'All Courses'}
          </h2>
        </div>
        
        {filteredCourses.length > 0 ? (
          <>
            {/* Mobile: Vertical List */}
            <div className="lg:hidden space-y-4">
              {filteredCourses.map((course) => (
                <MobileCourseCard key={course.id} course={course} />
              ))}
            </div>
            
            {/* Desktop: Grid */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
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
                  <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                    {course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="h-16 w-16" style={{ color: '#00B5AD' }} />
                    )}
                    <div className="absolute top-3 left-3">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: '#00B5AD' }}
                      >
                        {course.category || 'Course'}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-2 line-clamp-2" style={{ color: '#0B1E3F' }}>
                      {course.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm mb-3" style={{ color: '#6F73D2' }}>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
                        <span className="font-semibold">{course.rating?.toFixed(1) || '4.5'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{(course.enrolledStudents || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration || '8 weeks'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {course.price === 0 || !course.isPaid ? (
                        <span className="text-lg font-bold" style={{ color: '#00B5AD' }}>Free</span>
                      ) : (
                        <span className="text-lg font-bold" style={{ color: '#0B1E3F' }}>${course.price}</span>
                      )}
                      <ArrowRight className="h-5 w-5" style={{ color: '#00B5AD' }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 rounded-2xl border-2" style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }}>
            <Search className="h-16 w-16 mx-auto mb-4" style={{ color: '#6F73D2', opacity: 0.5 }} />
            <p className="text-xl font-bold mb-2" style={{ color: '#0B1E3F' }}>No courses found</p>
            <p className="text-sm" style={{ color: '#6F73D2' }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Courses"
        maxHeight="80vh"
      >
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: '#0B1E3F' }}>
              Level
            </label>
            <div className="space-y-2">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`w-full px-4 py-3 rounded-xl font-semibold text-left transition-all duration-200 ${
                    selectedLevel === level.id ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: selectedLevel === level.id ? '#00B5AD' : 'rgba(0, 181, 173, 0.1)',
                    color: selectedLevel === level.id ? 'white' : '#0B1E3F'
                  }}
                >
                  {level.name}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: '#0B1E3F' }}>
              Price
            </label>
            <div className="space-y-2">
              {['All', 'Free', 'Paid'].map((price) => (
                <button
                  key={price}
                  className="w-full px-4 py-3 rounded-xl font-semibold text-left transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(0, 181, 173, 0.1)',
                    color: '#0B1E3F'
                  }}
                >
                  {price}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedLevel('all');
                setShowFilters(false);
              }}
              className="flex-1 px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-200"
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
    </div>
  );
};

