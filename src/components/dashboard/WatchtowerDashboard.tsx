import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  AlertTriangle,
  Bot,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';

interface WatchtowerKPI {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  action: string;
  impact: 'high' | 'medium' | 'low';
}

export const WatchtowerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Mock Watchtower KPIs
  const kpis: WatchtowerKPI[] = [
    {
      id: 'revenue',
      title: 'Total Revenue',
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
    }
  ];

  // Mock Alerts
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'critical',
      title: 'System Performance Alert',
      message: 'Database response time exceeded 2 seconds',
      timestamp: '2 minutes ago',
      priority: 'high'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Revenue Trend Warning',
      message: 'Q4 revenue projection below target by 15%',
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
    }
  ];

  // Mock AI Insights
  const aiInsights: AIInsight[] = [
    {
      id: '1',
      title: 'Customer Churn Prediction',
      description: 'AI detected 15% increase in churn risk for premium users',
      confidence: 87,
      action: 'Implement retention campaign',
      impact: 'high'
    },
    {
      id: '2',
      title: 'Revenue Optimization',
      description: 'Pricing model suggests 8% increase for enterprise plans',
      confidence: 92,
      action: 'Review pricing strategy',
      impact: 'medium'
    },
    {
      id: '3',
      title: 'System Load Forecast',
      description: 'Predicted 40% increase in traffic during holiday season',
      confidence: 78,
      action: 'Scale infrastructure',
      impact: 'high'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="metric-card animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-12 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-watchtower">
            The Watchtower Dashboard
          </h1>
          <p className="text-yellow-400 mt-2">
            Welcome back, {user?.name}! Here's your business intelligence overview
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="badge badge-primary flex items-center">
            <Shield className="w-3 h-3 mr-1" />
            {user?.role === 'ADMIN' ? 'Administrator' : 'Analyst'}
          </span>
          <span className="text-yellow-400 text-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-gray-700 ${kpi.color}`}>
                {kpi.icon}
              </div>
              <div className="flex items-center space-x-1">
                {kpi.changeType === 'increase' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${
                  kpi.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {kpi.change}%
                </span>
              </div>
            </div>
            <div className="metric-value">{kpi.value}</div>
            <div className="metric-label">{kpi.title}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Insights */}
        <div className="lg:col-span-2">
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
              <div className="space-y-4">
                {aiInsights.map((insight) => (
                  <div key={insight.id} className="p-4 bg-gray-700 rounded-lg border border-yellow-500/20">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-yellow-200">{insight.title}</h4>
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
        </div>

        {/* Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-yellow-200 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                System Alerts
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-gray-700 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-200 text-sm">{alert.title}</h4>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-yellow-200 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-yellow-400" />
            System Status
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-yellow-200 font-medium">Database</p>
                <p className="text-green-400 text-sm">Operational</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-yellow-200 font-medium">API Services</p>
                <p className="text-green-400 text-sm">Operational</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-yellow-200 font-medium">AI Engine</p>
                <p className="text-green-400 text-sm">Operational</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-yellow-200 font-medium">Monitoring</p>
                <p className="text-red-400 text-sm">Degraded</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 