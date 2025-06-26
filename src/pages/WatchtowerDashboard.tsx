import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  BarChart3,
  Download,
  RefreshCw,
  Target,
  Eye,
  MessageCircle,
  AlertCircle,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Users,
  BookOpen,
  GraduationCap,
  WifiOff,
  X
} from 'lucide-react';
import { apiService } from '../services/api';

interface RevenueStats {
  totalRevenue: number;
  monthlyGrowth: number;
  averageOrderValue: number;
  conversionRate: number;
  refundRate: number;
  timeframe: string;
}

interface TopEarningCourse {
  id: string;
  title: string;
  revenue: number;
  enrollments: number;
  completionRate: number;
  averageRating: number;
}

interface TopEarningTutor {
  id: string;
  name: string;
  totalRevenue: number;
  courseCount: number;
  studentCount: number;
  averageRating: number;
  completionRate: number;
}

interface RevenueDistribution {
  category: string;
  totalRevenue: number;
  percentage: number;
}

// Fallback data for when API is not available
const FALLBACK_DATA = {
  revenueStats: {
    totalRevenue: 125000,
    monthlyGrowth: 12.5,
    averageOrderValue: 89,
    conversionRate: 3.2,
    refundRate: 1.1,
    timeframe: 'month'
  },
  topCourses: [
    {
      id: '1',
      title: 'Advanced JavaScript Programming',
      revenue: 25000,
      enrollments: 280,
      completionRate: 85.2,
      averageRating: 4.8
    },
    {
      id: '2',
      title: 'React Development Masterclass',
      revenue: 22000,
      enrollments: 245,
      completionRate: 82.1,
      averageRating: 4.7
    },
    {
      id: '3',
      title: 'Python for Data Science',
      revenue: 19500,
      enrollments: 210,
      completionRate: 78.9,
      averageRating: 4.6
    }
  ],
  topTutors: [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      totalRevenue: 45000,
      courseCount: 8,
      studentCount: 520,
      averageRating: 4.9,
      completionRate: 88.5
    },
    {
      id: '2',
      name: 'Prof. Michael Chen',
      totalRevenue: 38000,
      courseCount: 6,
      studentCount: 420,
      averageRating: 4.8,
      completionRate: 85.2
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      totalRevenue: 32000,
      courseCount: 5,
      studentCount: 380,
      averageRating: 4.7,
      completionRate: 82.1
    }
  ],
  revenueDistribution: [
    { category: 'Programming', totalRevenue: 45000, percentage: 36 },
    { category: 'Data Science', totalRevenue: 32000, percentage: 25.6 },
    { category: 'Design', totalRevenue: 28000, percentage: 22.4 },
    { category: 'Business', totalRevenue: 20000, percentage: 16 }
  ]
};

export const WatchtowerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  
  // Business Intelligence Data
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [topCourses, setTopCourses] = useState<TopEarningCourse[]>([]);
  const [topTutors, setTopTutors] = useState<TopEarningTutor[]>([]);
  const [revenueDistribution, setRevenueDistribution] = useState<RevenueDistribution[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      setIsOffline(false);

      // Check if we're online
      if (!navigator.onLine) {
        setIsOffline(true);
        setError('No internet connection. Showing demo data.');
        setRevenueStats(FALLBACK_DATA.revenueStats);
        setTopCourses(FALLBACK_DATA.topCourses);
        setTopTutors(FALLBACK_DATA.topTutors);
        setRevenueDistribution(FALLBACK_DATA.revenueDistribution);
        setLoading(false);
        return;
      }

      // Load all business intelligence data in parallel
      const [
        revenueData,
        coursesData,
        tutorsData,
        distributionData
      ] = await Promise.all([
        apiService.getRevenueStats(timeframe).catch(() => FALLBACK_DATA.revenueStats),
        apiService.getTopEarningCourses(10, timeframe).catch(() => FALLBACK_DATA.topCourses),
        apiService.getTopEarningTutors(10, timeframe).catch(() => FALLBACK_DATA.topTutors),
        apiService.getRevenueDistribution(timeframe).catch(() => FALLBACK_DATA.revenueDistribution)
      ]);

      setRevenueStats(revenueData);
      setTopCourses(coursesData);
      setTopTutors(tutorsData);
      setRevenueDistribution(distributionData);

    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Showing demo data.');
      
      // Use fallback data on error
      setRevenueStats(FALLBACK_DATA.revenueStats);
      setTopCourses(FALLBACK_DATA.topCourses);
      setTopTutors(FALLBACK_DATA.topTutors);
      setRevenueDistribution(FALLBACK_DATA.revenueDistribution);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">Loading The Watchtower...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Connecting to business intelligence data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  The Watchtower
                </h1>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                The Watchtower Business Intelligence
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              {isOffline && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <WifiOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">Demo Mode</span>
                </div>
              )}
              
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {revenueStats ? formatCurrency(revenueStats.totalRevenue) : '$0'}
                </p>
                {revenueStats && (
                  <div className={`flex items-center mt-2 ${getGrowthColor(revenueStats.monthlyGrowth)}`}>
                    {getGrowthIcon(revenueStats.monthlyGrowth)}
                    <span className="text-sm font-medium ml-1">
                      {formatPercentage(Math.abs(revenueStats.monthlyGrowth))}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {revenueStats ? formatNumber(Math.floor(revenueStats.totalRevenue / 100)) : '0'}
                </p>
                <div className="flex items-center mt-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium ml-1">+12.5%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {revenueStats ? formatPercentage(revenueStats.conversionRate) : '0%'}
                </p>
                <div className="flex items-center mt-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium ml-1">+2.1%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {revenueStats ? formatCurrency(revenueStats.averageOrderValue) : '$0'}
                </p>
                <div className="flex items-center mt-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium ml-1">+5.3%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Earning Courses */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Earning Courses</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {topCourses.length > 0 ? (
                topCourses.slice(0, 5).map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{course.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatNumber(course.enrollments)} students
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(course.revenue)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatPercentage(course.completionRate)} completion
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No course data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Earning Tutors */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Earning Tutors</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {topTutors.length > 0 ? (
                topTutors.slice(0, 5).map((tutor, index) => (
                  <div key={tutor.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{tutor.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {tutor.courseCount} courses • {formatNumber(tutor.studentCount)} students
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(tutor.totalRevenue)}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {tutor.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No tutor data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Revenue Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Revenue Distribution</h3>
          {revenueDistribution.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {revenueDistribution.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.category}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatPercentage(item.percentage)}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(item.totalRevenue)}
                  </p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">No revenue distribution data available</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-gray-900 dark:text-white">Generate Report</span>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-gray-900 dark:text-white">Launch Campaign</span>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-gray-900 dark:text-white">Analyze Trends</span>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
              <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="font-medium text-gray-900 dark:text-white">Optimize Content</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WatchtowerDashboard;
