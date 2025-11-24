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
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { getCourses } from '../services/api';
import { Course } from '../types';
import { MobileCourseCard } from '../components/mobile/MobileCourseCard';
import { BottomSheet } from '../components/mobile/BottomSheet';
import { MobileChips } from '../components/mobile/MobileUtils';

export const DiscoverPage: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [courses, setCourses] = useState<Course[]>([]);
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

  const featuredInstructors = [
    { id: '1', name: 'Sarah Johnson', specialty: 'Web Development', students: 12500, rating: 4.9, avatar: null },
    { id: '2', name: 'Michael Chen', specialty: 'Design', students: 8900, rating: 4.8, avatar: null },
    { id: '3', name: 'Emily Rodriguez', specialty: 'Business', students: 11200, rating: 4.9, avatar: null },
  ];

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F7FA' }}>
      {/* Sticky Search Bar */}
      <div 
        className="sticky top-0 z-30 mb-6 lg:mb-8 py-4 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(244, 247, 250, 0.95)' }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#6F73D2' }} />
            <input
              type="text"
              placeholder="Search lessons, instructors, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
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
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6" style={{ color: '#00B5AD' }} />
              <h2 className="text-xl lg:text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                Trending Now
              </h2>
            </div>
          </div>
          
          {/* Mobile: Horizontal Scroll */}
          <div className="lg:hidden overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex space-x-4" style={{ width: 'max-content' }}>
              {trendingCourses.map((course) => (
                <div key={course.id} className="w-80 flex-shrink-0">
                  <MobileCourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop: Grid */}
          <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingCourses.map((course) => (
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
                  <div className="absolute top-3 left-3 flex items-center space-x-1 px-2 py-1 rounded-full bg-white/90">
                    <TrendingUp className="h-3 w-3" style={{ color: '#00B5AD' }} />
                    <span className="text-xs font-bold" style={{ color: '#00B5AD' }}>Trending</span>
                  </div>
                </div>
                <div className="p-5">
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
                  <div className="flex items-center space-x-4 text-sm mb-3" style={{ color: '#6F73D2' }}>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
                      <span className="font-semibold">{course.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{(course.enrolledStudents || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  {course.price === 0 || !course.isPaid ? (
                    <span className="text-lg font-bold" style={{ color: '#00B5AD' }}>Free</span>
                  ) : (
                    <span className="text-lg font-bold" style={{ color: '#0B1E3F' }}>${course.price}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Instructors */}
      {searchQuery === '' && (
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
                      <span className="font-semibold" style={{ color: '#0B1E3F' }}>{instructor.rating}</span>
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
                    <span className="font-semibold" style={{ color: '#0B1E3F' }}>{instructor.rating}</span>
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

