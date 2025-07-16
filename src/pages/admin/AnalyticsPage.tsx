import React, { useState, useEffect } from 'react';
import { BackButton } from '../../components/common/BackButton';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  BarChart3,
  Target,
  Download,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Info,
  X,
  FileSpreadsheet,
  FileText as FileTextIcon,
  Lock,
  Eye
} from 'lucide-react';
import {
  getUserEngagement,
  getCoursePerformance,
  getPaymentStats,
  getTopEarningCourses,
  getTopEarningTutors,
  getPaymentTrends,
  getRevenueDistribution
} from '../../services/api';

interface TeacherAnalytics {
  totalCourses: number;
  totalStudents: number;
  totalAssignments: number;
  pendingAssignments: number;
  averageCompletionRate: number;
  averageStudentScore: number;
  activeStudents: number;
  totalLessons: number;
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
  averageRevenuePerCourse: number;
  averageRevenuePerStudent: number;
}

interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  enrollmentCount: number;
  completionRate: number;
  averageScore: number;
  totalLessons: number;
  activeStudents: number;
  pendingAssignments: number;
  lastActivity: string;
  revenue: number;
  price: number;
}

interface StudentAnalytics {
  studentId: string;
  studentName: string;
  coursesEnrolled: number;
  lessonsCompleted: number;
  averageScore: number;
  timeSpent: number;
  lastActivity: string;
  completionRate: number;
}

interface AssignmentAnalytics {
  assignmentId: string;
  assignmentTitle: string;
  courseTitle: string;
  totalSubmissions: number;
  gradedSubmissions: number;
  averageScore: number;
  dueDate: string;
  status: 'pending' | 'graded' | 'overdue';
}

interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
  averageRevenuePerCourse: number;
  averageRevenuePerStudent: number;
  revenueByCourse: Array<{
    courseId: string;
    courseTitle: string;
    revenue: number;
    enrollmentCount: number;
    price: number;
  }>;
  revenueTrend: Array<{
    month: string;
    revenue: number;
    growth: number;
  }>;
  topRevenueGenerators: Array<{
    courseId: string;
    courseTitle: string;
    revenue: number;
    growth: number;
  }>;
}

interface PerformanceMetrics {
  overallCompletionRate: number;
  averageStudentScore: number;
  averageTimeToComplete: number;
  studentSatisfaction: number;
  courseEffectiveness: Array<{
    courseId: string;
    courseTitle: string;
    effectiveness: number;
    completionRate: number;
    averageScore: number;
  }>;
  studentProgress: Array<{
    studentId: string;
    studentName: string;
    progress: number;
    coursesCompleted: number;
    averageScore: number;
  }>;
}

