import React from 'react';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'avatar' | 'image' | 'list' | 'table';
  lines?: number;
  width?: string;
  height?: string;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  lines = 3,
  width,
  height,
  className = ''
}) => {
  const baseClasses = 'animate-pulse rounded';
  const bgColor = 'bg-gray-200';

  if (type === 'card') {
    return (
      <div className={`${baseClasses} ${bgColor} ${className}`} style={{ width: width || '100%', height: height || '200px' }}>
        <div className="p-4 space-y-3">
          <div className={`h-4 ${bgColor} rounded w-3/4`}></div>
          <div className={`h-4 ${bgColor} rounded w-1/2`}></div>
          <div className={`h-20 ${bgColor} rounded w-full`}></div>
        </div>
      </div>
    );
  }

  if (type === 'avatar') {
    return (
      <div
        className={`${baseClasses} ${bgColor} ${className}`}
        style={{
          width: width || '40px',
          height: height || '40px',
          borderRadius: '50%'
        }}
      />
    );
  }

  if (type === 'image') {
    return (
      <div
        className={`${baseClasses} ${bgColor} ${className}`}
        style={{ width: width || '100%', height: height || '200px' }}
      />
    );
  }

  if (type === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className={`${baseClasses} ${bgColor} w-10 h-10 rounded-full`}></div>
            <div className="flex-1 space-y-2">
              <div className={`h-4 ${bgColor} rounded w-3/4`}></div>
              <div className={`h-3 ${bgColor} rounded w-1/2`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className={`h-4 ${bgColor} rounded flex-1`}></div>
            <div className={`h-4 ${bgColor} rounded flex-1`}></div>
            <div className={`h-4 ${bgColor} rounded flex-1`}></div>
            <div className={`h-4 ${bgColor} rounded w-20`}></div>
          </div>
        ))}
      </div>
    );
  }

  // Default: text lines
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${bgColor} h-4 rounded`}
          style={{
            width: i === lines - 1 ? '60%' : width || '100%'
          }}
        />
      ))}
    </div>
  );
};

// Course Card Skeleton
export const CourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border-2 overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
      <SkeletonLoader type="image" height="180px" />
      <div className="p-4 space-y-3">
        <SkeletonLoader type="text" lines={1} width="80%" />
        <SkeletonLoader type="text" lines={2} width="100%" />
        <div className="flex items-center justify-between pt-2">
          <SkeletonLoader type="text" lines={1} width="60px" />
          <SkeletonLoader type="text" lines={1} width="80px" />
        </div>
      </div>
    </div>
  );
};

// Video Player Skeleton
export const VideoPlayerSkeleton: React.FC = () => {
  return (
    <div className="relative bg-black aspect-video">
      <SkeletonLoader type="image" height="100%" className="opacity-30" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

// List Item Skeleton
export const ListItemSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-white rounded-lg border-2" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center space-x-3">
            <SkeletonLoader type="avatar" width="48px" height="48px" />
            <div className="flex-1 space-y-2">
              <SkeletonLoader type="text" lines={1} width="40%" />
              <SkeletonLoader type="text" lines={1} width="60%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

