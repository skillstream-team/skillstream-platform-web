import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssignmentSubmissionSummary, StudentSubmission } from '../../types';
import { apiService } from '../../services/api';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const GradeAssignmentsPage: React.FC = () => {
  const [submissionSummaries, setSubmissionSummaries] = useState<AssignmentSubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [filter, setFilter] = useState<'all' | 'submitted' | 'overdue' | 'urgent'>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentSubmissionSummary | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSubmission | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubmissionSummaries();
  }, []);

  const loadSubmissionSummaries = async () => {
    try {
      setLoading(true);
      // For now, using mock data - replace with actual API call
      const summaries = await apiService.getAllSubmissionSummaries();
      setSubmissionSummaries(summaries);
    } catch (error) {
      console.error('Failed to load submission summaries:', error);
      // Fallback to mock data
      setSubmissionSummaries([
        {
          assignmentId: 'assign-1',
          assignmentTitle: 'React Fundamentals - Final Project',
          courseId: 'course-1',
          courseTitle: 'Web Development',
          totalStudents: 15,
          submittedCount: 3,
          pendingCount: 10,
          gradedCount: 0,
          overdueCount: 2,
          averageScore: 0,
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'overdue',
          submissions: [
            {
              studentId: 'student-1',
              studentName: 'John Doe',
              studentEmail: 'john.doe@example.com',
              studentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
              submissionId: 'sub-1',
              status: 'submitted',
              submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              score: undefined,
              feedback: undefined,
              isLate: true,
              attachments: ['project.zip', 'README.md'],
              lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              studentId: 'student-2',
              studentName: 'Jane Smith',
              studentEmail: 'jane.smith@example.com',
              studentAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
              submissionId: 'sub-2',
              status: 'submitted',
              submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
              score: undefined,
              feedback: undefined,
              isLate: false,
              attachments: ['react-app.zip', 'documentation.pdf'],
              lastActivity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          assignmentId: 'assign-3',
          assignmentTitle: 'CSS Layout Assignment',
          courseId: 'course-3',
          courseTitle: 'Frontend Design',
          totalStudents: 10,
          submittedCount: 7,
          pendingCount: 3,
          gradedCount: 0,
          overdueCount: 0,
          averageScore: 0,
          dueDate: new Date().toISOString(),
          status: 'due-today',
          submissions: [
            {
              studentId: 'student-1',
              studentName: 'John Doe',
              studentEmail: 'john.doe@example.com',
              studentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
              submissionId: 'sub-3',
              status: 'submitted',
              submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              score: undefined,
              feedback: undefined,
              isLate: false,
              attachments: ['layout.html', 'styles.css'],
              lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLevel = (summary: AssignmentSubmissionSummary) => {
    if (summary.overdueCount > 0) return 'urgent';
    if (summary.submittedCount > 0) return 'submitted';
    return 'pending';
  };

  const filteredSummaries = submissionSummaries.filter(summary => {
    const courseMatch = selectedCourse === 'all' || summary.courseId === selectedCourse;
    const priority = getPriorityLevel(summary);
    const statusMatch = filter === 'all' || priority === filter;
    return courseMatch && statusMatch && summary.submittedCount > 0; // Only show assignments with submissions
  });

  const openStudentModal = (student: StudentSubmission) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
  };

  const getProgressPercentage = (summary: AssignmentSubmissionSummary) => {
    return Math.round((summary.submittedCount / summary.totalStudents) * 100);
  };

  const getDueDateText = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
      return `${Math.abs(diffInDays)} day${Math.abs(diffInDays) === 1 ? '' : 's'} ago`;
    } else if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'tomorrow';
    } else {
      return `in ${diffInDays} days`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grade Assignments</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review and grade student assignment submissions
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assignments to Grade</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {submissionSummaries.filter(s => s.submittedCount > 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Reviews</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {submissionSummaries.reduce((total, summary) => total + summary.submittedCount, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {submissionSummaries.reduce((total, summary) => total + summary.overdueCount, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {submissionSummaries.reduce((total, summary) => total + summary.gradedCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Courses</option>
                <option value="course-1">Web Development</option>
                <option value="course-2">Programming Basics</option>
                <option value="course-3">Frontend Design</option>
                <option value="course-4">Database Systems</option>
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent (Overdue)</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredSummaries.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">All caught up!</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No assignments need grading at the moment.
              </p>
            </div>
          ) : (
            filteredSummaries.map((summary) => {
              const priority = getPriorityLevel(summary);
              const progressPercentage = getProgressPercentage(summary);
              const ungradedSubmissions = summary.submissions.filter(s => s.status === 'submitted');

              return (
                <div
                  key={summary.assignmentId}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-shadow ${
                    priority === 'urgent' ? 'border-red-200 dark:border-red-700' :
                    priority === 'submitted' ? 'border-blue-200 dark:border-blue-700' :
                    'border-gray-200 dark:border-gray-700'
                  } hover:shadow-md`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {summary.assignmentTitle}
                          </h3>
                          {priority === 'urgent' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                              Urgent
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {ungradedSubmissions.length} to grade
                          </span>
                        </div>
                        
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Course: {summary.courseTitle}
                        </p>
                        
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Due: {getDueDateText(summary.dueDate)}
                          </div>
                          <div className="flex items-center">
                            <UsersIcon className="w-4 h-4 mr-1" />
                            {summary.totalStudents} students
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {summary.submittedCount} submitted
                          </div>
                          <div className="flex items-center">
                            <ChartBarIcon className="w-4 h-4 mr-1" />
                            {progressPercentage}% complete
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Submission Progress</span>
                            <span>{summary.submittedCount}/{summary.totalStudents}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Quick Grade Actions */}
                        {ungradedSubmissions.length > 0 && (
                          <div className="mt-4 flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedAssignment(summary)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              View Submissions ({ungradedSubmissions.length})
                            </button>
                            <button
                              onClick={() => navigate(`/assignments/${summary.assignmentId}/grade`)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <PencilIcon className="w-4 h-4 mr-1" />
                              Grade All
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Assignment Details Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedAssignment.assignmentTitle}
                  </h3>
                  <button
                    onClick={() => setSelectedAssignment(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Course: {selectedAssignment.courseTitle}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Due: {getDueDateText(selectedAssignment.dueDate)}
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedAssignment.submissions
                    .filter(submission => submission.status === 'submitted')
                    .map((submission) => (
                    <div
                      key={submission.studentId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={submission.studentAvatar || 'https://via.placeholder.com/40'}
                          alt={submission.studentName}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {submission.studentName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {submission.studentEmail}
                          </p>
                          {submission.isLate && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              ⚠️ Submitted late
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openStudentModal(submission)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssignment(null);
                            navigate(`/assignments/${selectedAssignment.assignmentId}/grade/${submission.submissionId}`);
                          }}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Grade
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedAssignment(null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAssignment(null);
                      navigate(`/assignments/${selectedAssignment.assignmentId}/grade`);
                    }}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Grade All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Profile Modal */}
        {showStudentModal && selectedStudent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Student Submission
                  </h3>
                  <button
                    onClick={closeStudentModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-4 mb-6">
                  <img
                    src={selectedStudent.studentAvatar || 'https://via.placeholder.com/80'}
                    alt={selectedStudent.studentName}
                    className="w-20 h-20 rounded-full"
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedStudent.studentName}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedStudent.studentEmail}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Submitted for grading
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Submission Details
                    </h5>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Submitted:</span> {new Date(selectedStudent.submittedAt!).toLocaleString()}
                        </p>
                        {selectedStudent.isLate && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            ⚠️ Submitted late
                          </p>
                        )}
                        {selectedStudent.attachments.length > 0 && (
                          <div>
                            <p className="text-sm font-medium">Attachments:</p>
                            <ul className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedStudent.attachments.map((attachment, index) => (
                                <li key={index}>• {attachment}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Activity
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(selectedStudent.lastActivity).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    onClick={closeStudentModal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      closeStudentModal();
                      navigate(`/assignments/${selectedAssignment?.assignmentId}/grade/${selectedStudent.submissionId}`);
                    }}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Grade This Submission
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeAssignmentsPage; 