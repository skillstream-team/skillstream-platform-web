import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { BackButton } from '../../components/common/BackButton';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  FileText,
  Calendar,
  Search,
  Filter,
  Download,
  Mail,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getStudents, getMyCourses, getProgress } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { Course, Progress } from '../../types';
import { StudentNotes } from '../../components/students/StudentNotes';

interface StudentProgress {
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatar?: string;
  courses: Array<{
    courseId: string;
    courseTitle: string;
    progress: Progress | null;
    enrolledDate: string;
    lastActivity: string;
    completedLessons: number;
    totalLessons: number;
    averageScore?: number;
    timeSpent: number; // in minutes
  }>;
  totalCourses: number;
  completedCourses: number;
  totalTimeSpent: number;
  averageScore: number;
  lastActivity: string;
}

export const StudentProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId: courseIdFromParams } = useParams<{ courseId?: string }>();
  const location = useLocation();
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // Get courseId from URL query params or route params
  const searchParams = new URLSearchParams(location.search);
  const courseIdFromQuery = searchParams.get('courseId');
  const courseId = courseIdFromQuery || courseIdFromParams || null;

  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(courseId);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'lastActivity'>('name');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [studentProgressData, setStudentProgressData] = useState<Map<string, StudentProgress>>(new Map());

  useEffect(() => {
    if (isTeacher) {
      loadData();
    }
  }, [selectedCourse, isTeacher]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, coursesData] = await Promise.all([
        getStudents(selectedCourse || undefined),
        getMyCourses()
      ]);
      setStudents(studentsData);
      setCourses(coursesData);

      // Load progress for each student
      const progressMap = new Map<string, StudentProgress>();
      for (const student of studentsData) {
        const studentCourses: StudentProgress['courses'] = [];
        let totalTimeSpent = 0;
        let totalScore = 0;
        let scoreCount = 0;
        let lastActivity = '';

        for (const course of coursesData) {
          try {
            // Note: This would need a backend API to get student-specific progress
            // For now, we'll use a placeholder approach
            const progress: Progress | null = null; // await getStudentProgress(course.id, student.id);
            
            if (progress) {
              studentCourses.push({
                courseId: course.id,
                courseTitle: course.title,
                progress,
                enrolledDate: new Date().toISOString(), // Placeholder
                lastActivity: progress.lastAccessed || new Date().toISOString(),
                completedLessons: progress.completedLessons?.length || 0,
                totalLessons: course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0,
                averageScore: progress.averageScore,
                timeSpent: progress.timeSpent || 0
              });
              totalTimeSpent += progress.timeSpent || 0;
              if (progress.averageScore) {
                totalScore += progress.averageScore;
                scoreCount++;
              }
              if (progress.lastAccessed && progress.lastAccessed > lastActivity) {
                lastActivity = progress.lastAccessed;
              }
            }
          } catch (error) {
            console.error(`Error loading progress for student ${student.id} in course ${course.id}:`, error);
          }
        }

        progressMap.set(student.id, {
          studentId: student.id,
          studentName: student.name || student.username || student.email,
          studentEmail: student.email,
          avatar: student.avatar,
          courses: studentCourses,
          totalCourses: studentCourses.length,
          completedCourses: studentCourses.filter(c => {
            const progressPercent = c.totalLessons > 0 
              ? (c.completedLessons / c.totalLessons) * 100 
              : 0;
            return progressPercent >= 100;
          }).length,
          totalTimeSpent,
          averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
          lastActivity: lastActivity || new Date().toISOString()
        });
      }

      setStudentProgressData(progressMap);
    } catch (error) {
      console.error('Error loading student progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentExpansion = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  const filteredAndSortedStudents = students
    .filter(student => {
      const name = (student.name || student.username || student.email || '').toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const progressA = studentProgressData.get(a.id);
      const progressB = studentProgressData.get(b.id);
      
      switch (sortBy) {
        case 'progress':
          const avgProgressA = progressA?.courses.reduce((acc, c) => {
            const p = c.totalLessons > 0 ? (c.completedLessons / c.totalLessons) * 100 : 0;
            return acc + p;
          }, 0) / (progressA?.courses.length || 1) || 0;
          const avgProgressB = progressB?.courses.reduce((acc, c) => {
            const p = c.totalLessons > 0 ? (c.completedLessons / c.totalLessons) * 100 : 0;
            return acc + p;
          }, 0) / (progressB?.courses.length || 1) || 0;
          return avgProgressB - avgProgressA;
        case 'lastActivity':
          return (progressB?.lastActivity || '').localeCompare(progressA?.lastActivity || '');
        default:
          const nameA = (a.name || a.username || a.email || '').toLowerCase();
          const nameB = (b.name || b.username || b.email || '').toLowerCase();
          return nameA.localeCompare(nameB);
      }
    });

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#10B981'; // green
    if (percentage >= 70) return '#3B82F6'; // blue
    if (percentage >= 50) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  if (!isTeacher) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#0B1E3F' }}>Access Denied</h2>
          <p className="text-gray-600">This page is only available for teachers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Hero Section */}
      <div className="courses-header">
        <div className="courses-header-content">
          <BackButton />
          <div className="courses-header-text">
            <h1 className="courses-header-title">Student Progress</h1>
            <p className="courses-header-subtitle">
              Track individual student performance and engagement across your courses
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl border-2 p-6 mb-6 card-hover" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Course Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                Filter by Course
              </label>
              <select
                value={selectedCourse || ''}
                onChange={(e) => setSelectedCourse(e.target.value || null)}
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus-ring transition-smooth"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#6F73D2' }} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus-ring transition-smooth"
                  style={{ borderColor: '#E5E7EB' }}
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus-ring transition-smooth"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="name">Name</option>
                <option value="progress">Progress</option>
                <option value="lastActivity">Last Activity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <SkeletonLoader key={i} type="card" height="200px" />
            ))}
          </div>
        ) : filteredAndSortedStudents.length === 0 ? (
          <EmptyState
            type="students"
            title="No students found"
            message={searchQuery ? "Try adjusting your search terms." : "No students are enrolled in your courses yet."}
          />
        ) : (
          <div className="space-y-4">
            {filteredAndSortedStudents.map((student, index) => {
              const progress = studentProgressData.get(student.id);
              const isExpanded = expandedStudents.has(student.id);
              const avgProgress = progress?.courses.reduce((acc, c) => {
                const p = c.totalLessons > 0 ? (c.completedLessons / c.totalLessons) * 100 : 0;
                return acc + p;
              }, 0) / (progress?.courses.length || 1) || 0;

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-2xl border-2 overflow-hidden card-hover stagger-item"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  {/* Student Header */}
                  <div
                    className="p-6 cursor-pointer transition-smooth"
                    onClick={() => toggleStudentExpansion(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                          {student.avatar ? (
                            <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span>{(student.name || student.username || student.email || 'U')[0].toUpperCase()}</span>
                          )}
                        </div>

                        {/* Student Info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1" style={{ color: '#0B1E3F' }}>
                            {student.name || student.username || student.email}
                          </h3>
                          <p className="text-sm" style={{ color: '#6F73D2' }}>{student.email}</p>
                        </div>

                        {/* Quick Stats */}
                        <div className="hidden md:flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                              {progress?.totalCourses || 0}
                            </div>
                            <div className="text-xs" style={{ color: '#6F73D2' }}>Courses</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                              {progress?.completedCourses || 0}
                            </div>
                            <div className="text-xs" style={{ color: '#6F73D2' }}>Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                              {Math.round(avgProgress)}%
                            </div>
                            <div className="text-xs" style={{ color: '#6F73D2' }}>Avg Progress</div>
                          </div>
                        </div>

                        {/* Expand Icon */}
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-smooth">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" style={{ color: '#6F73D2' }} />
                          ) : (
                            <ChevronDown className="h-5 w-5" style={{ color: '#6F73D2' }} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span style={{ color: '#6F73D2' }}>Overall Progress</span>
                        <span className="font-semibold" style={{ color: '#0B1E3F' }}>
                          {Math.round(avgProgress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${avgProgress}%`,
                            backgroundColor: getProgressColor(avgProgress)
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Course Details */}
                  {isExpanded && progress && (
                    <div className="border-t-2 px-6 py-4 animate-fade-in" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                      {progress.courses.length === 0 ? (
                        <EmptyState
                          type="courses"
                          title="No course progress"
                          message="This student hasn't started any courses yet."
                        />
                      ) : (
                        <div className="space-y-4">
                          {progress.courses.map(course => {
                            const courseProgress = course.totalLessons > 0
                              ? (course.completedLessons / course.totalLessons) * 100
                              : 0;

                            return (
                              <div
                                key={course.courseId}
                                className="bg-white rounded-xl border-2 p-4 card-hover"
                                style={{ borderColor: '#E5E7EB' }}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-bold mb-1" style={{ color: '#0B1E3F' }}>
                                      {course.courseTitle}
                                    </h4>
                                    <div className="flex items-center space-x-4 text-sm" style={{ color: '#6F73D2' }}>
                                      <span className="flex items-center">
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        {course.completedLessons}/{course.totalLessons} lessons
                                      </span>
                                      <span className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {formatTime(course.timeSpent)}
                                      </span>
                                      {course.averageScore && (
                                        <span className="flex items-center">
                                          <Award className="h-4 w-4 mr-1" />
                                          {course.averageScore.toFixed(1)}% avg
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => navigate(`/courses/${course.courseId}`)}
                                    className="px-4 py-2 rounded-lg font-semibold text-white transition-smooth hover-scale"
                                    style={{ backgroundColor: '#00B5AD' }}
                                  >
                                    View Details
                                  </button>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${courseProgress}%`,
                                      backgroundColor: getProgressColor(courseProgress)
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Student Notes Section */}
                      <div className="mt-6">
                        <StudentNotes
                          studentId={student.id}
                          studentName={student.name || student.username || student.email || 'Student'}
                        />
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

