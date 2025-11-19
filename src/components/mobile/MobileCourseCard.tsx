import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Users, BookOpen, ArrowRight } from 'lucide-react';
import { Course } from '../../types';

interface MobileCourseCardProps {
  course: Course;
  isTeacher?: boolean;
  onBoost?: (courseId: string) => void;
}

export const MobileCourseCard: React.FC<MobileCourseCardProps> = ({ 
  course, 
  isTeacher = false,
  onBoost 
}) => {
  const getCourseImage = () => {
    return course.imageUrl || 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=200&fit=crop';
  };

  const enrollmentStats = {
    totalStudents: course.enrolledStudents || course.enrollments?.length || 0,
    activeStudents: (course as any).activeStudents ?? 0,
    completionRate: course.completionRate ?? 0
  };

  return (
    <Link
      to={`/courses/${course.id}`}
      className="block rounded-2xl border-2 overflow-hidden transition-all duration-300 active:scale-[0.98]"
      style={{
        backgroundColor: 'white',
        borderColor: '#E5E7EB'
      }}
    >
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden">
        {getCourseImage() ? (
          <img 
            src={getCourseImage()} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
          >
            <BookOpen className="h-16 w-16" style={{ color: '#00B5AD' }} />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {!course.isPaid && (
            <span 
              className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: '#00B5AD' }}
            >
              Free
            </span>
          )}
          {course.level && (
            <span 
              className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: '#6F73D2' }}
            >
              {course.level}
            </span>
          )}
          {isTeacher && (
            <span 
              className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${
                course.isActive ? 'bg-[#00B5AD]' : 'bg-[#9A8CFF]'
              }`}
            >
              {course.isActive ? 'Active' : 'Draft'}
            </span>
          )}
        </div>

        {course.enrolledStudents && course.enrolledStudents > 1000 && (
          <span 
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: '#9A8CFF' }}
          >
            Popular
          </span>
        )}
      </div>

      {/* Course Content */}
      <div className="p-5">
        {/* Category */}
        <div className="mb-3">
          <span 
            className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full"
            style={{ 
              backgroundColor: 'rgba(0, 181, 173, 0.1)',
              color: '#00B5AD'
            }}
          >
            {course.category || 'Course'}
          </span>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-bold mb-3 line-clamp-2" style={{ color: '#0B1E3F' }}>
          {course.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-current" style={{ color: '#F59E0B' }} />
            <span className="text-sm font-bold" style={{ color: '#0B1E3F' }}>
              {course.rating?.toFixed(1) || '4.5'}
            </span>
          </div>
          <span className="text-xs" style={{ color: '#6F73D2' }}>
            ({course.enrolledStudents || 0} students)
          </span>
        </div>
        
        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm mb-4" style={{ color: '#6F73D2' }}>
          <div className="flex items-center space-x-1.5">
            <Clock className="h-4 w-4" />
            <span>{course.duration || '8 weeks'}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Users className="h-4 w-4" />
            <span>{enrollmentStats.totalStudents.toLocaleString()}</span>
          </div>
        </div>

        {/* Teacher Stats */}
        {isTeacher && (
          <div 
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: 'rgba(111, 115, 210, 0.05)' }}
          >
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg mb-1" style={{ color: '#0B1E3F' }}>
                  {enrollmentStats.activeStudents}
                </div>
                <div style={{ color: '#6F73D2' }}>Active</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg mb-1" style={{ color: '#0B1E3F' }}>
                  {enrollmentStats.completionRate}%
                </div>
                <div style={{ color: '#6F73D2' }}>Completion</div>
              </div>
            </div>
          </div>
        )}

        {/* Instructor */}
        {!isTeacher && (
          <div className="flex items-center mb-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 overflow-hidden text-white font-bold"
              style={{ 
                background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
              }}
            >
              {course.teacher.avatarUrl ? (
                <img 
                  src={course.teacher.avatarUrl} 
                  alt={course.teacher.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{course.teacher.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#0B1E3F' }}>
                {course.teacher.name}
              </p>
              <p className="text-xs" style={{ color: '#6F73D2' }}>
                Instructor
              </p>
            </div>
          </div>
        )}
        
        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
          <div>
            {course.price === 0 || !course.isPaid ? (
              <span className="text-2xl font-bold" style={{ color: '#00B5AD' }}>Free</span>
            ) : (
              <span className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                ${course.price}
              </span>
            )}
          </div>
          <div 
            className="flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-white"
            style={{ 
              backgroundColor: '#00B5AD',
              boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
            }}
          >
            <span>{isTeacher ? 'Manage' : 'View'}</span>
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Link>
  );
};

