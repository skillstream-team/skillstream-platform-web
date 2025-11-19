import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Briefcase } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn("border-t mt-auto", className)} style={{ 
      borderColor: 'rgba(11, 30, 63, 0.1)',
      backgroundColor: 'white'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-3" style={{ 
              background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 50%, #9A8CFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              SkillStream
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6F73D2' }}>
              Empowering educators. Elevating learning.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}>
                <BookOpen className="h-5 w-5" style={{ color: '#00B5AD' }} />
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(111, 115, 210, 0.1)' }}>
                <GraduationCap className="h-5 w-5" style={{ color: '#6F73D2' }} />
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(154, 140, 255, 0.1)' }}>
                <Briefcase className="h-5 w-5" style={{ color: '#9A8CFF' }} />
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: '#0B1E3F' }}>Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/courses" className="text-sm transition-colors hover:opacity-80" style={{ color: '#6F73D2' }}>
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/lessons" className="text-sm transition-colors hover:opacity-80" style={{ color: '#6F73D2' }}>
                  Lessons
                </Link>
              </li>
              <li>
                <Link to="/calendar" className="text-sm transition-colors hover:opacity-80" style={{ color: '#6F73D2' }}>
                  Calendar
                </Link>
              </li>
              <li>
                <Link to="/messages" className="text-sm transition-colors hover:opacity-80" style={{ color: '#6F73D2' }}>
                  Messages
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ color: '#0B1E3F' }}>Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-sm transition-colors hover:opacity-80" style={{ color: '#6F73D2' }}>
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm transition-colors hover:opacity-80" style={{ color: '#6F73D2' }}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm transition-colors hover:opacity-80" style={{ color: '#6F73D2' }}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm transition-colors hover:opacity-80" style={{ color: '#6F73D2' }}>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm" style={{ 
          borderColor: 'rgba(11, 30, 63, 0.1)',
          color: '#6F73D2'
        }}>
          <p>© {new Date().getFullYear()} SkillStream. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

