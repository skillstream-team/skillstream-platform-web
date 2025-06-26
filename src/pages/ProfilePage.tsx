import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';
import { BackButton } from '../components/common/BackButton';
import { 
  UserIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  CalendarIcon,
  Cog6ToothIcon,
  BellIcon,
  EyeIcon,
  EyeSlashIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import { 
  PhotoIcon,
  FolderIcon,
  XMarkIcon as XMarkIconSolid
} from '@heroicons/react/24/solid';

interface FormDataType {
  name: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
  phonePublic: boolean;
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    courseUpdates: boolean;
    assignmentReminders: boolean;
    forumNotifications: boolean;
  };
}

interface SettingsDataType {
  language: string;
  theme: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'requesting' | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const location = useLocation();
  
  // Update activeTab based on the 'tab' query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['profile', 'settings', 'notifications', 'security'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Initialize settings data with current theme
  useEffect(() => {
    setSettingsData(prev => ({
      ...prev,
      theme: theme
    }));
  }, [theme]);

  const [formData, setFormData] = useState<FormDataType>({
    name: user?.name || '',
    email: user?.email || '',
    bio: 'Experienced educator passionate about creating engaging learning experiences. Specializing in modern web development and interactive teaching methodologies.',
    location: 'Nairobi, Kenya',
    website: 'https://stephanie-makwabarara.com',
    phone: '+254 700 123 456',
    phonePublic: false,
    timezone: 'Africa/Nairobi',
    language: 'English',
    notifications: {
      email: true,
      push: true,
      sms: false,
      courseUpdates: true,
      assignmentReminders: true,
      forumNotifications: true
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [settingsData, setSettingsData] = useState<SettingsDataType>({
    language: 'en',
    theme: 'auto'
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = () => {
    // Here you would typically make an API call to update the user profile
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    // Here you would typically make an API call to change the password
    console.log('Changing password:', passwordData);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleSettingsSave = () => {
    // Here you would typically make an API call to update the user settings
    console.log('Saving settings:', settingsData);
    // You could also update the theme store here
    // toggleTheme(settingsData.theme);
  };

  const handleLanguageChange = (language: string) => {
    setSettingsData(prev => ({ ...prev, language }));
    // Apply language change immediately
    console.log('Language changed to:', language);
    // Here you would typically update the app's language context
  };

  const handleThemeChange = (newTheme: string) => {
    setSettingsData(prev => ({ ...prev, theme: newTheme }));
    // Apply theme change immediately
    if (newTheme === 'dark' && theme !== 'dark') {
      toggleTheme();
    } else if (newTheme === 'light' && theme !== 'light') {
      toggleTheme();
    }
    // For 'auto' theme, you might need additional logic
  };

  const handlePhotoSelection = async (type: 'camera' | 'gallery' | 'files') => {
    try {
      if (type === 'camera') {
        // Request camera permission and take photo
        setCameraPermission('requesting');
        setCameraError(null);
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
        
        streamRef.current = stream;
        setCameraPermission('granted');
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play();
            }
          };
        }
      } else if (type === 'gallery' || type === 'files') {
        // Create file input for gallery/files selection
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;
        
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            setSelectedPhoto(file);
            const reader = new FileReader();
            reader.onload = (e) => {
              setPhotoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
          }
        };
        
        input.click();
      }
    } catch (error) {
      console.error('Error accessing camera/gallery:', error);
      setCameraPermission('denied');
      setCameraError('Camera permission was denied. Please enable camera access in your browser settings.');
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const fileName = `profile-photo-${Date.now()}.jpg`;
        // Create a File-like object from the blob
        const file = Object.assign(blob, { 
          name: fileName,
          lastModified: Date.now()
        }) as File;
        
        setSelectedPhoto(file);
        setPhotoPreview(URL.createObjectURL(blob));
        
        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setCameraPermission(null);
      }
    }, 'image/jpeg', 0.8);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraPermission(null);
    setCameraError(null);
  };

  // Cleanup camera stream on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSavePhoto = () => {
    if (selectedPhoto) {
      // Here you would typically upload the photo to your backend
      console.log('Saving photo:', selectedPhoto);
      // Update user avatar in the store or make API call
      setSelectedPhoto(null);
      setPhotoPreview(null);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: EyeIcon }
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
            />
            <button 
              onClick={() => setShowPhotoModal(true)}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              <CameraIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-600 dark:text-gray-300 flex items-center">
              <AcademicCapIcon className="w-4 h-4 mr-2" />
              {user?.role === 'ADMIN' ? 'Administrator' : user?.role}
            </p>
            <p className="text-gray-500 dark:text-gray-400 flex items-center">
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              {user?.email}
            </p>
            <p className="text-gray-500 dark:text-gray-400 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Member since {new Date(user?.createdAt || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <PencilIcon className="w-3.5 h-3.5 mr-1.5" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <div className="space-y-2">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
              {user?.role === 'ADMIN' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Make phone number public
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      (Visible to students and other tutors)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.phonePublic}
                      onChange={(e) => handleInputChange('phonePublic', e.target.checked)}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
            >
              <option value="Africa/Nairobi">Africa/Nairobi</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            disabled={!isEditing}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
          />
        </div>

        {isEditing && (
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              <XMarkIcon className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select 
              value={settingsData.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select 
              value={settingsData.theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleSettingsSave}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {Object.entries(formData.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleInputChange(`notifications.${key}`, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <button
            onClick={handlePasswordChange}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton showHome />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'security' && renderSecurityTab()}

        {/* Photo Selection Modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Update Profile Photo
                </h3>
                <button
                  onClick={() => {
                    setShowPhotoModal(false);
                    setSelectedPhoto(null);
                    setPhotoPreview(null);
                    stopCamera();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIconSolid className="w-5 h-5" />
                </button>
              </div>
              
              {photoPreview ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSavePhoto}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Photo
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPhoto(null);
                        setPhotoPreview(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Choose Different
                    </button>
                  </div>
                </div>
              ) : cameraPermission === 'requesting' ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Requesting Camera Permission
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Please allow camera access when prompted
                  </p>
                </div>
              ) : cameraPermission === 'granted' ? (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 bg-gray-900 rounded-lg"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={takePhoto}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Take Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : cameraPermission === 'denied' ? (
                <div className="text-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Camera Permission Denied
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {cameraError}
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setCameraPermission(null)}
                      className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => handlePhotoSelection('camera')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => handlePhotoSelection('camera')}
                    className="w-full flex items-center px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <CameraIcon className="w-5 h-5 mr-3" />
                    Take a Picture
                  </button>
                  <button
                    onClick={() => handlePhotoSelection('gallery')}
                    className="w-full flex items-center px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <PhotoIcon className="w-5 h-5 mr-3" />
                    Choose from Gallery
                  </button>
                  <button
                    onClick={() => handlePhotoSelection('files')}
                    className="w-full flex items-center px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <FolderIcon className="w-5 h-5 mr-3" />
                    Choose from Files
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 