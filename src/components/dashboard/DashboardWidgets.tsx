import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Bot,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Zap,
  Shield,
  Database,
  Server,
  Globe,
  Cpu,
  Bell
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';

interface BusinessMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

interface PerformanceMetric {
  name: string;
  value: string;
  status: 'operational' | 'degraded' | 'down';
  icon: React.ReactNode;
}

export const DashboardWidgets: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Business Metrics
  const businessMetrics: BusinessMetric[] = [
    {
      id: 'revenue',
      title: 'Monthly Revenue',
      value: '$2,847,392',
      change: 12.5,
      changeType: 'increase',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-green-400'
    },
    {
      id: 'users',
      title: 'Active Users',
      value: '24,847',
      change: 8.2,
      changeType: 'increase',
      icon: <Users className="w-6 h-6" />,
      color: 'text-blue-400'
    },
    {
      id: 'engagement',
      title: 'Engagement Rate',
      value: '78.4%',
      change: -2.1,
      changeType: 'decrease',
      icon: <Activity className="w-6 h-6" />,
      color: 'text-yellow-400'
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      value: '156',
      change: 23.7,
      changeType: 'increase',
      icon: <Bot className="w-6 h-6" />,
      color: 'text-purple-400'
    },
    {
      id: 'conversion',
      title: 'Conversion Rate',
      value: '3.2%',
      change: 0.8,
      changeType: 'increase',
      icon: <Target className="w-6 h-6" />,
      color: 'text-indigo-400'
    },
    {
      id: 'response-time',
      title: 'Avg Response Time',
      value: '1.2s',
      change: -0.3,
      changeType: 'decrease',
      icon: <Clock className="w-6 h-6" />,
      color: 'text-emerald-400'
    }
  ];

  // System Alerts
  const systemAlerts: SystemAlert[] = [
        {
          id: '1',
      type: 'critical',
      title: 'Revenue Drop Detected',
      message: 'Q4 revenue projection below target by 15%',
      timestamp: '2 minutes ago',
      priority: 'high'
        },
        {
          id: '2',
      type: 'warning',
      title: 'System Performance Alert',
      message: 'Database response time exceeded 2 seconds',
      timestamp: '1 hour ago',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'info',
      title: 'New AI Model Deployed',
      message: 'Predictive analytics model v2.1 successfully deployed',
      timestamp: '3 hours ago',
      priority: 'low'
    },
    {
      id: '4',
      type: 'success',
      title: 'Security Scan Complete',
      message: 'All systems passed security audit with 100% compliance',
      timestamp: '6 hours ago',
      priority: 'low'
        }
  ];

  // Performance Metrics
  const performanceMetrics: PerformanceMetric[] = [
    {
      name: 'Database',
      value: 'Operational',
      status: 'operational',
      icon: <Database className="w-5 h-5" />
    },
    {
      name: 'API Services',
      value: 'Operational',
      status: 'operational',
      icon: <Server className="w-5 h-5" />
    },
    {
      name: 'AI Engine',
      value: 'Operational',
      status: 'operational',
      icon: <Cpu className="w-5 h-5" />
    },
    {
      name: 'CDN',
      value: 'Operational',
      status: 'operational',
      icon: <Globe className="w-5 h-5" />
    },
    {
      name: 'Monitoring',
      value: 'Degraded',
      status: 'degraded',
      icon: <Eye className="w-5 h-5" />
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'down': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="dashboard-card animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-12 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Business Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businessMetrics.map((metric) => (
          <div key={metric.id} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-gray-700 ${metric.color}`}>
                {metric.icon}
              </div>
              <div className="flex items-center space-x-1">
                {metric.changeType === 'increase' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${
                  metric.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {metric.change}%
              </span>
              </div>
            </div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-label">{metric.title}</div>
          </div>
        ))}
          </div>

      {/* System Status and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Alerts */}
        <div className="lg:col-span-2">
          <div className="dashboard-card">
            <div className="card-header">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-yellow-200 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-yellow-400" />
                  System Alerts & Notifications
                </h3>
                <button className="btn-secondary text-sm">
                  View All Alerts
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 bg-gray-700 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-200 text-sm">{alert.title}</h4>
                        <p className="text-yellow-400 text-xs mt-1">{alert.message}</p>
                        <span className="text-gray-400 text-xs">{alert.timestamp}</span>
              </div>
                      <span className={`badge ${
                        alert.priority === 'high' ? 'badge-danger' : 
                        alert.priority === 'medium' ? 'badge-warning' : 'badge-success'
                      }`}>
                        {alert.priority}
              </span>
            </div>
              </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-6">
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-yellow-200 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-yellow-400" />
                System Status
              </h3>
            </div>
            <div className="card-body">
          <div className="space-y-3">
                {performanceMetrics.map((metric) => (
                  <div key={metric.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(metric.status)}
                      <div>
                        <p className="text-yellow-200 font-medium text-sm">{metric.name}</p>
                        <p className={`text-xs ${getStatusColor(metric.status)}`}>{metric.value}</p>
                </div>
              </div>
            </div>
                ))}
              </div>
            </div>
              </div>

          {/* Quick Actions */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-yellow-200 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                Quick Actions
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <button className="w-full btn-watchtower text-sm">
                  Generate Report
                </button>
                <button className="w-full btn-secondary text-sm">
                  View Analytics
                </button>
                <button className="w-full btn-secondary text-sm">
                  Manage Users
                </button>
                <button className="w-full btn-secondary text-sm">
                  System Settings
                </button>
                <button className="w-full btn-secondary text-sm">
                  AI Assistant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Analytics */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-yellow-200 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
            Real-time Analytics
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
    </div>
  );
}; 