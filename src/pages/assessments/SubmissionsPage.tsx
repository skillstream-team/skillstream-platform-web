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
  ChartBarIcon} from '@heroicons/react/24/outline';

const SubmissionsPage: React.FC = () => {
  const [submissionSummaries, setSubmissionSummaries] = useState<AssignmentSubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded' | 'overdue'>('all');
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
      const summaries = await apiService.getAllSubmissionSummaries();
      setSubmissionSummaries(summaries);
    } catch (error) {
      console.error('Failed to load submission summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'submitted':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case 'pending':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'overdue':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'graded':
        return 'Graded';
      case 'submitted':
        return 'Submitted';
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const getAssignmentStatus = (assignment: AssignmentSubmissionSummary) => {
    if (assignment.overdueCount > 0) return 'overdue';
    if (assignment.submittedCount > 0) return 'submitted';
    return 'pending';
  };

  const filteredSummaries = submissionSummaries.filter(summary => {
    const courseMatch = selectedCourse === 'all' || summary.courseId === selectedCourse;
    const statusMatch = filter === 'all' || getAssignmentStatus(summary) === filter;
    return courseMatch && statusMatch;
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assignment Submissions</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track and manage student assignment submissions across all your courses
          </p>
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
                Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assignments</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {submissionSummaries.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {submissionSummaries.reduce((total, summary) => total + summary.totalStudents, 0)}
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Submitted</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {submissionSummaries.reduce((total, summary) => total + summary.submittedCount, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {submissionSummaries.reduce((total, summary) => total + summary.overdueCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredSummaries.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No assignments</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filter === 'all' ? 'You have no assignments yet.' : `No ${filter} assignments found.`}
              </p>
            </div>
          ) : (
            filteredSummaries.map((summary) => {
              const status = getAssignmentStatus(summary);
              const progressPercentage = getProgressPercentage(summary);

              return (
                <div
                  key={summary.assignmentId}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {summary.assignmentTitle}
                          </h3>
                          {getStatusIcon(status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {getStatusText(status)}
                          </span>
                        </div>
                        
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Course: {summary.courseTitle}
                        </p>
                        
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Due: {new Date(summary.dueDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <UsersIcon className="w-4 h-4 mr-1" />
                            {summary.totalStudents} students
                          </div>
                          <div className="flex items-center">
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            {summary.submittedCount}/{summary.totalStudents} submitted
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
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => setSelectedAssignment(summary)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                        <button
                          onClick={() => navigate(`/assignments/${summary.assignmentId}`)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Grade
                        </button>
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
                    Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedAssignment.submissions.map((submission) => (
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
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'graded' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          submission.status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          submission.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {getStatusText(submission.status)}
                        </span>
                        <button
                          onClick={() => openStudentModal(submission)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <EyeIcon className="w-4 h-4" />
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
                      navigate(`/assignments/${selectedAssignment.assignmentId}`);
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
                    Student Profile
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
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        selectedStudent.status === 'submitted' ? 'bg-green-500' :
                        selectedStudent.status === 'overdue' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {getStatusText(selectedStudent.status)}
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
                      {selectedStudent.submissionId ? (
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
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No submission yet
                        </p>
                      )}
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
                  {selectedStudent.submissionId && (
                    <button
                      onClick={() => {
                        closeStudentModal();
                        navigate(`/assignments/${selectedAssignment?.assignmentId}/grade/${selectedStudent.submissionId}`);
                      }}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Grade Submission
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionsPage; 