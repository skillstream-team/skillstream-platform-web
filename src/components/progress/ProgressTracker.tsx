import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Target,
  Download,
  Share2,
  Star,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { apiService } from '../../services/api';
import { Progress, Course, Certificate } from '../../types';

interface ProgressTrackerProps {
  courseId?: string;
  showCertificates?: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  courseId,
  showCertificates = true
}) => {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(courseId || null);

  useEffect(() => {
    loadData();
  }, [selectedCourse]);

  const loadData = async () => {
    try {
      if (selectedCourse) {
        const courseProgress = await apiService.getProgress(selectedCourse);
        setProgress(courseProgress);
      }
      
      const userCourses = await apiService.getMyCourses();
      setCourses(userCourses);
      
      if (showCertificates) {
        // Mock certificates data - replace with actual API call
        setCertificates([
          {
            id: '1',
            userId: user?.id || '',
            courseId: '1',
            courseName: 'React Fundamentals',
            issuedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            certificateUrl: '/certificates/react-fundamentals.pdf',
            grade: 'A+',
            completionPercentage: 95
          },
          {
            id: '2',
            userId: user?.id || '',
            courseId: '2',
            courseName: 'JavaScript Advanced',
            issuedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            certificateUrl: '/certificates/javascript-advanced.pdf',
            grade: 'A',
            completionPercentage: 88
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
      // Mock data for demo
      setProgress({
        courseId: selectedCourse || '1',
        userId: user?.id || '',
        completedLessons: 8,
        totalLessons: 12,
        completedQuizzes: 3,
        totalQuizzes: 5,
        completedAssignments: 2,
        totalAssignments: 3,
        overallProgress: 75,
        timeSpent: 1440, // minutes
        lastActivity: new Date().toISOString(),
        achievements: ['First Lesson', 'Quiz Master', 'Assignment Complete'],
        streak: 5
      });
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 70) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const downloadCertificate = (certificate: Certificate) => {
    // Mock download functionality
    console.log('Downloading certificate:', certificate.courseName);
    // In real implementation, this would trigger a download
  };

  const shareCertificate = (certificate: Certificate) => {
    // Mock share functionality
    if (navigator.share) {
      navigator.share({
        title: `${certificate.courseName} Certificate`,
        text: `I completed ${certificate.courseName} with ${certificate.completionPercentage}%!`,
        url: certificate.certificateUrl
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(certificate.certificateUrl);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Selection */}
      {!courseId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Course</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCourse === course.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <h4 className="font-medium text-gray-900 dark:text-white">{course.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{course.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Overview */}
      {progress && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progress Overview</h3>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {progress.achievements.length} achievements
              </span>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
              <span className={`text-sm font-semibold ${getProgressColor(progress.overallProgress)}`}>
                {progress.overallProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(progress.overallProgress)}`}
                style={{ width: `${progress.overallProgress}%` }}
              />
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mx-auto mb-2">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {progress.completedLessons}/{progress.totalLessons}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Lessons</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {progress.completedQuizzes}/{progress.totalQuizzes}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Quizzes</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mx-auto mb-2">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {progress.completedAssignments}/{progress.totalAssignments}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Assignments</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg mx-auto mb-2">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTime(progress.timeSpent)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Time Spent</div>
            </div>
          </div>

          {/* Achievements */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Recent Achievements</h4>
            <div className="flex flex-wrap gap-2">
              {progress.achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm"
                >
                  <Award className="h-4 w-4 mr-1" />
                  {achievement}
                </div>
              ))}
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Learning Streak
              </span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {progress.streak} days
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Keep it up!</div>
            </div>
          </div>
        </div>
      )}

      {/* Certificates */}
      {showCertificates && certificates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Certificates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map(certificate => (
              <div
                key={certificate.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{certificate.courseName}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Completed {new Date(certificate.issuedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {certificate.grade}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Completion</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {certificate.completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${certificate.completionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadCertificate(certificate)}
                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => shareCertificate(certificate)}
                    className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 