import React from 'react';
import { 
  BookOpen, 
  Search, 
  FileText, 
  MessageSquare, 
  Users, 
  Calendar,
  Video,
  FolderOpen,
  Inbox,
  Award,
  TrendingUp,
  Heart,
  AlertCircle
} from 'lucide-react';

interface EmptyStateProps {
  type?: 'courses' | 'search' | 'messages' | 'students' | 'calendar' | 'videos' | 'files' | 'inbox' | 'certificates' | 'analytics' | 'favorites' | 'error';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const defaultConfig = {
  courses: {
    icon: <BookOpen className="h-16 w-16" />,
    title: 'No courses found',
    message: 'Get started by exploring available courses or creating your own.'
  },
  search: {
    icon: <Search className="h-16 w-16" />,
    title: 'No results found',
    message: 'Try adjusting your search terms or filters to find what you\'re looking for.'
  },
  messages: {
    icon: <MessageSquare className="h-16 w-16" />,
    title: 'No messages yet',
    message: 'Start a conversation with your instructors or classmates.'
  },
  students: {
    icon: <Users className="h-16 w-16" />,
    title: 'No students enrolled',
    message: 'Students will appear here once they enroll in your courses.'
  },
  calendar: {
    icon: <Calendar className="h-16 w-16" />,
    title: 'No events scheduled',
    message: 'Add events to your calendar to stay organized.'
  },
  videos: {
    icon: <Video className="h-16 w-16" />,
    title: 'No videos available',
    message: 'Upload videos to enhance your course content.'
  },
  files: {
    icon: <FolderOpen className="h-16 w-16" />,
    title: 'No files uploaded',
    message: 'Upload files to share resources with your students.'
  },
  inbox: {
    icon: <Inbox className="h-16 w-16" />,
    title: 'Your inbox is empty',
    message: 'All caught up! No new notifications.'
  },
  certificates: {
    icon: <Award className="h-16 w-16" />,
    title: 'No certificates yet',
    message: 'Complete courses to earn certificates.'
  },
  analytics: {
    icon: <TrendingUp className="h-16 w-16" />,
    title: 'No data available',
    message: 'Analytics will appear here as students engage with your content.'
  },
  favorites: {
    icon: <Heart className="h-16 w-16" />,
    title: 'No favorites yet',
    message: 'Save courses you\'re interested in to access them later.'
  },
  error: {
    icon: <AlertCircle className="h-16 w-16" />,
    title: 'Something went wrong',
    message: 'We encountered an error. Please try again later.'
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'courses',
  title,
  message,
  actionLabel,
  onAction,
  icon
}) => {
  const config = defaultConfig[type];
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-6" style={{ color: '#9CA3AF' }}>
        {displayIcon}
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
        {displayTitle}
      </h3>
      <p className="text-sm max-w-md mb-6" style={{ color: '#6F73D2' }}>
        {displayMessage}
      </p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="px-6 py-3 rounded-lg font-semibold text-white transition-all"
          style={{
            backgroundColor: '#00B5AD',
            boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

