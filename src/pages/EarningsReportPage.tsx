import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  ArrowLeft,
  Users,
  Building,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { PayoutRequest, payoutApi } from '../services/api';

interface CourseEarnings {
  courseId: string;
  courseTitle: string;
  individualEarnings: number;
  corporateEarnings: number;
  totalEarnings: number;
  enrollments: number;
  completionRate: number;
}

interface Transaction {
  id: string;
  type: 'enrollment' | 'payout' | 'adjustment' | 'payout-request';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed' | 'scheduled';
  courseTitle?: string;
  studentName?: string;
  clientType?: 'individual' | 'corporate';
  payoutMonth?: string;
}



interface EarningsData {
  currentMonth: number;
  previousMonth: number;
  yearToDate: number;
  lifetime: number;
  tutorShare: number;
  courses: CourseEarnings[];
  transactions: Transaction[];
  monthlyTrends: { month: string; earnings: number }[];
  pendingPayoutRequests: PayoutRequest[];
  nextPayoutDate: string;
  payoutCutoffDate: string;
}

export const EarningsReportPage: React.FC = () => {
  const { user } = useAuthStore();
  const [earningsData, setEarningsData] = useState<EarningsData>({
    currentMonth: 0,
    previousMonth: 0,
    yearToDate: 0,
    lifetime: 0,
    tutorShare: 0,
    courses: [],
    transactions: [],
    monthlyTrends: [],
    pendingPayoutRequests: [],
    nextPayoutDate: '',
    payoutCutoffDate: ''
  });
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    try {
      if (!user?.id) return;
      
      // Load earnings report from API
      // TODO: Replace with actual API call when endpoint is available
      // const data = await payoutApi.getEarningsReport(user.id);
      const data = {
        currentMonth: 0,
        previousMonth: 0,
        yearToDate: 0,
        lifetime: 0,
        tutorShare: 0,
        courses: [],
        transactions: [],
        monthlyTrends: [],
        pendingPayoutRequests: [],
        nextPayoutDate: '',
        payoutCutoffDate: ''
      };
      setEarningsData(data);
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'enrollment': return <Users className="h-4 w-4" />;
      case 'payout': return <DollarSign className="h-4 w-4" />;
      case 'payout-request': return <Clock className="h-4 w-4" />;
      case 'adjustment': return <FileText className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'enrollment': return 'text-green-600 dark:text-green-400';
      case 'payout': return 'text-red-600 dark:text-red-400';
      case 'payout-request': return 'text-blue-600 dark:text-blue-400';
      case 'adjustment': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending': return <Clock className="h-3 w-3 text-yellow-600" />;
      case 'scheduled': return <Clock className="h-3 w-3 text-blue-600" />;
      case 'failed': return <AlertCircle className="h-3 w-3 text-red-600" />;
      default: return <Clock className="h-3 w-3 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                  </div>
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
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Detailed Earnings Report
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Comprehensive breakdown of your earnings and revenue streams
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector */}
        <div className="mb-6">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="current-month">Current Month</option>
            <option value="previous-month">Previous Month</option>
            <option value="year-to-date">Year to Date</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>

        {/* Monthly Payout Status */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Monthly Payout Status
                </h3>
                <p className="text-blue-700 dark:text-blue-300">
                  Next payout: {earningsData.nextPayoutDate} • Cut-off: {earningsData.payoutCutoffDate}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600 dark:text-blue-400">Pending Requests</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {earningsData.pendingPayoutRequests.length}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Earnings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(earningsData.tutorShare)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {earningsData.courses.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Earnings Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Earnings by Course
            </h3>
            <div className="space-y-4">
              {earningsData.courses.map(course => (
                <div key={course.courseId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {course.courseTitle}
                    </h4>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(course.totalEarnings)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-600 dark:text-gray-400">Individual:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(course.individualEarnings)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-600 dark:text-gray-400">Corporate:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(course.corporateEarnings)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {course.enrollments} enrollments • {course.completionRate}% completion rate
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Transactions
            </h3>
            <div className="space-y-3">
              {earningsData.transactions.map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-600 ${getTransactionColor(transaction.type)}`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.date)}
                        {transaction.payoutMonth && ` • ${transaction.payoutMonth}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${transaction.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {transaction.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                    </span>
                    {getStatusIcon(transaction.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Payout Requests */}
        {earningsData.pendingPayoutRequests.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pending Payout Requests
            </h3>
            <div className="space-y-4">
              {earningsData.pendingPayoutRequests.map(request => (
                <div key={request.id} className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        {formatCurrency(request.amount)} - {request.paymentMethod}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Requested: {formatDate(request.requestedDate)} • Scheduled: {request.scheduledDate ? formatDate(request.scheduledDate) : 'Pending'}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {request.payoutMonth} Payout Cycle
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800">
                        Scheduled for Month-End
                      </span>
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Trends Chart */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Earnings Trend
          </h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {earningsData.monthlyTrends.map((trend, index) => {
              const maxEarnings = Math.max(...earningsData.monthlyTrends.map(t => t.earnings));
              const height = (trend.earnings / maxEarnings) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    {trend.month}
                  </div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    {formatCurrency(trend.earnings)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}; 
