import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  GraduationCap,
  FileCheck,
  HelpCircle,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import {
  getCourses,
  getMyCourses,
  getLessonsForCourse,
  getAssignmentsForCourse,
  getMyQuizzes,
  getMyCreatedQuizzes,
  getGlobalAnnouncements,
  getFiles,
  getCalendarEvents,
  getStudents
} from '../services/api';
import { Course } from '../types';

interface SearchResult {
  id: string;
  type: 'course' | 'lesson' | 'assignment' | 'quiz' | 'instructor' | 'student' | 'announcement' | 'file' | 'event';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  courseId?: string;
  metadata?: Record<string, any>;
}

export const SearchResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<{
    courses: SearchResult[];
    lessons: SearchResult[];
    assignments: SearchResult[];
    quizzes: SearchResult[];
    instructors: SearchResult[];
    students: SearchResult[];
    announcements: SearchResult[];
    files: SearchResult[];
    events: SearchResult[];
  }>({
    courses: [],
    lessons: [],
    assignments: [],
    quizzes: [],
    instructors: [],
    students: [],
    announcements: [],
    files: [],
    events: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || params.get('search') || '';
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [location.search]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults({
        courses: [],
        lessons: [],
        assignments: [],
        quizzes: [],
        instructors: [],
        students: [],
        announcements: [],
        files: [],
        events: []
      });
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    const queryLower = query.toLowerCase();
    const allResults = {
      courses: [] as SearchResult[],
      lessons: [] as SearchResult[],
      assignments: [] as SearchResult[],
      quizzes: [] as SearchResult[],
      instructors: [] as SearchResult[],
      students: [] as SearchResult[],
      announcements: [] as SearchResult[],
      files: [] as SearchResult[],
      events: [] as SearchResult[]
    };

    try {
      // Search Courses
      try {
        const courses = isTeacher ? await getMyCourses() : await getCourses();
        allResults.courses = courses
          .filter((course: Course) =>
            course.title.toLowerCase().includes(queryLower) ||
            course.description?.toLowerCase().includes(queryLower) ||
            course.teacher?.name?.toLowerCase().includes(queryLower)
          )
          .map((course: Course) => ({
            id: course.id,
            type: 'course' as const,
            title: course.title,
            subtitle: course.teacher?.name || 'Instructor',
            icon: <BookOpen className="w-5 h-5" />,
            courseId: course.id
          }));
      } catch (e) {
        console.error('Error searching courses:', e);
      }

      // Search Lessons
      try {
        const courses = isTeacher ? await getMyCourses() : await getCourses();
        const lessonPromises = courses.slice(0, 10).map((course: Course) =>
          getLessonsForCourse(Number(course.id)).catch(() => [])
        );
        const lessonsArrays = await Promise.all(lessonPromises);
        const allLessons = lessonsArrays.flat();
        allResults.lessons = allLessons
          .filter((lesson: any) =>
            lesson.title?.toLowerCase().includes(queryLower) ||
            lesson.content?.toLowerCase().includes(queryLower)
          )
          .map((lesson: any) => ({
            id: lesson.id?.toString() || '',
            type: 'lesson' as const,
            title: lesson.title || 'Untitled Lesson',
            subtitle: `Lesson`,
            icon: <GraduationCap className="w-5 h-5" />,
            courseId: lesson.courseId?.toString(),
            metadata: { lesson }
          }));
      } catch (e) {
        console.error('Error searching lessons:', e);
      }

      // Search Assignments
      try {
        const courses = isTeacher ? await getMyCourses() : await getCourses();
        const assignmentPromises = courses.slice(0, 10).map((course: Course) =>
          getAssignmentsForCourse(course.id).catch(() => [])
        );
        const assignmentsArrays = await Promise.all(assignmentPromises);
        const allAssignments = assignmentsArrays.flat();
        allResults.assignments = allAssignments
          .filter((assignment: any) =>
            assignment.title?.toLowerCase().includes(queryLower) ||
            assignment.description?.toLowerCase().includes(queryLower)
          )
          .map((assignment: any) => ({
            id: assignment.id?.toString() || '',
            type: 'assignment' as const,
            title: assignment.title || 'Untitled Assignment',
            subtitle: `Assignment`,
            icon: <FileCheck className="w-5 h-5" />,
            courseId: assignment.courseId?.toString(),
            metadata: { assignment }
          }));
      } catch (e) {
        console.error('Error searching assignments:', e);
      }

      // Search Quizzes
      try {
        const quizzes = isTeacher ? await getMyCreatedQuizzes() : await getMyQuizzes();
        allResults.quizzes = quizzes
          .filter((quiz: any) =>
            quiz.title?.toLowerCase().includes(queryLower) ||
            quiz.description?.toLowerCase().includes(queryLower)
          )
          .map((quiz: any) => ({
            id: quiz.id?.toString() || '',
            type: 'quiz' as const,
            title: quiz.title || 'Untitled Quiz',
            subtitle: `Quiz`,
            icon: <HelpCircle className="w-5 h-5" />,
            courseId: quiz.courseId?.toString(),
            metadata: { quiz }
          }));
      } catch (e) {
        console.error('Error searching quizzes:', e);
      }

      // Search Instructors
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
                icon: <Users className="w-5 h-5" />
              });
            }
          }
        });
        allResults.instructors = Array.from(instructorMap.values());
      } catch (e) {
        console.error('Error searching instructors:', e);
      }

      // Search Students (teachers only)
      if (isTeacher) {
        try {
          const students = await getStudents();
          allResults.students = students
            .filter((student: any) =>
              student.name?.toLowerCase().includes(queryLower) ||
              student.email?.toLowerCase().includes(queryLower)
            )
            .map((student: any) => ({
              id: student.id?.toString() || '',
              type: 'student' as const,
              title: student.name || student.email || 'Unknown',
              subtitle: 'Student',
              icon: <Users className="w-5 h-5" />,
              metadata: { student }
            }));
        } catch (e) {
          console.error('Error searching students:', e);
        }
      }

      // Search Announcements
      try {
        const announcements = await getGlobalAnnouncements();
        allResults.announcements = announcements
          .filter((announcement: any) =>
            announcement.title?.toLowerCase().includes(queryLower) ||
            announcement.content?.toLowerCase().includes(queryLower)
          )
          .map((announcement: any) => ({
            id: announcement.id?.toString() || '',
            type: 'announcement' as const,
            title: announcement.title || 'Untitled Announcement',
            subtitle: 'Announcement',
            icon: <MessageSquare className="w-5 h-5" />,
            courseId: announcement.courseId?.toString(),
            metadata: { announcement }
          }));
      } catch (e) {
        console.error('Error searching announcements:', e);
      }

      // Search Files
      try {
        const files = await getFiles();
        allResults.files = files
          .filter((file: any) =>
            file.name?.toLowerCase().includes(queryLower) ||
            file.filename?.toLowerCase().includes(queryLower)
          )
          .map((file: any) => ({
            id: file.id?.toString() || '',
            type: 'file' as const,
            title: file.name || file.filename || 'Untitled File',
            subtitle: file.type || 'File',
            icon: <FileText className="w-5 h-5" />,
            courseId: file.courseId?.toString(),
            metadata: { file }
          }));
      } catch (e) {
        console.error('Error searching files:', e);
      }

      // Search Calendar Events
      try {
        const events = await getCalendarEvents();
        allResults.events = events
          .filter((event: any) =>
            event.title?.toLowerCase().includes(queryLower) ||
            event.description?.toLowerCase().includes(queryLower)
          )
          .map((event: any) => ({
            id: event.id?.toString() || '',
            type: 'event' as const,
            title: event.title || 'Untitled Event',
            subtitle: event.start ? new Date(event.start).toLocaleDateString() : 'Event',
            icon: <Calendar className="w-5 h-5" />,
            metadata: { event }
          }));
      } catch (e) {
        console.error('Error searching events:', e);
      }

      setResults(allResults);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch(searchQuery);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'course') {
      navigate(`/courses/${result.id}`);
    } else if (result.type === 'lesson') {
      if (result.courseId) {
        navigate(`/courses/${result.courseId}?lessonId=${result.id}`);
      }
    } else if (result.type === 'assignment') {
      if (result.courseId) {
        navigate(`/courses/${result.courseId}?assignmentId=${result.id}`);
      }
    } else if (result.type === 'quiz') {
      if (result.courseId) {
        navigate(`/courses/${result.courseId}?quizId=${result.id}`);
      }
    } else if (result.type === 'instructor') {
      navigate(`/discover?instructor=${encodeURIComponent(result.title)}`);
    } else if (result.type === 'student') {
      if (isTeacher) {
        navigate(`/students/progress?studentId=${result.id}`);
      }
    } else if (result.type === 'announcement') {
      if (result.courseId) {
        navigate(`/courses/${result.courseId}/announcements`);
      }
    } else if (result.type === 'file') {
      if (result.courseId) {
        navigate(`/courses/${result.courseId}?fileId=${result.id}`);
      }
    } else if (result.type === 'event') {
      navigate(`/calendar?eventId=${result.id}`);
    }
  };

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  const ResultSection = ({ title, results: sectionResults, icon }: { title: string; results: SearchResult[]; icon: React.ReactNode }) => {
    if (sectionResults.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          {icon}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title} ({sectionResults.length})
          </h2>
        </div>
        <div className="space-y-2">
          {sectionResults.map((result, index) => (
            <button
              key={`${result.type}-${result.id}-${index}`}
              onClick={() => handleResultClick(result)}
              className="w-full p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {result.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium text-gray-900 dark:text-white truncate">
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {result.subtitle}
                    </div>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search everything..."
              className="w-full pl-12 pr-12 py-4 text-base border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  navigate('/search');
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            )}
          </div>
        </form>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Results */}
        {!isLoading && hasSearched && (
          <>
            {totalResults > 0 ? (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Search Results for "{searchQuery}"
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Found {totalResults} result{totalResults !== 1 ? 's' : ''}
                  </p>
                </div>

                <ResultSection
                  title="Courses"
                  results={results.courses}
                  icon={<BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                />
                <ResultSection
                  title="Lessons"
                  results={results.lessons}
                  icon={<GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />}
                />
                <ResultSection
                  title="Assignments"
                  results={results.assignments}
                  icon={<FileCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                />
                <ResultSection
                  title="Quizzes"
                  results={results.quizzes}
                  icon={<HelpCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
                />
                <ResultSection
                  title="Instructors"
                  results={results.instructors}
                  icon={<Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                />
                {isTeacher && (
                  <ResultSection
                    title="Students"
                    results={results.students}
                    icon={<Users className="w-6 h-6 text-pink-600 dark:text-pink-400" />}
                  />
                )}
                <ResultSection
                  title="Announcements"
                  results={results.announcements}
                  icon={<MessageSquare className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />}
                />
                <ResultSection
                  title="Files"
                  results={results.files}
                  icon={<FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
                />
                <ResultSection
                  title="Events"
                  results={results.events}
                  icon={<Calendar className="w-6 h-6 text-red-600 dark:text-red-400" />}
                />
              </>
            ) : (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No results found
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or browse our courses
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !hasSearched && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Start searching
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter a search term to find courses, lessons, assignments, and more
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

