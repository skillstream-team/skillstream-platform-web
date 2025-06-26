import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Shield
} from 'lucide-react';

interface RevenueData {
  month: string;
  revenue: number;
  growth: number;
}

interface UserAnalytics {
  total: number;
  active: number;
  new: number;
  churn: number;
  engagement: number;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  action: string;
  category: 'revenue' | 'users' | 'performance' | 'security';
}

interface PredictiveMetric {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

export const BusinessIntelligenceWidgets: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Mock Revenue Data
  const revenueData: RevenueData[] = [
    { month: 'Jan', revenue: 2450000, growth: 12.5 },
    { month: 'Feb', revenue: 2680000, growth: 9.4 },
    { month: 'Mar', revenue: 2847000, growth: 6.2 },
    { month: 'Apr', revenue: 3120000, growth: 9.6 },
    { month: 'May', revenue: 2980000, growth: -4.5 },
    { month: 'Jun', revenue: 3240000, growth: 8.7 }
  ];

  // Mock User Analytics
  const userAnalytics: UserAnalytics = {
    total: 24847,
    active: 18923,
    new: 1247,
    churn: 234,
    engagement: 78.4
  };

  // Mock AI Insights
  const aiInsights: AIInsight[] = [
    {
      id: '1',
      title: 'Revenue Optimization Opportunity',
      description: 'AI analysis suggests 8% revenue increase possible through pricing optimization',
      confidence: 92,
      impact: 'high',
      action: 'Review pricing strategy',
      category: 'revenue'
    },
    {
      id: '2',
      title: 'Customer Churn Risk Alert',
      description: '15% of premium users showing churn indicators',
      confidence: 87,
      impact: 'high',
      action: 'Implement retention campaign',
      category: 'users'
    },
    {
      id: '3',
      title: 'Performance Bottleneck Detected',
      description: 'Database queries taking 40% longer than optimal',
      confidence: 78,
      impact: 'medium',
      action: 'Optimize database queries',
      category: 'performance'
    },
    {
      id: '4',
      title: 'Security Anomaly Detected',
      description: 'Unusual access patterns detected in admin panel',
      confidence: 85,
      impact: 'high',
      action: 'Investigate security logs',
      category: 'security'
    }
  ];

