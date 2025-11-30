import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Download,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Calendar,
  BarChart3
} from 'lucide-react';
import { getMyCourses, getAssignmentSubmissionSummaries } from '../../services/api';
import { Course, AssignmentSubmissionSummary } from '../../types';
import { useAuthStore } from '../../store/auth';
import { useNotification } from '../../hooks/useNotification';
import { exportToCSV, formatDateForExport } from '../../utils/exportUtils';
import { GradebookTable } from '../../components/gradebook/GradebookTable';
import { GradeStatistics } from '../../components/gradebook/GradeStatistics';

interface GradebookEntry {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  assignmentId: string;
  assignmentTitle: string;
  score: number | null;
  maxScore: number;
  percentage: number | null;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  submittedAt: string | null;
  gradedAt: string | null;
  feedback: string | null;
  dueDate: string;
  isLate: boolean;
}

export const GradebookPage: React.FC = () => {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [gradebookEntries, setGradebookEntries] = useState<GradebookEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<GradebookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [gradebookEntries, selectedCourse, selectedStudent, selectedStatus, searchQuery]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load courses
      const coursesData = await getMyCourses();
      setCourses(coursesData);
      
      // Load all assignment submissions
      const allEntries: GradebookEntry[] = [];
      
      for (const course of coursesData) {
        try {
          const response = await getAssignmentSubmissionSummaries({
            courseId: course.id,
            limit: 1000
          });
          
          for (const summary of response.data) {
            for (const submission of summary.submissions) {
              allEntries.push({
                studentId: submission.studentId,
                studentName: submission.studentName,
                studentEmail: submission.studentEmail,
                courseId: summary.courseId,
                courseTitle: summary.courseTitle,
                assignmentId: summary.assignmentId,
                assignmentTitle: summary.assignmentTitle,
                score: submission.score ?? null,
                maxScore: 100, // Default, could be fetched from assignment
                percentage: submission.score !== null && submission.score !== undefined
                  ? (submission.score / 100) * 100
                  : null,
                status: submission.status,
                submittedAt: submission.submittedAt || null,
                gradedAt: submission.status === 'graded' ? submission.submittedAt || null : null,
                feedback: submission.feedback || null,
                dueDate: summary.dueDate,
                isLate: submission.isLate
              });
            }
          }
        } catch (error) {
          console.error(`Error loading submissions for course ${course.id}:`, error);
        }
      }
      
      setGradebookEntries(allEntries);
    } catch (error) {
      console.error('Error loading gradebook data:', error);
      showError('Failed to Load Gradebook', 'Unable to load gradebook data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...gradebookEntries];
    
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(entry => entry.courseId === selectedCourse);
    }
    
    if (selectedStudent !== 'all') {
      filtered = filtered.filter(entry => entry.studentId === selectedStudent);
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(entry => entry.status === selectedStatus);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.studentName.toLowerCase().includes(query) ||
        entry.studentEmail.toLowerCase().includes(query) ||
        entry.assignmentTitle.toLowerCase().includes(query) ||
        entry.courseTitle.toLowerCase().includes(query)
      );
    }
    
    setFilteredEntries(filtered);
  };
  
  const handleExport = () => {
    try {
      const headers = [
        'Student Name',
        'Student Email',
        'Course',
        'Assignment',
        'Score',
        'Max Score',
        'Percentage',
        'Status',
        'Submitted At',
        'Graded At',
        'Due Date',
        'Is Late',
        'Feedback'
      ];
      
      const data = filteredEntries.map(entry => ({
        'Student Name': entry.studentName,
        'Student Email': entry.studentEmail,
        'Course': entry.courseTitle,
        'Assignment': entry.assignmentTitle,
        'Score': entry.score ?? '',
        'Max Score': entry.maxScore,
        'Percentage': entry.percentage ? `${entry.percentage.toFixed(2)}%` : '',
        'Status': entry.status,
        'Submitted At': entry.submittedAt ? formatDateForExport(entry.submittedAt) : '',
        'Graded At': entry.gradedAt ? formatDateForExport(entry.gradedAt) : '',
        'Due Date': formatDateForExport(entry.dueDate),
        'Is Late': entry.isLate ? 'Yes' : 'No',
        'Feedback': entry.feedback || ''
      }));
      
      const filename = `gradebook_${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(data, headers, filename, true);
      
      showSuccess('Export Successful', 'Gradebook data has been exported to CSV.');
    } catch (error) {
      console.error('Error exporting gradebook:', error);
      showError('Export Failed', 'Unable to export gradebook data. Please try again.');
    }
  };
  
  const uniqueStudents = Array.from(
    new Set(gradebookEntries.map(e => e.studentId))
  ).map(id => {
    const entry = gradebookEntries.find(e => e.studentId === id);
    return { id, name: entry?.studentName || 'Unknown' };
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Gradebook
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                View and manage all student grades across your courses
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-5 h-5 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
        
        {/* Statistics */}
        <GradeStatistics entries={gradebookEntries} />
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student, assignment, or course..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            {/* Course Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          
          {/* Student Filter (if needed) */}
          {uniqueStudents.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Students</option>
                {uniqueStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Gradebook Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <GradebookTable
            entries={filteredEntries}
            onGradeClick={(entry) => {
              navigate(`/assignments/${entry.assignmentId}/grade?studentId=${entry.studentId}`);
            }}
          />
        </div>
      </div>
    </div>
  );
};

