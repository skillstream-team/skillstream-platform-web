import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Video, 
  Clock, 
  Users, 
  Search, 
  Filter,
  Calendar,
  MapPin,
  Star,
  DollarSign,
  Plus,
  User,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';

interface Lesson {
  id: string;
  title: string;
  description: string;
  teacherName: string;
  teacherAvatar?: string;
  scheduledAt: string;
  duration: number;
  maxStudents: number;
  currentStudents: number;
  price?: number;
  isPaid: boolean;
  subject: string;
  level: string;
  type: 'live' | 'recorded';
  rating?: number;
  reviewCount?: number;
}

export const LessonsPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'TEACHER';
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    level: '',
    price: '',
    type: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, []);

  useEffect(() => {
    filterLessons();
  }, [lessons, searchQuery, filters]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const data = await apiService.getLessons();
      // setLessons(data);
      setLessons([]);
    } catch (error) {
      console.error('Error loading lessons:', error);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLessons = () => {
    let filtered = lessons;

    if (searchQuery) {
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.subject) {
      filtered = filtered.filter(lesson => lesson.subject === filters.subject);
    }

    if (filters.level) {
      filtered = filtered.filter(lesson => lesson.level === filters.level);
    }

    if (filters.price) {
      if (filters.price === 'free') {
        filtered = filtered.filter(lesson => !lesson.isPaid);
      } else if (filters.price === 'paid') {
        filtered = filtered.filter(lesson => lesson.isPaid);
      }
    }

    if (filters.type) {
      filtered = filtered.filter(lesson => lesson.type === filters.type);
    }

    setFilteredLessons(filtered);
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {isTeacher ? 'My Lessons' : 'Available Lessons'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isTeacher 
                  ? 'Manage your lessons and track bookings'
                  : 'Find and book lessons with expert teachers'
                }
              </p>
            </div>
            {isTeacher && (
              <button
                onClick={() => navigate('/lessons/create')}
                className="mt-4 md:mt-0 flex items-center px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Lesson
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={isTeacher ? "Search your lessons..." : "Search by subject, teacher, or topic..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, subject: prev.subject === 'Physics' ? '' : 'Physics' }))}
                className={`px-4 py-2 text-sm font-medium border transition-colors ${
                  filters.subject === 'Physics'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Physics
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, subject: prev.subject === 'Math' ? '' : 'Math' }))}
                className={`px-4 py-2 text-sm font-medium border transition-colors ${
                  filters.subject === 'Math'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Math
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, type: prev.type === 'live' ? '' : 'live' }))}
                className={`px-4 py-2 text-sm font-medium border transition-colors ${
                  filters.type === 'live'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Live
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, price: prev.price === 'free' ? '' : 'free' }))}
                className={`px-4 py-2 text-sm font-medium border transition-colors ${
                  filters.price === 'free'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Free
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredLessons.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery || Object.values(filters).some(f => f) 
                ? 'No lessons match your search'
                : isTeacher 
                  ? 'No lessons yet'
                  : 'No lessons available'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isTeacher 
                ? 'Create your first lesson to start teaching'
                : 'Check back later for new lessons'
              }
            </p>
            {isTeacher && (
              <button
                onClick={() => navigate('/lessons/create')}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                Create Lesson
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors overflow-hidden"
              >
                {/* Lesson Image/Header */}
                <div className="h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>

                  <div className="p-4">
                  {/* Subject Badge */}
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {lesson.subject}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[2.5rem]">
                    {lesson.title}
                  </h3>

                  {/* Teacher Info */}
                  <div className="flex items-center space-x-2 mb-3">
                    {lesson.teacherAvatar ? (
                      <img
                        src={lesson.teacherAvatar}
                        alt={lesson.teacherName}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                      {lesson.teacherName}
                    </span>
                    {lesson.rating && (
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {lesson.rating.toFixed(1)}
                        </span>
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                  </div>

                  {/* Lesson Details */}
                  <div className="space-y-1.5 mb-3 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(lesson.scheduledAt)} at {formatTime(lesson.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{lesson.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-3.5 w-3.5" />
                      <span>{lesson.currentStudents}/{lesson.maxStudents} spots</span>
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      {lesson.isPaid && lesson.price ? (
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ${lesson.price}
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          Free
                        </span>
                      )}
                    </div>
                    {isTeacher ? (
                      <Link
                        to={`/lessons/${lesson.id}`}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        Manage
                      </Link>
                    ) : (
                      <button
                        onClick={() => navigate(`/lessons/book?lessonId=${lesson.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        Book Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

