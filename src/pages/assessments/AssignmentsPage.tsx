import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Assignment } from '../../types';
import { apiService, getMyAssignments } from '../../services/api';
import { 
  CalendarIcon, 
  ClockIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      // Get all assignments for the current user across all enrolled courses
      const allAssignments = await getMyAssignments();
      setAssignments(allAssignments);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    const submission = assignment.submissions?.[0]; // Assuming one submission per student
    if (!submission) return 'pending';
    if (submission.gradedAt) return 'graded';
    return 'submitted';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'submitted':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case 'pending':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
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
      default:
        return 'Overdue';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const filteredAssignments = assignments.filter(assignment => {
    const status = getSubmissionStatus(assignment);
    const courseMatch = selectedCourse === 'all' || assignment.courseId === selectedCourse;
    const statusMatch = filter === 'all' || status === filter;
    return courseMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assignments</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage and track your course assignments
              </p>
            </div>
            <button
              onClick={() => navigate('/assignments/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Assignment
            </button>
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
                {/* Add course options here */}
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
              </select>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No assignments</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filter === 'all' ? 'You have no assignments yet.' : `No ${filter} assignments found.`}
              </p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => {
              const status = getSubmissionStatus(assignment);
              const overdue = isOverdue(assignment.dueDate);
              const submission = assignment.submissions?.[0];

              return (
                <div
                  key={assignment.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {assignment.title}
                          </h3>
                          {getStatusIcon(status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'graded' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            overdue ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {getStatusText(status)}
                          </span>
                        </div>
                        
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {assignment.description}
                        </p>
                        
                        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <DocumentTextIcon className="w-4 h-4 mr-1" />
                            {assignment.totalPoints} points
                          </div>
                          {submission && (
                            <div className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                            </div>
                          )}
                          {submission?.score !== undefined && (
                            <div className="flex items-center">
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Score: {submission.score}/{assignment.totalPoints}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => navigate(`/assignments/${assignment.id}`)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </button>
                        {status === 'pending' && (
                          <button
                            onClick={() => navigate(`/assignments/${assignment.id}/submit`)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Submit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage; 