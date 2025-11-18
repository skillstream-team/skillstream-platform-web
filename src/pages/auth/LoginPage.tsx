import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, BookOpen, Pencil, Headphones, Video, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { ThemeToggle } from '../../components/auth/ThemeToggle';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: '#F4F7FA' }}>
      <ThemeToggle />
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]">
        <div className="absolute top-[10%] left-[8%]"><BookOpen className="h-4 w-4" style={{ color: '#00B5AD' }} /></div>
        <div className="absolute top-[15%] left-[25%]"><Pencil className="h-3 w-3" style={{ color: '#6F73D2' }} /></div>
        <div className="absolute top-[20%] left-[45%]"><Headphones className="h-4 w-4" style={{ color: '#9A8CFF' }} /></div>
        <div className="absolute top-[12%] left-[65%]"><Video className="h-3 w-3" style={{ color: '#00B5AD' }} /></div>
        <div className="absolute top-[18%] left-[85%]"><GraduationCap className="h-4 w-4" style={{ color: '#6F73D2' }} /></div>
        <div className="absolute top-[30%] right-[12%]"><BookOpen className="h-3 w-3" style={{ color: '#9A8CFF' }} /></div>
        <div className="absolute top-[35%] right-[30%]"><Pencil className="h-4 w-4" style={{ color: '#00B5AD' }} /></div>
        <div className="absolute top-[40%] right-[50%]"><Headphones className="h-3 w-3" style={{ color: '#6F73D2' }} /></div>
        <div className="absolute top-[50%] left-[15%]"><Video className="h-4 w-4" style={{ color: '#9A8CFF' }} /></div>
        <div className="absolute top-[55%] left-[35%]"><GraduationCap className="h-3 w-3" style={{ color: '#00B5AD' }} /></div>
        <div className="absolute top-[60%] left-[55%]"><BookOpen className="h-4 w-4" style={{ color: '#6F73D2' }} /></div>
        <div className="absolute top-[70%] right-[20%]"><Pencil className="h-3 w-3" style={{ color: '#9A8CFF' }} /></div>
        <div className="absolute top-[75%] right-[40%]"><Headphones className="h-4 w-4" style={{ color: '#00B5AD' }} /></div>
        <div className="absolute top-[80%] right-[60%]"><Video className="h-3 w-3" style={{ color: '#6F73D2' }} /></div>
        <div className="absolute top-[85%] left-[25%]"><GraduationCap className="h-4 w-4" style={{ color: '#9A8CFF' }} /></div>
      </div>

      {/* Gradient Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: 'linear-gradient(135deg, #9A8CFF 0%, #6F73D2 100%)' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-10">
          <h1 className="text-7xl font-bold mb-4 tracking-tight" style={{ 
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif', 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 50%, #9A8CFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            SkillStream
          </h1>
          <p className="text-lg font-medium tracking-wide" style={{ color: '#0B1E3F' }}>
            Empowering educators. Elevating learning.
          </p>
        </div>

        {/* Login Card with Glassmorphism */}
        <div 
          className={`bg-white/90 dark:bg-[#0B1E3F]/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-[20px] p-10 transition-all duration-300 ${shake ? 'animate-shake' : ''}`}
          style={{ 
            boxShadow: '0 20px 60px rgba(11, 30, 63, 0.1)'
          }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
              Welcome to SkillStream
            </h2>
            <p className="text-base" style={{ color: '#6F73D2' }}>
              Share your knowledge. Inspire minds.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border" style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#dc2626'
            }}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Mail className={`h-5 w-5 transition-colors duration-200 ${
                    focusedField === 'email' || email ? 'text-[#00B5AD]' : 'text-gray-400'
                  }`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={`block w-full pl-12 pr-4 py-5 border-2 rounded-xl transition-all duration-200 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100' 
                      : 'border-gray-200 focus:border-[#00B5AD] focus:ring-4 focus:ring-[#00B5AD]/20'
                  } bg-white dark:bg-gray-800 text-[#0B1E3F] dark:text-white placeholder-transparent focus:outline-none`}
                  style={{ fontSize: '16px' }}
                />
                <label
                  htmlFor="email"
                  className={`absolute transition-all duration-200 pointer-events-none ${
                    email || focusedField === 'email'
                      ? 'left-4 top-2 text-xs font-semibold'
                      : 'left-12 top-5 text-base'
                  }`}
                  style={{
                    color: email || focusedField === 'email' ? '#00B5AD' : '#9CA3AF',
                    transform: email || focusedField === 'email' ? 'translateY(0)' : 'translateY(0)'
                  }}
                >
                  Email address
                </label>
              </div>
              {errors.email && (
                <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Lock className={`h-5 w-5 transition-colors duration-200 ${
                    focusedField === 'password' || password ? 'text-[#00B5AD]' : 'text-gray-400'
                  }`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`block w-full pl-12 pr-12 py-5 border-2 rounded-xl transition-all duration-200 ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100' 
                      : 'border-gray-200 focus:border-[#00B5AD] focus:ring-4 focus:ring-[#00B5AD]/20'
                  } bg-white dark:bg-gray-800 text-[#0B1E3F] dark:text-white placeholder-transparent focus:outline-none`}
                  style={{ fontSize: '16px' }}
                />
                <label
                  htmlFor="password"
                  className={`absolute transition-all duration-200 pointer-events-none ${
                    password || focusedField === 'password'
                      ? 'left-4 top-2 text-xs font-semibold'
                      : 'left-12 top-5 text-base'
                  }`}
                  style={{
                    color: password || focusedField === 'password' ? '#00B5AD' : '#9CA3AF',
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 hover:opacity-70 transition-opacity"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-[#00B5AD]"
                  style={{ accentColor: '#00B5AD' }}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm" style={{ color: '#0B1E3F' }}>
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium transition-colors hover:opacity-80"
                  style={{ color: '#6F73D2' }}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center px-6 py-5 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                style={{ 
                  backgroundColor: '#00B5AD',
                  boxShadow: isLoading ? 'none' : '0 4px 14px rgba(0, 181, 173, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#00968d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#00B5AD';
                  }
                }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-[#0B1E3F]" style={{ color: '#6F73D2' }}>
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ 
                  borderColor: '#E5E7EB',
                  color: '#0B1E3F',
                  backgroundColor: 'white'
                }}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ 
                  borderColor: '#E5E7EB',
                  color: '#0B1E3F',
                  backgroundColor: 'white'
                }}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="#0077B5">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: '#6F73D2' }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold transition-colors hover:opacity-80"
                style={{ color: '#00B5AD' }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs" style={{ color: '#6F73D2' }}>
          <div className="flex justify-center gap-6">
            <Link to="/privacy" className="hover:opacity-80 transition-opacity">Privacy Policy</Link>
            <Link to="/terms" className="hover:opacity-80 transition-opacity">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
