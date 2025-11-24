import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Compass, 
  Calendar, 
  MessageCircle,
  ArrowRight,
  Clock,
  Star,
  Users,
  TrendingUp,
  Bell,
  Play,
  Bookmark,
  CheckCircle,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { getCourses, getMyCalendarEvents } from '../services/api';
import { Course } from '../types';
import { MobileCourseCard } from '../components/mobile/MobileCourseCard';
import { SwipeableTabs } from '../components/mobile/SwipeableTabs';

export const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'TEACHER';
  
  const [continueLearning, setContinueLearning] = useState<Course[]>([]);
  const [recommendedLessons, setRecommendedLessons] = useState<Course[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const courses = await getCourses({ limit: 20 });
      
      // Simulate continue learning (courses with progress)
      setContinueLearning(courses.slice(0, 3));
      
      // Simulate recommended lessons
      setRecommendedLessons(courses.slice(3, 9));
      
      // Load upcoming sessions
      try {
        const events = await getMyCalendarEvents({});
        setUpcomingSessions(events.slice(0, 3));
      } catch {
        setUpcomingSessions([]);
      }
      
      // Mock announcements
      setAnnouncements([
        { id: 1, title: 'New Course Available', message: 'Check out our latest course on Advanced React', type: 'info' },
        { id: 2, title: 'Weekly Challenge', message: 'Complete 5 lessons this week to earn a badge', type: 'challenge' }
      ]);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'web-dev', name: 'Web Development', icon: '💻', color: '#00B5AD' },
    { id: 'design', name: 'Design', icon: '🎨', color: '#6F73D2' },
    { id: 'business', name: 'Business', icon: '💼', color: '#9A8CFF' },
    { id: 'marketing', name: 'Marketing', icon: '📈', color: '#00B5AD' },
    { id: 'photography', name: 'Photography', icon: '📷', color: '#6F73D2' },
    { id: 'music', name: 'Music', icon: '🎵', color: '#9A8CFF' },
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
      {/* Hero Welcome Card */}
      <div 
        className="mb-6 lg:mb-8 rounded-2xl lg:rounded-[20px] p-6 lg:p-8 backdrop-blur-xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 181, 173, 0.1) 0%, rgba(111, 115, 210, 0.1) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(11, 30, 63, 0.1)'
        }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-4xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-base lg:text-lg mb-4" style={{ color: '#6F73D2' }}>
              {isTeacher 
                ? 'Ready to inspire your students today?' 
                : 'Continue your learning journey and discover new skills'}
            </p>
            
            {/* Quick Access Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <Link
                to="/learn"
                className="p-4 rounded-xl border-2 transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00B5AD';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 181, 173, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <BookOpen className="h-6 w-6 mb-2" style={{ color: '#00B5AD' }} />
                <p className="text-sm font-semibold" style={{ color: '#0B1E3F' }}>My Learning</p>
              </Link>
              
              <Link
                to="/discover"
                className="p-4 rounded-xl border-2 transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6F73D2';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(111, 115, 210, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Compass className="h-6 w-6 mb-2" style={{ color: '#6F73D2' }} />
                <p className="text-sm font-semibold" style={{ color: '#0B1E3F' }}>Discover</p>
              </Link>
              
              <Link
                to="/schedule"
                className="p-4 rounded-xl border-2 transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9A8CFF';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(154, 140, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Calendar className="h-6 w-6 mb-2" style={{ color: '#9A8CFF' }} />
                <p className="text-sm font-semibold" style={{ color: '#0B1E3F' }}>Schedule</p>
              </Link>
              
              <Link
                to="/messages"
                className="p-4 rounded-xl border-2 transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00B5AD';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 181, 173, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <MessageCircle className="h-6 w-6 mb-2" style={{ color: '#00B5AD' }} />
                <p className="text-sm font-semibold" style={{ color: '#0B1E3F' }}>Messages</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Learning Section */}
      {continueLearning.length > 0 && (
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-bold" style={{ color: '#0B1E3F' }}>
              Continue Learning
            </h2>
            <Link
              to="/learn"
              className="flex items-center space-x-1 text-sm font-semibold transition-colors"
              style={{ color: '#00B5AD' }}
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {/* Mobile: Horizontal Scroll */}
          <div className="lg:hidden overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex space-x-4" style={{ width: 'max-content' }}>
              {continueLearning.map((course) => (
                <div key={course.id} className="w-80 flex-shrink-0">
                  <MobileCourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop: Grid */}
          <div className="hidden lg:grid grid-cols-1 md:grid-cols-3 gap-6">
            {continueLearning.map((course) => (
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between text-white mb-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/20">
                        {course.category}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-current" style={{ color: '#F59E0B' }} />
                        <span className="text-xs font-semibold">{course.rating?.toFixed(1) || '4.5'}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white line-clamp-2">{course.title}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 text-sm" style={{ color: '#6F73D2' }}>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration || '8 weeks'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{course.enrolledStudents || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: '65%',
                        backgroundColor: '#00B5AD'
                      }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: '#6F73D2' }}>65% Complete</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Lessons */}
      {recommendedLessons.length > 0 && (
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-bold" style={{ color: '#0B1E3F' }}>
              Recommended for You
            </h2>
            <Link
              to="/discover"
              className="flex items-center space-x-1 text-sm font-semibold transition-colors"
              style={{ color: '#00B5AD' }}
            >
              <span>Explore More</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {/* Mobile: Vertical List */}
          <div className="lg:hidden space-y-4">
            {recommendedLessons.slice(0, 3).map((course) => (
              <MobileCourseCard key={course.id} course={course} />
            ))}
          </div>
          
          {/* Desktop: Grid */}
          <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedLessons.map((course) => (
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
                <div className="h-40 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="h-12 w-12" style={{ color: '#00B5AD' }} />
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
                      <span>{course.enrolledStudents || 0}</span>
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

      {/* Categories */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6" style={{ color: '#0B1E3F' }}>
          Browse Categories
        </h2>
        
        {/* Mobile: Horizontal Scroll */}
        <div className="lg:hidden overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex space-x-3" style={{ width: 'max-content' }}>
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/discover?category=${category.id}`}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 flex-shrink-0"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB',
                  width: '120px'
                }}
              >
                <span className="text-3xl mb-2">{category.icon}</span>
                <span className="text-xs font-semibold text-center" style={{ color: '#0B1E3F' }}>
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Desktop: Grid */}
        <div className="hidden lg:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/discover?category=${category.id}`}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              style={{
                backgroundColor: 'white',
                borderColor: '#E5E7EB'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = category.color;
                e.currentTarget.style.boxShadow = `0 8px 24px ${category.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span className="text-4xl mb-3">{category.icon}</span>
              <span className="text-sm font-semibold text-center" style={{ color: '#0B1E3F' }}>
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-bold" style={{ color: '#0B1E3F' }}>
              Upcoming Sessions
            </h2>
            <Link
              to="/schedule"
              className="flex items-center space-x-1 text-sm font-semibold transition-colors"
              style={{ color: '#00B5AD' }}
            >
              <span>View Calendar</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 lg:p-6 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98]"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2" style={{ color: '#0B1E3F' }}>
                      {session.title || 'Live Session'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: '#6F73D2' }}>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(session.startTime || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(session.startTime || Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 rounded-xl font-semibold text-white transition-all duration-300 active:scale-95"
                    style={{ 
                      backgroundColor: '#00B5AD',
                      boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                    }}
                  >
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
        <div className="mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6" style={{ color: '#0B1E3F' }}>
            Announcements
          </h2>
          
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 lg:p-6 rounded-2xl border-2 transition-all duration-200"
                style={{
                  backgroundColor: 'white',
                  borderColor: announcement.type === 'challenge' ? '#9A8CFF' : '#E5E7EB',
                  borderLeftWidth: '4px',
                  borderLeftColor: announcement.type === 'challenge' ? '#9A8CFF' : '#00B5AD'
                }}
              >
                <div className="flex items-start space-x-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: announcement.type === 'challenge' ? 'rgba(154, 140, 255, 0.1)' : 'rgba(0, 181, 173, 0.1)' }}
                  >
                    {announcement.type === 'challenge' ? (
                      <Zap className="h-5 w-5" style={{ color: '#9A8CFF' }} />
                    ) : (
                      <Bell className="h-5 w-5" style={{ color: '#00B5AD' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1" style={{ color: '#0B1E3F' }}>
                      {announcement.title}
                    </h3>
                    <p className="text-sm" style={{ color: '#6F73D2' }}>
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

