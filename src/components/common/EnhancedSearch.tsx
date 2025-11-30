import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, Clock, TrendingUp, BookOpen, Users, FileText, ArrowRight,
  GraduationCap, FileCheck, HelpCircle, Calendar, MessageSquare, FolderOpen
} from 'lucide-react';
import { Course } from '../../types';
import { 
  getCourses, 
  getMyCourses,
  getLessonsForCourse,
  getAssignmentsForCourse,
  getMyQuizzes,
  getMyCreatedQuizzes,
  getAnnouncements,
  getGlobalAnnouncements,
  getFiles,
  getCalendarEvents,
  getForumThreadsForCourse,
  getStudents,
  searchForumThreads,
  searchMessages
} from '../../services/api';
import { useAuthStore } from '../../store/auth';

interface SearchSuggestion {
  id: string;
  type: 'course' | 'lesson' | 'assignment' | 'quiz' | 'instructor' | 'student' | 'forum' | 'announcement' | 'file' | 'event' | 'message' | 'recent' | 'trending';
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  courseId?: string;
  metadata?: Record<string, any>;
}

interface EnhancedSearchProps {
  onClose?: () => void;
  placeholder?: string;
  className?: string;
}

const MAX_RECENT_SEARCHES = 5;
const MAX_SUGGESTIONS = 12;
const MAX_PER_TYPE = 3;

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  onClose,
  placeholder = 'Search everything...',
  className = ''
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';
  
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing recent searches:', e);
      }
    }

    // Mock trending searches (in real app, fetch from API)
    setTrendingSearches(['React', 'JavaScript', 'Python', 'Web Development', 'Data Science']);
  }, []);

  // Don't auto-focus - let user click to focus

  // Comprehensive search across all content types
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const queryLower = searchQuery.toLowerCase();
      const allSuggestions: SearchSuggestion[] = [];

      // 1. Search Courses
      try {
        const courses = isTeacher ? await getMyCourses() : await getCourses();
        const courseSuggestions = courses
          .filter((course: Course) =>
            course.title.toLowerCase().includes(queryLower) ||
            course.description?.toLowerCase().includes(queryLower) ||
            course.teacher?.name?.toLowerCase().includes(queryLower)
          )
          .slice(0, MAX_PER_TYPE)
          .map((course: Course) => ({
            id: course.id,
            type: 'course' as const,
            title: course.title,
            subtitle: course.teacher?.name || 'Instructor',
            icon: <BookOpen className="w-4 h-4" />,
            courseId: course.id
          }));
        allSuggestions.push(...courseSuggestions);
      } catch (e) {
        console.error('Error searching courses:', e);
      }

      // 2. Search Lessons (from all courses)
      try {
        const courses = isTeacher ? await getMyCourses() : await getCourses();
        const lessonPromises = courses.slice(0, 5).map((course: Course) =>
          getLessonsForCourse(Number(course.id)).catch(() => [])
        );
        const lessonsArrays = await Promise.all(lessonPromises);
        const allLessons = lessonsArrays.flat();
        const lessonSuggestions = allLessons
          .filter((lesson: any) =>
            lesson.title?.toLowerCase().includes(queryLower) ||
            lesson.content?.toLowerCase().includes(queryLower)
          )
          .slice(0, MAX_PER_TYPE)
          .map((lesson: any) => ({
            id: lesson.id?.toString() || '',
            type: 'lesson' as const,
            title: lesson.title || 'Untitled Lesson',
            subtitle: `Lesson in course`,
            icon: <GraduationCap className="w-4 h-4" />,
            courseId: lesson.courseId?.toString(),
            metadata: { lesson }
          }));
        allSuggestions.push(...lessonSuggestions);
      } catch (e) {
        console.error('Error searching lessons:', e);
      }

      // 3. Search Assignments
      try {
        const courses = isTeacher ? await getMyCourses() : await getCourses();
        const assignmentPromises = courses.slice(0, 5).map((course: Course) =>
          getAssignmentsForCourse(course.id).catch(() => [])
        );
        const assignmentsArrays = await Promise.all(assignmentPromises);
        const allAssignments = assignmentsArrays.flat();
        const assignmentSuggestions = allAssignments
          .filter((assignment: any) =>
            assignment.title?.toLowerCase().includes(queryLower) ||
            assignment.description?.toLowerCase().includes(queryLower)
          )
          .slice(0, MAX_PER_TYPE)
          .map((assignment: any) => ({
            id: assignment.id?.toString() || '',
            type: 'assignment' as const,
            title: assignment.title || 'Untitled Assignment',
            subtitle: `Assignment`,
            icon: <FileCheck className="w-4 h-4" />,
            courseId: assignment.courseId?.toString(),
            metadata: { assignment }
          }));
        allSuggestions.push(...assignmentSuggestions);
      } catch (e) {
        console.error('Error searching assignments:', e);
      }

      // 4. Search Quizzes
      try {
        const quizzes = isTeacher ? await getMyCreatedQuizzes() : await getMyQuizzes();
        const quizSuggestions = quizzes
          .filter((quiz: any) =>
            quiz.title?.toLowerCase().includes(queryLower) ||
            quiz.description?.toLowerCase().includes(queryLower)
          )
          .slice(0, MAX_PER_TYPE)
          .map((quiz: any) => ({
            id: quiz.id?.toString() || '',
            type: 'quiz' as const,
            title: quiz.title || 'Untitled Quiz',
            subtitle: `Quiz`,
            icon: <HelpCircle className="w-4 h-4" />,
            courseId: quiz.courseId?.toString(),
            metadata: { quiz }
          }));
        allSuggestions.push(...quizSuggestions);
      } catch (e) {
        console.error('Error searching quizzes:', e);
      }

      // 5. Search Instructors
      try {
        const courses = await getCourses();
        const instructorMap = new Map();
        courses.forEach((course: Course) => {
          if (course.teacher?.name?.toLowerCase().includes(queryLower)) {
            const key = course.teacher.id || course.teacher.name;
            if (!instructorMap.has(key)) {
              instructorMap.set(key, {
                id: `instructor-${course.teacher.id}`,
                type: 'instructor' as const,
                title: course.teacher.name || 'Unknown',
                subtitle: 'Instructor',
                icon: <Users className="w-4 h-4" />
              });
            }
          }
        });
        allSuggestions.push(...Array.from(instructorMap.values()).slice(0, MAX_PER_TYPE));
      } catch (e) {
        console.error('Error searching instructors:', e);
      }

      // 6. Search Students (teachers only)
      if (isTeacher) {
        try {
          const students = await getStudents();
          const studentSuggestions = students
            .filter((student: any) =>
              student.name?.toLowerCase().includes(queryLower) ||
              student.email?.toLowerCase().includes(queryLower)
            )
            .slice(0, MAX_PER_TYPE)
            .map((student: any) => ({
              id: student.id?.toString() || '',
              type: 'student' as const,
              title: student.name || student.email || 'Unknown',
              subtitle: 'Student',
              icon: <Users className="w-4 h-4" />,
              metadata: { student }
            }));
          allSuggestions.push(...studentSuggestions);
        } catch (e) {
          console.error('Error searching students:', e);
        }
      }

      // 7. Search Announcements
      try {
        const announcements = await getGlobalAnnouncements();
        const announcementSuggestions = announcements
          .filter((announcement: any) =>
            announcement.title?.toLowerCase().includes(queryLower) ||
            announcement.content?.toLowerCase().includes(queryLower)
          )
          .slice(0, MAX_PER_TYPE)
          .map((announcement: any) => ({
            id: announcement.id?.toString() || '',
            type: 'announcement' as const,
            title: announcement.title || 'Untitled Announcement',
            subtitle: 'Announcement',
            icon: <MessageSquare className="w-4 h-4" />,
            courseId: announcement.courseId?.toString(),
            metadata: { announcement }
          }));
        allSuggestions.push(...announcementSuggestions);
      } catch (e) {
        console.error('Error searching announcements:', e);
      }

      // 8. Search Files
      try {
        const files = await getFiles();
        const fileSuggestions = files
          .filter((file: any) =>
            file.name?.toLowerCase().includes(queryLower) ||
            file.filename?.toLowerCase().includes(queryLower)
          )
          .slice(0, MAX_PER_TYPE)
          .map((file: any) => ({
            id: file.id?.toString() || '',
            type: 'file' as const,
            title: file.name || file.filename || 'Untitled File',
            subtitle: file.type || 'File',
            icon: <FileText className="w-4 h-4" />,
            courseId: file.courseId?.toString(),
            metadata: { file }
          }));
        allSuggestions.push(...fileSuggestions);
      } catch (e) {
        console.error('Error searching files:', e);
      }

      // 9. Search Calendar Events
      try {
        const events = await getCalendarEvents();
        const eventSuggestions = events
          .filter((event: any) =>
            event.title?.toLowerCase().includes(queryLower) ||
            event.description?.toLowerCase().includes(queryLower)
          )
          .slice(0, MAX_PER_TYPE)
          .map((event: any) => ({
            id: event.id?.toString() || '',
            type: 'event' as const,
            title: event.title || 'Untitled Event',
            subtitle: event.start ? new Date(event.start).toLocaleDateString() : 'Event',
            icon: <Calendar className="w-4 h-4" />,
            metadata: { event }
          }));
        allSuggestions.push(...eventSuggestions);
      } catch (e) {
        console.error('Error searching events:', e);
      }

      // Limit total results
      setSuggestions(allSuggestions.slice(0, MAX_SUGGESTIONS));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isTeacher]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (query.trim()) {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      onClose?.();
    }
  };

  // Save to recent searches
  const saveRecentSearch = (searchTerm: string) => {
    const updated = [
      searchTerm,
      ...recentSearches.filter(s => s.toLowerCase() !== searchTerm.toLowerCase())
    ].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  // Handle search
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    saveRecentSearch(searchQuery);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setShowSuggestions(false);
    onClose?.();
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'course') {
      navigate(`/courses/${suggestion.id}`);
    } else if (suggestion.type === 'lesson') {
      if (suggestion.courseId) {
        navigate(`/courses/${suggestion.courseId}?lessonId=${suggestion.id}`);
      } else {
        navigate(`/courses/${suggestion.id}`);
      }
    } else if (suggestion.type === 'assignment') {
      if (suggestion.courseId) {
        navigate(`/courses/${suggestion.courseId}?assignmentId=${suggestion.id}`);
      } else {
        navigate(`/assignments/${suggestion.id}`);
      }
    } else if (suggestion.type === 'quiz') {
      if (suggestion.courseId) {
        navigate(`/courses/${suggestion.courseId}?quizId=${suggestion.id}`);
      } else {
        navigate(`/quizzes/${suggestion.id}`);
      }
    } else if (suggestion.type === 'instructor') {
      navigate(`/discover?instructor=${encodeURIComponent(suggestion.title)}`);
    } else if (suggestion.type === 'student') {
      if (isTeacher) {
        navigate(`/students/progress?studentId=${suggestion.id}`);
      }
    } else if (suggestion.type === 'announcement') {
      if (suggestion.courseId) {
        navigate(`/courses/${suggestion.courseId}/announcements`);
      }
    } else if (suggestion.type === 'file') {
      if (suggestion.courseId) {
        navigate(`/courses/${suggestion.courseId}?fileId=${suggestion.id}`);
      }
    } else if (suggestion.type === 'event') {
      navigate(`/calendar?eventId=${suggestion.id}`);
    } else if (suggestion.type === 'recent' || suggestion.type === 'trending') {
      setQuery(suggestion.title);
      handleSearch(suggestion.title);
    }
    setShowSuggestions(false);
    onClose?.();
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Get display suggestions (combine search results with recent/trending if no query)
  const getDisplaySuggestions = (): SearchSuggestion[] => {
    if (query.trim()) {
      return suggestions;
    }

    const display: SearchSuggestion[] = [];

    // Recent searches
    if (recentSearches.length > 0) {
      display.push(
        ...recentSearches.slice(0, 3).map(search => ({
          id: `recent-${search}`,
          type: 'recent' as const,
          title: search,
          icon: <Clock className="w-4 h-4" />
        }))
      );
    }

    // Trending searches
    if (trendingSearches.length > 0 && display.length < MAX_SUGGESTIONS) {
      display.push(
        ...trendingSearches
          .slice(0, MAX_SUGGESTIONS - display.length)
          .map(search => ({
            id: `trending-${search}`,
            type: 'trending' as const,
            title: search,
            icon: <TrendingUp className="w-4 h-4" />
          }))
      );
    }

    return display;
  };

  const displaySuggestions = getDisplaySuggestions();
  const hasResults = displaySuggestions.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            // Delay to allow clicking on suggestions
            setTimeout(() => {
              setIsFocused(false);
              setShowSuggestions(false);
            }, 200);
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-3 text-base border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && isFocused && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : hasResults ? (
            <div className="py-2">
              {displaySuggestions.map((suggestion, index) => {
                const typeLabels: Record<string, string> = {
                  course: 'Course',
                  lesson: 'Lesson',
                  assignment: 'Assignment',
                  quiz: 'Quiz',
                  instructor: 'Instructor',
                  student: 'Student',
                  forum: 'Forum',
                  announcement: 'Announcement',
                  file: 'File',
                  event: 'Event',
                  message: 'Message'
                };
                
                return (
                  <button
                    key={`${suggestion.type}-${suggestion.id}-${index}`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseDown={(e) => {
                      // Prevent blur from firing before click
                      e.preventDefault();
                      handleSelectSuggestion(suggestion);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`
                      w-full px-4 py-3 text-left flex items-center space-x-3
                      transition-all duration-150
                      ${
                        index === selectedIndex
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {suggestion.title}
                        </div>
                        {suggestion.type !== 'recent' && suggestion.type !== 'trending' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {typeLabels[suggestion.type] || suggestion.type}
                          </span>
                        )}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                    {suggestion.type === 'recent' && (
                      <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    )}
                    {suggestion.type === 'trending' && (
                      <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : query.trim() ? (
            <div className="p-6 text-center">
              <Search className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                No results found for "{query}"
              </p>
              <button
                onClick={() => handleSearch(query)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Search anyway
              </button>
            </div>
          ) : null}

          {/* Search Button */}
          {query.trim() && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              <button
                onClick={() => handleSearch(query)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors duration-200"
              >
                <span>Search for "{query}"</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

