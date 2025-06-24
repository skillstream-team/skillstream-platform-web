import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Bot, FileText, Bell, Users, Settings, Home, Crown } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { to: '/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { to: '/ai', label: 'AI Assistant', icon: <Bot className="w-5 h-5" /> },
  { to: '/reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
  { to: '/alerts', label: 'Alerts', icon: <Bell className="w-5 h-5" /> },
  { to: '/users', label: 'Users', icon: <Users className="w-5 h-5" /> },
  { to: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-gradient-to-b from-watchtower-black-900 to-watchtower-black-800 border-r border-watchtower-gold-500/20 shadow-watchtower fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="flex items-center space-x-3 px-6 py-8">
        <div className="w-10 h-10 bg-gradient-to-br from-watchtower-gold-500 to-watchtower-accent-gold rounded-xl flex items-center justify-center shadow-lg">
          <Crown className="w-6 h-6 text-watchtower-black-900" />
        </div>
        <span className="text-2xl font-bold text-gradient-watchtower tracking-tight">The Watchtower</span>
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}; 