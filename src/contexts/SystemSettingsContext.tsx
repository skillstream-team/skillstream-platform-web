import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminAPI } from '@/api/admin.api';
import { isAdmin } from '@/api/auth-utils';

export interface SystemSettings {
  // General
  platformName: string;
  platformDescription?: string;
  supportEmail?: string;
  contactEmail?: string;
  
  // Features
  allowCourseCreation: boolean;
  requireCourseApproval: boolean;
  allowPublicRegistration: boolean;
  enableReviews: boolean;
  enableForums: boolean;
  
  // Payments
  platformFee?: number;
  minimumPayout?: number;
  payoutSchedule?: string;
  
  // Security
  requireEmailVerification?: boolean;
  enableTwoFactor?: boolean;
  sessionTimeout?: number;
  
  // Notifications
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  
  // Maintenance
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}

interface SystemSettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SystemSettings = {
  platformName: 'SkillStream',
  allowCourseCreation: true,
  requireCourseApproval: true,
  allowPublicRegistration: true,
  enableReviews: true,
  enableForums: true,
  maintenanceMode: false,
};

const SystemSettingsContext = createContext<SystemSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  refreshSettings: async () => {},
});

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};

interface SystemSettingsProviderProps {
  children: ReactNode;
}

export const SystemSettingsProvider: React.FC<SystemSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch settings, but don't fail if user is not admin
      // For non-admin users, we'll use default settings
      if (isAdmin()) {
        try {
          const data = await AdminAPI.getSystemSettings();
          if (data) {
            setSettings(data);
          }
        } catch (err: any) {
          // If admin but API fails, use defaults
          console.warn('Failed to fetch system settings, using defaults:', err);
          setSettings(defaultSettings);
        }
      } else {
        // For non-admin users, try to get public settings or use defaults
        // In a real app, you might have a public endpoint for settings
        setSettings(defaultSettings);
      }
    } catch (err: any) {
      console.error('Error fetching system settings:', err);
      setError(err.message || 'Failed to load system settings');
      setSettings(defaultSettings); // Fallback to defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    
    // Optionally refresh settings periodically (every 5 minutes)
    const interval = setInterval(() => {
      fetchSettings();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  const value: SystemSettingsContextType = {
    settings,
    loading,
    error,
    refreshSettings,
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