  // Mock Predictive Analytics
  const predictiveMetrics: PredictiveMetric[] = [
    {
      metric: 'Revenue',
      current: 3240000,
      predicted: 3510000,
      confidence: 89,
      trend: 'up'
    },
    {
      metric: 'Active Users',
      current: 18923,
      predicted: 20450,
      confidence: 92,
      trend: 'up'
    },
    {
      metric: 'Churn Rate',
      current: 2.1,
      predicted: 1.8,
      confidence: 76,
      trend: 'down'
    },
    {
      metric: 'Response Time',
      current: 1.2,
      predicted: 1.1,
      confidence: 84,
      trend: 'up'
    }
  ];

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'revenue': return <DollarSign className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      case 'performance': return <Activity className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getInsightColor = (category: string) => {
    switch (category) {
      case 'revenue': return 'text-green-400';
      case 'users': return 'text-blue-400';
      case 'performance': return 'text-yellow-400';
      case 'security': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Revenue Analytics */}
      <div className="dashboard-card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-yellow-200 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-yellow-400" />
              Revenue Analytics
            </h3>
            <div className="flex items-center space-x-2">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-gray-700 border border-yellow-500/20 text-yellow-200 rounded px-3 py-1 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div>
              <h4 className="text-lg font-semibold text-yellow-200 mb-4">Revenue Trend</h4>
              <div className="space-y-3">
                {revenueData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-200 font-medium">{data.month}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-200 font-semibold">
                        ${(data.revenue / 1000000).toFixed(1)}M
                      </div>
                      <div className={`text-sm flex items-center ${
                        data.growth >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {data.growth >= 0 ? (
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(data.growth)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Metrics */}
            <div>
              <h4 className="text-lg font-semibold text-yellow-200 mb-4">Key Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    ${(revenueData[revenueData.length - 1].revenue / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-yellow-300">Current Revenue</div>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">
                    +{revenueData[revenueData.length - 1].growth}%
                  </div>
                  <div className="text-sm text-yellow-300">Growth Rate</div>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    ${(revenueData.reduce((sum, data) => sum + data.revenue, 0) / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-yellow-300">Total Revenue</div>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {revenueData.filter(d => d.growth > 0).length}/{revenueData.length}
                  </div>
                  <div className="text-sm text-yellow-300">Positive Months</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Analytics */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-yellow-200 flex items-center">
            <Users className="w-5 h-5 mr-2 text-yellow-400" />
            User Analytics
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-3xl font-bold text-yellow-500">{userAnalytics.total.toLocaleString()}</div>
              <div className="text-sm text-yellow-300">Total Users</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-3xl font-bold text-green-400">{userAnalytics.active.toLocaleString()}</div>
              <div className="text-sm text-yellow-300">Active Users</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-3xl font-bold text-blue-400">+{userAnalytics.new.toLocaleString()}</div>
              <div className="text-sm text-yellow-300">New Users</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-3xl font-bold text-red-400">-{userAnalytics.churn}</div>
              <div className="text-sm text-yellow-300">Churned Users</div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-200 font-medium">Engagement Rate</span>
              <span className="text-yellow-400 font-semibold">{userAnalytics.engagement}%</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full"
                style={{ width: `${userAnalytics.engagement}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="dashboard-card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-yellow-200 flex items-center">
              <Bot className="w-5 h-5 mr-2 text-yellow-400" />
              AI-Powered Insights
            </h3>
            <button className="btn-watchtower text-sm">
              View All Insights
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiInsights.map((insight) => (
              <div key={insight.id} className="p-4 bg-gray-700 rounded-lg border border-yellow-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg bg-gray-600 ${getInsightColor(insight.category)}`}>
                      {getInsightIcon(insight.category)}
                    </div>
                    <h4 className="font-semibold text-yellow-200">{insight.title}</h4>
                  </div>
                  <span className={`badge ${
                    insight.impact === 'high' ? 'badge-danger' : 
                    insight.impact === 'medium' ? 'badge-warning' : 'badge-success'
                  }`}>
                    {insight.impact} impact
                  </span>
                </div>
                <p className="text-yellow-300 text-sm mb-3">{insight.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-yellow-400">
                      Confidence: {insight.confidence}%
                    </span>
                    <div className="w-16 h-2 bg-gray-600 rounded-full">
                      <div 
                        className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"
                        style={{ width: `${insight.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                  <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
                    {insight.action} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-yellow-200 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
            Predictive Analytics
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {predictiveMetrics.map((metric, index) => (
              <div key={index} className="p-4 bg-gray-700 rounded-lg text-center">
                <div className="text-lg font-semibold text-yellow-200 mb-2">{metric.metric}</div>
                <div className="text-2xl font-bold text-yellow-500 mb-1">
                  {typeof metric.current === 'number' && metric.current > 1000000 
                    ? `$${(metric.current / 1000000).toFixed(1)}M`
                    : metric.current > 1000 
                    ? metric.current.toLocaleString()
                    : metric.current
                  }
                </div>
                <div className="text-sm text-yellow-300 mb-2">Current</div>
                <div className="text-lg font-semibold text-green-400 mb-1">
                  {typeof metric.predicted === 'number' && metric.predicted > 1000000 
                    ? `$${(metric.predicted / 1000000).toFixed(1)}M`
                    : metric.predicted > 1000 
                    ? metric.predicted.toLocaleString()
                    : metric.predicted
                  }
                </div>
                <div className="text-sm text-yellow-300 mb-2">Predicted</div>
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-xs text-yellow-400">
                    {metric.confidence}% confidence
                  </span>
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3 text-green-400" />
                  ) : metric.trend === 'down' ? (
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                  ) : (
                    <div className="w-3 h-3 text-yellow-400">—</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 