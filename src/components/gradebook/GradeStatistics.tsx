import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3
} from 'lucide-react';

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

interface GradeStatisticsProps {
  entries: GradebookEntry[];
}

export const GradeStatistics: React.FC<GradeStatisticsProps> = ({ entries }) => {
  const totalEntries = entries.length;
  const gradedEntries = entries.filter(e => e.status === 'graded');
  const submittedEntries = entries.filter(e => e.status === 'submitted');
  const pendingEntries = entries.filter(e => e.status === 'pending');
  const overdueEntries = entries.filter(e => e.status === 'overdue' || e.isLate);
  
  const scores = gradedEntries
    .filter(e => e.score !== null)
    .map(e => e.score!);
  
  const averageScore = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
  
  const medianScore = scores.length > 0
    ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)]
    : 0;
  
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
  
  const uniqueStudents = new Set(entries.map(e => e.studentId)).size;
  const uniqueCourses = new Set(entries.map(e => e.courseId)).size;
  const uniqueAssignments = new Set(entries.map(e => e.assignmentId)).size;
  
  const completionRate = totalEntries > 0
    ? (gradedEntries.length / totalEntries) * 100
    : 0;
  
  const stats = [
    {
      label: 'Total Entries',
      value: totalEntries,
      icon: BarChart3,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Graded',
      value: gradedEntries.length,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Submitted',
      value: submittedEntries.length,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Pending',
      value: pendingEntries.length,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      label: 'Overdue',
      value: overdueEntries.length,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      label: 'Average Score',
      value: averageScore.toFixed(1),
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      label: 'Completion Rate',
      value: `${completionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      label: 'Unique Students',
      value: uniqueStudents,
      icon: Users,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20'
    }
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`${stat.bgColor} rounded-lg p-4 hover-lift transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className={`mt-2 text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <Icon className={`w-8 h-8 ${stat.color} opacity-50`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

