import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  PieChart,
  Activity,
  DollarSign,
  Users,
  Target} from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface TimeSeriesData {
  date: string;
  value: number;
  category: string;
}

export const AnalyticsCharts: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedChart, setSelectedChart] = useState('revenue');

  // Mock data for charts
  const revenueData: TimeSeriesData[] = [
    { date: '2024-01', value: 2450000, category: 'Revenue' },
    { date: '2024-02', value: 2680000, category: 'Revenue' },
    { date: '2024-03', value: 2847000, category: 'Revenue' },
    { date: '2024-04', value: 3120000, category: 'Revenue' },
    { date: '2024-05', value: 2980000, category: 'Revenue' },
    { date: '2024-06', value: 3240000, category: 'Revenue' }
  ];

  const userGrowthData: TimeSeriesData[] = [
    { date: '2024-01', value: 18500, category: 'Users' },
    { date: '2024-02', value: 20100, category: 'Users' },
    { date: '2024-03', value: 21800, category: 'Users' },
    { date: '2024-04', value: 23500, category: 'Users' },
    { date: '2024-05', value: 24200, category: 'Users' },
    { date: '2024-06', value: 24847, category: 'Users' }
  ];

  const conversionData: ChartData[] = [
    { name: 'Direct', value: 45, color: '#10B981' },
    { name: 'Organic Search', value: 25, color: '#3B82F6' },
    { name: 'Social Media', value: 15, color: '#8B5CF6' },
    { name: 'Referral', value: 10, color: '#F59E0B' },
    { name: 'Email', value: 5, color: '#EF4444' }
  ];

  const performanceMetrics = [
    { name: 'Page Load Time', value: '1.2s', trend: 'down', change: -0.3 },
    { name: 'API Response Time', value: '0.8s', trend: 'up', change: 0.1 },
    { name: 'Database Queries', value: '156ms', trend: 'down', change: -12 },
    { name: 'Cache Hit Rate', value: '94.2%', trend: 'up', change: 2.1 }
  ];

  const renderRevenueChart = () => (
    <div className="p-6 bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-yellow-200">Revenue Trend</h3>
        <DollarSign className="w-5 h-5 text-yellow-400" />
      </div>
      <div className="space-y-3">
        {revenueData.map((data, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-yellow-300 text-sm">{data.date}</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"
                  style={{ width: `${(data.value / 3500000) * 100}%` }}
                ></div>
              </div>
              <span className="text-yellow-200 font-medium">
                ${(data.value / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUserGrowthChart = () => (
    <div className="p-6 bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-yellow-200">User Growth</h3>
        <Users className="w-5 h-5 text-blue-400" />
      </div>
      <div className="space-y-3">
        {userGrowthData.map((data, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-yellow-300 text-sm">{data.date}</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  style={{ width: `${(data.value / 25000) * 100}%` }}
                ></div>
              </div>
              <span className="text-blue-200 font-medium">
                {data.value.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConversionChart = () => (
    <div className="p-6 bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-yellow-200">Traffic Sources</h3>
        <PieChart className="w-5 h-5 text-purple-400" />
      </div>
      <div className="space-y-3">
        {conversionData.map((data, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: data.color }}
              ></div>
              <span className="text-yellow-300 text-sm">{data.name}</span>
            </div>
            <span className="text-yellow-200 font-medium">{data.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerformanceMetrics = () => (
    <div className="p-6 bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-yellow-200">Performance Metrics</h3>
        <Activity className="w-5 h-5 text-green-400" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="text-center p-3 bg-gray-600 rounded-lg">
            <div className="text-sm text-yellow-300 mb-1">{metric.name}</div>
            <div className="text-lg font-bold text-yellow-200 mb-1">{metric.value}</div>
            <div className={`text-xs flex items-center justify-center ${
              metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {metric.trend === 'up' ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {metric.change > 0 ? '+' : ''}{metric.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select 
            value={selectedChart}
            onChange={(e) => setSelectedChart(e.target.value)}
            className="bg-gray-700 border border-yellow-500/20 text-yellow-200 rounded px-3 py-2"
          >
            <option value="revenue">Revenue Analytics</option>
            <option value="users">User Growth</option>
            <option value="conversion">Traffic Sources</option>
            <option value="performance">Performance</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-gray-700 border border-yellow-500/20 text-yellow-200 rounded px-3 py-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Chart Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedChart === 'revenue' && renderRevenueChart()}
        {selectedChart === 'users' && renderUserGrowthChart()}
        {selectedChart === 'conversion' && renderConversionChart()}
        {selectedChart === 'performance' && renderPerformanceMetrics()}
        
        {/* Additional Metrics */}
        <div className="p-6 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-yellow-200">Key Insights</h3>
            <Target className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-gray-600 rounded-lg">
              <div className="text-sm text-yellow-300 mb-1">Revenue Growth</div>
              <div className="text-lg font-bold text-green-400">+12.5%</div>
              <div className="text-xs text-yellow-400">vs last month</div>
            </div>
            <div className="p-3 bg-gray-600 rounded-lg">
              <div className="text-sm text-yellow-300 mb-1">User Acquisition</div>
              <div className="text-lg font-bold text-blue-400">+8.2%</div>
              <div className="text-xs text-yellow-400">vs last month</div>
            </div>
            <div className="p-3 bg-gray-600 rounded-lg">
              <div className="text-sm text-yellow-300 mb-1">Conversion Rate</div>
              <div className="text-lg font-bold text-purple-400">3.2%</div>
              <div className="text-xs text-yellow-400">industry avg: 2.8%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Activity */}
      <div className="p-6 bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-200">Real-time Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">1,247</div>
            <div className="text-sm text-yellow-300">Active Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">$45,892</div>
            <div className="text-sm text-yellow-300">Revenue Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">89.2%</div>
            <div className="text-sm text-yellow-300">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">156</div>
            <div className="text-sm text-yellow-300">AI Insights</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 