interface InsightItem {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  actionable: boolean;
  action?: string;
  data: any;
}

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  sections: string[];
  dateRange: string;
  includeCharts: boolean;
  includeRawData: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  loading: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, loading }) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    sections: ['overview', 'revenue', 'performance'],
    dateRange: '30d',
    includeCharts: true,
    includeRawData: false
  });

  const [permissions, setPermissions] = useState({
    fileSystem: false,
    clipboard: false,
    requested: false
  });

  const sections = [
    { id: 'overview', label: 'Overview', description: 'Key metrics and summary' },
    { id: 'revenue', label: 'Revenue Analytics', description: 'Financial performance data' },
    { id: 'performance', label: 'Performance Metrics', description: 'Student and course performance' },
    { id: 'courses', label: 'Course Analytics', description: 'Individual course data' },
    { id: 'students', label: 'Student Analytics', description: 'Student engagement and progress' },
    { id: 'assignments', label: 'Assignment Analytics', description: 'Assignment completion data' },
    { id: 'insights', label: 'AI Insights', description: 'Generated insights and recommendations' }
  ];

  const formats = [
    { id: 'pdf', label: 'PDF Report', icon: FileTextIcon, description: 'Professional formatted report' },
    { id: 'excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet, description: 'Interactive data analysis' },
    { id: 'csv', label: 'CSV Data', icon: FileText, description: 'Raw data for external tools' },
    { id: 'json', label: 'JSON Data', icon: FileText, description: 'Structured data for APIs' }
  ];

  const dateRanges = [
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' },
    { id: '1y', label: 'Last year' },
    { id: 'custom', label: 'Custom range' }
  ];

  const requestPermissions = async () => {
    setPermissions(prev => ({ ...prev, requested: true }));
    
    try {
      // Request file system permissions
      if ('showSaveFilePicker' in window) {
        try {
          await (window as any).showSaveFilePicker({
            suggestedName: 'analytics-report.pdf',
            types: [{
              description: 'PDF Document',
              accept: { 'application/pdf': ['.pdf'] }
            }]
          });
          setPermissions(prev => ({ ...prev, fileSystem: true }));
        } catch (error) {
          console.log('File system permission denied or cancelled');
        }
      }

      // Request clipboard permissions
      if ('clipboard' in navigator && 'write' in navigator.clipboard) {
        try {
          await navigator.clipboard.writeText('test');
          setPermissions(prev => ({ ...prev, clipboard: true }));
        } catch (error) {
          console.log('Clipboard permission denied');
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setOptions(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(id => id !== sectionId)
        : [...prev.sections, sectionId]
    }));
  };

  const handleExport = () => {
    if (!permissions.fileSystem && !permissions.clipboard) {
      requestPermissions();
      return;
    }
    onExport(options);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Analytics Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Export Format</h3>
            <div className="grid grid-cols-2 gap-3">
              {formats.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.id}
                    onClick={() => setOptions(prev => ({ ...prev, format: format.id as any }))}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      options.format === format.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">{format.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{format.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Date Range</h3>
            <select
              value={options.dateRange}
              onChange={(e) => setOptions(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {dateRanges.map((range) => (
                <option key={range.id} value={range.id}>{range.label}</option>
              ))}
            </select>
          </div>

          {/* Sections to Include */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Sections to Include</h3>
            <div className="space-y-2">
              {sections.map((section) => (
                <label key={section.id} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.sections.includes(section.id)}
                    onChange={() => handleSectionToggle(section.id)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{section.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{section.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Additional Options</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeCharts}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Include Charts & Graphs</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Add visual representations of data</div>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeRawData}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeRawData: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Include Raw Data</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Add detailed data tables</div>
                </div>
              </label>
            </div>
          </div>

          {/* Permissions Status */}
          {permissions.requested && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Permissions Status</h4>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      {permissions.fileSystem ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-sm text-blue-800 dark:text-blue-200">
                        File System: {permissions.fileSystem ? 'Granted' : 'Required'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {permissions.clipboard ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-sm text-blue-800 dark:text-blue-200">
                        Clipboard: {permissions.clipboard ? 'Granted' : 'Optional'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics[]>([]);
  const [assignmentAnalytics, setAssignmentAnalytics] = useState<AssignmentAnalytics[]>([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'needs-attention' | 'revenue' | 'performance' | 'insights' | 'courses' | 'students' | 'assignments'>('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    loadAnalytics();
  }, []);

  useEffect(() => {
    // Reload analytics when timeRange changes
    if (analytics) {
      loadAnalytics();
    }
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Fetch all analytics data from API
      const paymentStats = await getPaymentStats();
      const topCourses = await getTopEarningCourses();
      const topTutors = await getTopEarningTutors();
      const paymentTrends = await getPaymentTrends();
      const revenueDistribution = await getRevenueDistribution();
      setAnalytics(paymentStats);
      setCourseAnalytics(topCourses);
      setStudentAnalytics(topTutors);
      setAssignmentAnalytics([]); // If available, fetch from API
      setRevenueAnalytics(revenueDistribution);
      setPerformanceMetrics(paymentTrends);
      setInsights([]); // If available, fetch from API
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics(null);
      setCourseAnalytics([]);
      setStudentAnalytics([]);
      setAssignmentAnalytics([]);
      setRevenueAnalytics(null);
      setPerformanceMetrics(null);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 75) {
      return {
        text: 'text-green-600 dark:text-green-400',
        icon: 'text-green-500',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-700'
      };
    } else if (percentage >= 65) {
      return {
        text: 'text-orange-600 dark:text-orange-400',
        icon: 'text-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-700'
      };
    } else {
      return {
        text: 'text-red-600 dark:text-red-400',
        icon: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700'
      };
    }
  };

  const handleExportReport = async (options: ExportOptions) => {
    setExportLoading(true);
    
    try {
      // Simulate export processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate export data based on options
      const exportData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          dateRange: options.dateRange,
          sections: options.sections,
          format: options.format
        },
        analytics: options.sections.includes('overview') ? analytics : null,
        revenue: options.sections.includes('revenue') ? revenueAnalytics : null,
        performance: options.sections.includes('performance') ? performanceMetrics : null,
        courses: options.sections.includes('courses') ? courseAnalytics : null,
        students: options.sections.includes('students') ? studentAnalytics : null,
        assignments: options.sections.includes('assignments') ? assignmentAnalytics : null,
        insights: options.sections.includes('insights') ? insights : null
      };

      // Handle different export formats
      switch (options.format) {
        case 'pdf':
          await exportToPDF();
          break;
        case 'excel':
          await exportToExcel();
          break;
        case 'csv':
          await exportToCSV();
          break;
        case 'json':
          await exportToJSON(exportData);
          break;
      }

      // Show success message
      alert('Report exported successfully!');
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToPDF = async () => {
    // In a real implementation, this would use a PDF library like jsPDF or PDFKit
    const blob = new Blob(['PDF content would be generated here'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    // In a real implementation, this would use a library like SheetJS
    const blob = new Blob(['Excel content would be generated here'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = async () => {
    try {
      // This function is no longer used as per the new_code, but keeping it for now
      // as it might be called from the new_code or if it's part of a larger export flow.
      // The new_code uses getPaymentStats, getTopEarningCourses, getTopEarningTutors, getPaymentTrends, getRevenueDistribution
      // which are all async and return data directly.
      // If this function was intended to fetch data from an API, it would need to be updated.
      // For now, it's a placeholder.
      const csvContent = 'CSV content would be generated here'; // Placeholder
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export analytics report.');
    }
  };

  const exportToJSON = async (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <BackButton />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
                  Comprehensive insights into your teaching performance and student engagement
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button 
                onClick={() => setShowExportModal(true)}
                className="flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex overflow-x-auto scrollbar-hide">
            <div className="flex space-x-8 min-w-max">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'needs-attention', label: 'Needs Attention', icon: AlertCircle },
                { id: 'revenue', label: 'Revenue', icon: DollarSign },
                { id: 'performance', label: 'Performance', icon: Target },
                { id: 'insights', label: 'Insights', icon: TrendingUp },
                { id: 'courses', label: 'Courses', icon: BookOpen },
                { id: 'students', label: 'Students', icon: Users },
                { id: 'assignments', label: 'Assignments', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3 lg:ml-4 flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">Total Courses</p>
                    <p className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
                      {analytics.totalCourses}
                    </p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4 text-green-500" />
                      <span className="text-xs lg:text-sm text-green-600 dark:text-green-400">
                        +{analytics.monthlyGrowth}% this month
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 lg:h-8 lg:w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3 lg:ml-4 flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                    <p className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatNumber(analytics.totalStudents)}
                    </p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4 text-green-500" />
                      <span className="text-xs lg:text-sm text-green-600 dark:text-green-400">
                        {analytics.activeStudents} active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-3 lg:ml-4 flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">Pending Assignments</p>
                    <p className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
                      {analytics.pendingAssignments}
                    </p>
                    <div className="flex items-center mt-1">
                      <AlertCircle className="w-3 h-3 lg:w-4 lg:h-4 text-orange-500" />
                      <span className="text-xs lg:text-sm text-orange-600 dark:text-orange-400">
                        Need attention
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className={`h-6 w-6 lg:h-8 lg:w-8 ${getCompletionColor(analytics.averageCompletionRate).icon}`} />
                  </div>
                  <div className="ml-3 lg:ml-4 flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Completion</p>
                    <p className={`text-xl lg:text-2xl font-semibold ${getCompletionColor(analytics.averageCompletionRate).text}`}>
                      {formatPercentage(analytics.averageCompletionRate)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center">
                        <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4 text-green-500" />
                        <span className="text-xs lg:text-sm text-green-600 dark:text-green-400">
                          +5.2% vs last month
                        </span>
                      </div>
                      {analytics.averageCompletionRate < 75 && (
                        <button className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                          How to increase completion
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="ml-3 lg:ml-4 flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                    <p className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(analytics.monthlyRevenue)}
                    </p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4 text-green-500" />
                      <span className="text-xs lg:text-sm text-green-600 dark:text-green-400">
                        +{analytics.monthlyGrowth}% vs last month
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Performing Courses</h3>
                <div className="space-y-4">
                  {courseAnalytics.slice(0, 3).map((course) => (
                    <div key={course.courseId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {course.courseTitle}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {course.enrollmentCount} students
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatPercentage(course.completionRate)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {course.averageScore.toFixed(1)}% avg score
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">Total Revenue</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        All time earnings
                      </p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(analytics.totalRevenue)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">Avg Revenue per Course</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        Across all courses
                      </p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(analytics.averageRevenuePerCourse)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">Avg Revenue per Student</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        Per enrolled student
                      </p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(analytics.averageRevenuePerStudent)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Other tabs would go here - for now just show a placeholder */}
        {activeTab !== 'overview' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed analytics for {activeTab} will be displayed here.
            </p>
          </div>
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExportReport}
          loading={exportLoading}
        />
      </div>
    </div>
  );
}; 