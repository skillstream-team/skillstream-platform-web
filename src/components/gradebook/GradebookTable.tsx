import React from 'react';
import {
  BookOpen,
  User,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { formatDateForExport } from '../../utils/exportUtils';
import { getInitials } from '../../lib/utils';

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

interface GradebookTableProps {
  entries: GradebookEntry[];
  onGradeClick: (entry: GradebookEntry) => void;
}

export const GradebookTable: React.FC<GradebookTableProps> = ({ entries, onGradeClick }) => {
  const getStatusIcon = (status: string, isLate: boolean) => {
    if (isLate) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    switch (status) {
      case 'graded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'submitted':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getStatusBadge = (status: string, isLate: boolean) => {
    if (isLate) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Late
        </span>
      );
    }
    switch (status) {
      case 'graded':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Graded
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Submitted
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Pending
          </span>
        );
    }
  };
  
  const getScoreColor = (percentage: number | null) => {
    if (percentage === null) return 'text-gray-500';
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 70) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No entries found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your filters to see more results.
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Student
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Course
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Assignment
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Submitted
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {entries.map((entry, index) => (
            <tr
              key={`${entry.studentId}-${entry.assignmentId}-${index}`}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                      {getInitials(entry.studentName)}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {entry.studentName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.studentEmail}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900 dark:text-white">
                  <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                  {entry.courseTitle}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900 dark:text-white">
                  <FileText className="w-4 h-4 mr-2 text-purple-500" />
                  <span className="max-w-xs truncate">{entry.assignmentTitle}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {entry.score !== null ? (
                  <div className="text-sm">
                    <span className={`font-semibold ${getScoreColor(entry.percentage)}`}>
                      {entry.score} / {entry.maxScore}
                    </span>
                    {entry.percentage !== null && (
                      <div className={`text-xs ${getScoreColor(entry.percentage)}`}>
                        ({entry.percentage.toFixed(1)}%)
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(entry.status, entry.isLate)}
                  {getStatusBadge(entry.status, entry.isLate)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {formatDateForExport(entry.dueDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {entry.submittedAt ? formatDateForExport(entry.submittedAt) : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {entry.status === 'submitted' || entry.status === 'overdue' ? (
                  <button
                    onClick={() => onGradeClick(entry)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-end ml-auto"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Grade
                  </button>
                ) : entry.status === 'graded' ? (
                  <button
                    onClick={() => onGradeClick(entry)}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 flex items-center justify-end ml-auto"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

