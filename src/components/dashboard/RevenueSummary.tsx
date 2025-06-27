import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { payoutApi, RevenueData, PayoutRequest } from '../../services/api';

export const RevenueSummary: React.FC = () => {
  const { user } = useAuthStore();
  const [revenueData, setRevenueData] = useState<RevenueData>({
    currentMonthEarnings: 0,
    pendingPayout: 0,
    lifetimeEarnings: 0,
    availableBalance: 0,
    nextPayoutDate: '',
    payoutCutoffDate: ''
  });
  const [recentPayouts, setRecentPayouts] = useState<PayoutRequest[]>([]);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bank' | 'paypal' | 'paynow'>('bank');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      if (!user?.id) return;
      
      // Load revenue data from API
      const revenue = await payoutApi.getTutorRevenue();
      setRevenueData(revenue);

      // Load recent payouts
      const payouts = await payoutApi.getPayoutRequests(user.id);
      setRecentPayouts(payouts.slice(0, 2)); // Show last 2 payouts
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    const amount = parseFloat(payoutAmount);
    if (amount <= 0 || amount > revenueData.availableBalance) {
      alert('Invalid amount');
      return;
    }

    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    setSubmitting(true);
    try {
      // Submit payout request via API
      await payoutApi.requestPayout({
        tutorId: user.id,
        amount,
        paymentMethod: selectedPaymentMethod
      });
      
      alert('Payout request submitted successfully! Your payment will be processed at the end of this month.');
      setIsPayoutModalOpen(false);
      setPayoutAmount('');
      loadRevenueData(); // Refresh data
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit payout request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'processing': return 'text-blue-600 dark:text-blue-400';
      case 'scheduled': return 'text-blue-600 dark:text-blue-400';
      case 'requested': return 'text-yellow-600 dark:text-yellow-400';
      case 'failed': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPayoutStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'processing': return 'Processing';
      case 'scheduled': return 'Scheduled for Month-End';
      case 'requested': return 'Requested';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg shadow-sm border border-green-200 dark:border-green-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Summary</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Your earnings overview</p>
            </div>
          </div>
          <Link
            to="/earnings-report"
            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm flex items-center"
          >
            View More
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Month</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(revenueData.currentMonthEarnings)}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payout</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(revenueData.pendingPayout)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Scheduled for month-end
                </p>
              </div>
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lifetime Earnings</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(revenueData.lifetimeEarnings)}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Payout Schedule Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Monthly Payout Schedule
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Payouts are processed on the last business day of each month. 
                Requests submitted by {revenueData.payoutCutoffDate} will be included in this month's payout.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            {submitting ? 'Submitting...' : 'Request Monthly Payout'}
          </button>
          
          <Link
            to="/revenue-growth"
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
          >
            <Zap className="h-4 w-4 mr-2" />
            Boost! Your Revenue
          </Link>
        </div>

        {/* Recent Payouts */}
        {recentPayouts.length > 0 && (
          <div className="mt-6 pt-4 border-t border-green-200 dark:border-green-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Payouts</h4>
            <div className="space-y-2">
              {recentPayouts.map(payout => (
                <div key={payout.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPayoutStatusColor(payout.status)} bg-opacity-10`}>
                      {getPayoutStatusText(payout.status)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatCurrency(payout.amount)}
                    </span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(payout.completedDate || payout.requestedDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request Monthly Payout</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Available Balance for End-of-Month Payout
              </label>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(revenueData.availableBalance)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount to Request for Monthly Payout
              </label>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="0"
                max={revenueData.availableBalance}
                step="0.01"
                disabled={submitting}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as 'bank' | 'paypal' | 'paynow')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={submitting}
              >
                <option value="bank">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="paynow">PayNow</option>
              </select>
            </div>

            {/* Payout Schedule Reminder */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-6">
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Monthly Payout Schedule:</strong> Your payment will be processed at the end of this month (last business day).
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Cut-off date: {revenueData.payoutCutoffDate}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handlePayoutRequest}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Request Monthly Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 