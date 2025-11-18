import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, GraduationCap, BookOpen, Briefcase, Building2, Check } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';
import { ThemeToggle } from '../../components/auth/ThemeToggle';

type Role = 'TEACHER' | 'EXPERT' | 'STUDENT' | 'ORGANIZATION';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as Role | '',
    organization: '',
    expertise: '',
    yearsExperience: '',
    bio: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (!formData.role) {
      setErrors({ role: 'Please select a role' });
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.role === 'TEACHER' || formData.role === 'EXPERT') {
      if (!formData.expertise.trim()) {
        newErrors.expertise = 'Expertise area is required';
      }
      if (!formData.yearsExperience) {
        newErrors.yearsExperience = 'Years of experience is required';
      }
    }
    
    if (formData.role === 'ORGANIZATION') {
      if (!formData.organization.trim()) {
        newErrors.organization = 'Organization name is required';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setErrors({});
    } else if (step === 2 && validateStep2()) {
      if (formData.role === 'STUDENT') {
        handleSubmit();
      } else {
        setStep(3);
        setErrors({});
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (step === 3 && !validateStep3()) {
      return;
    }

    clearError();

    try {
      await register(
        formData.name, 
        formData.email, 
        formData.password, 
        formData.role as 'STUDENT' | 'TEACHER'
      );
      navigate('/dashboard');
    } catch (error) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const roles = [
    { id: 'TEACHER' as Role, label: 'Teacher', icon: GraduationCap, description: 'Share your knowledge and teach students' },
    { id: 'EXPERT' as Role, label: 'Expert', icon: Briefcase, description: 'Offer specialized expertise and consulting' },
    { id: 'STUDENT' as Role, label: 'Student', icon: BookOpen, description: 'Learn from top educators and experts' },
    { id: 'ORGANIZATION' as Role, label: 'Organization', icon: Building2, description: 'Train your team with our platform' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: '#F4F7FA' }}>
      <ThemeToggle />
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]">
        <div className="absolute top-[10%] left-[8%]"><BookOpen className="h-4 w-4" style={{ color: '#00B5AD' }} /></div>
        <div className="absolute top-[15%] left-[25%]"><GraduationCap className="h-3 w-3" style={{ color: '#6F73D2' }} /></div>
        <div className="absolute top-[20%] left-[45%]"><Briefcase className="h-4 w-4" style={{ color: '#9A8CFF' }} /></div>
        <div className="absolute top-[12%] left-[65%]"><Building2 className="h-3 w-3" style={{ color: '#00B5AD' }} /></div>
        <div className="absolute top-[18%] left-[85%]"><BookOpen className="h-4 w-4" style={{ color: '#6F73D2' }} /></div>
        <div className="absolute top-[30%] right-[12%]"><GraduationCap className="h-3 w-3" style={{ color: '#9A8CFF' }} /></div>
        <div className="absolute top-[35%] right-[30%]"><Briefcase className="h-4 w-4" style={{ color: '#00B5AD' }} /></div>
        <div className="absolute top-[40%] right-[50%]"><Building2 className="h-3 w-3" style={{ color: '#6F73D2' }} /></div>
        <div className="absolute top-[50%] left-[15%]"><BookOpen className="h-4 w-4" style={{ color: '#9A8CFF' }} /></div>
        <div className="absolute top-[55%] left-[35%]"><GraduationCap className="h-3 w-3" style={{ color: '#00B5AD' }} /></div>
        <div className="absolute top-[60%] left-[55%]"><Briefcase className="h-4 w-4" style={{ color: '#6F73D2' }} /></div>
        <div className="absolute top-[70%] right-[20%]"><Building2 className="h-3 w-3" style={{ color: '#9A8CFF' }} /></div>
        <div className="absolute top-[75%] right-[40%]"><BookOpen className="h-4 w-4" style={{ color: '#00B5AD' }} /></div>
        <div className="absolute top-[80%] right-[60%]"><GraduationCap className="h-3 w-3" style={{ color: '#6F73D2' }} /></div>
        <div className="absolute top-[85%] left-[25%]"><Briefcase className="h-4 w-4" style={{ color: '#9A8CFF' }} /></div>
      </div>

      {/* Gradient Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: 'linear-gradient(135deg, #9A8CFF 0%, #6F73D2 100%)' }}></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
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

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      step >= s
                        ? 'text-white'
                        : 'text-gray-400 border-2 border-gray-300'
                    }`}
                    style={{
                      backgroundColor: step >= s ? (step === s ? '#00B5AD' : '#6F73D2') : 'transparent',
                    }}
                  >
                    {step > s ? <Check className="h-5 w-5" /> : s}
                  </div>
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 transition-all duration-300 ${
                      step > s ? 'bg-[#6F73D2]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium" style={{ color: '#6F73D2' }}>
            <span className={step >= 1 ? 'opacity-100' : 'opacity-50'}>Basic Info</span>
            <span className={step >= 2 ? 'opacity-100' : 'opacity-50'}>Role</span>
            <span className={step >= 3 ? 'opacity-100' : 'opacity-50'}>Details</span>
          </div>
        </div>

        {/* Registration Card */}
        <div 
          className={`bg-white/90 dark:bg-[#0B1E3F]/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-[20px] p-10 transition-all duration-300 ${shake ? 'animate-shake' : ''}`}
          style={{ 
            boxShadow: '0 20px 60px rgba(11, 30, 63, 0.1)'
          }}
        >
          {error && (
            <div className="mb-6 p-4 rounded-xl border" style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#dc2626'
            }}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
                  Create your account
                </h2>
                <p className="text-base" style={{ color: '#6F73D2' }}>
                  Let's start with your basic information
                </p>
              </div>

              <div className="space-y-5">
                {/* Name Input */}
                <div className="relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <User className={`h-5 w-5 transition-colors duration-200 ${
                        focusedField === 'name' || formData.name ? 'text-[#00B5AD]' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className={`block w-full pl-12 pr-4 py-5 border-2 rounded-xl transition-all duration-200 ${
                        errors.name 
                          ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-[#00B5AD] focus:ring-4 focus:ring-[#00B5AD]/20'
                      } bg-white dark:bg-gray-800 text-[#0B1E3F] dark:text-white placeholder-transparent focus:outline-none`}
                      style={{ fontSize: '16px' }}
                    />
                    <label
                      htmlFor="name"
                      className={`absolute transition-all duration-200 pointer-events-none ${
                        formData.name || focusedField === 'name'
                          ? 'left-4 top-2 text-xs font-semibold'
                          : 'left-12 top-5 text-base'
                      }`}
                      style={{
                        color: formData.name || focusedField === 'name' ? '#00B5AD' : '#9CA3AF',
                      }}
                    >
                      Full name
                    </label>
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>{errors.name}</p>
                  )}
                </div>

                {/* Email Input */}
                <div className="relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Mail className={`h-5 w-5 transition-colors duration-200 ${
                        focusedField === 'email' || formData.email ? 'text-[#00B5AD]' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
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
                        formData.email || focusedField === 'email'
                          ? 'left-4 top-2 text-xs font-semibold'
                          : 'left-12 top-5 text-base'
                      }`}
                      style={{
                        color: formData.email || focusedField === 'email' ? '#00B5AD' : '#9CA3AF',
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
                        focusedField === 'password' || formData.password ? 'text-[#00B5AD]' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
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
                        formData.password || focusedField === 'password'
                          ? 'left-4 top-2 text-xs font-semibold'
                          : 'left-12 top-5 text-base'
                      }`}
                      style={{
                        color: formData.password || focusedField === 'password' ? '#00B5AD' : '#9CA3AF',
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
                  <PasswordStrengthMeter password={formData.password} />
                  {errors.password && (
                    <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Lock className={`h-5 w-5 transition-colors duration-200 ${
                        focusedField === 'confirmPassword' || formData.confirmPassword ? 'text-[#00B5AD]' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      className={`block w-full pl-12 pr-12 py-5 border-2 rounded-xl transition-all duration-200 ${
                        errors.confirmPassword 
                          ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-[#00B5AD] focus:ring-4 focus:ring-[#00B5AD]/20'
                      } bg-white dark:bg-gray-800 text-[#0B1E3F] dark:text-white placeholder-transparent focus:outline-none`}
                      style={{ fontSize: '16px' }}
                    />
                    <label
                      htmlFor="confirmPassword"
                      className={`absolute transition-all duration-200 pointer-events-none ${
                        formData.confirmPassword || focusedField === 'confirmPassword'
                          ? 'left-4 top-2 text-xs font-semibold'
                          : 'left-12 top-5 text-base'
                      }`}
                      style={{
                        color: formData.confirmPassword || focusedField === 'confirmPassword' ? '#00B5AD' : '#9CA3AF',
                      }}
                    >
                      Confirm Password
                    </label>
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 hover:opacity-70 transition-opacity"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center px-8 py-5 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                  style={{ 
                    backgroundColor: '#00B5AD',
                    boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#00968d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#00B5AD';
                  }}
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Role Selection */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
                  Choose your role
                </h2>
                <p className="text-base" style={{ color: '#6F73D2' }}>
                  Select the role that best describes you
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, role: role.id }));
                        setErrors({});
                      }}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1 ${
                        isSelected
                          ? 'border-[#00B5AD] shadow-lg scale-105'
                          : 'border-gray-200 hover:border-[#6F73D2]'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'rgba(0, 181, 173, 0.05)' : 'white'
                      }}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                        isSelected ? 'bg-[#00B5AD]' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <h3 className="font-bold text-lg mb-1" style={{ color: '#0B1E3F' }}>
                        {role.label}
                      </h3>
                      <p className="text-sm" style={{ color: '#6F73D2' }}>
                        {role.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {errors.role && (
                <p className="text-sm text-center" style={{ color: '#dc2626' }}>{errors.role}</p>
              )}

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center px-6 py-5 border-2 rounded-xl font-semibold transition-all duration-200 hover:shadow-md"
                  style={{ 
                    borderColor: '#E5E7EB',
                    color: '#0B1E3F',
                    backgroundColor: 'white'
                  }}
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center px-8 py-5 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                  style={{ 
                    backgroundColor: '#00B5AD',
                    boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#00968d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#00B5AD';
                  }}
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Professional Details */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
                  Professional details
                </h2>
                <p className="text-base" style={{ color: '#6F73D2' }}>
                  Tell us more about your professional background
                </p>
              </div>

              <div className="space-y-5">
                {(formData.role === 'TEACHER' || formData.role === 'EXPERT') && (
                  <>
                    <div className="relative">
                      <label htmlFor="expertise" className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                        Area of Expertise
                      </label>
                      <input
                        id="expertise"
                        name="expertise"
                        type="text"
                        value={formData.expertise}
                        onChange={handleInputChange}
                        placeholder="e.g., Mathematics, Science, Business"
                        className={`block w-full px-4 py-4 border-2 rounded-xl transition-all duration-200 ${
                          errors.expertise 
                            ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-[#00B5AD] focus:ring-4 focus:ring-[#00B5AD]/20'
                        } bg-white dark:bg-gray-800 text-[#0B1E3F] dark:text-white focus:outline-none`}
                        style={{ fontSize: '16px' }}
                      />
                      {errors.expertise && (
                        <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>{errors.expertise}</p>
                      )}
                    </div>

                    <div className="relative">
                      <label htmlFor="yearsExperience" className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                        Years of Experience
                      </label>
                      <input
                        id="yearsExperience"
                        name="yearsExperience"
                        type="number"
                        min="0"
                        value={formData.yearsExperience}
                        onChange={handleInputChange}
                        placeholder="e.g., 5"
                        className={`block w-full px-4 py-4 border-2 rounded-xl transition-all duration-200 ${
                          errors.yearsExperience 
                            ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-[#00B5AD] focus:ring-4 focus:ring-[#00B5AD]/20'
                        } bg-white dark:bg-gray-800 text-[#0B1E3F] dark:text-white focus:outline-none`}
                        style={{ fontSize: '16px' }}
                      />
                      {errors.yearsExperience && (
                        <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>{errors.yearsExperience}</p>
                      )}
                    </div>
                  </>
                )}

                {formData.role === 'ORGANIZATION' && (
                  <div className="relative">
                    <label htmlFor="organization" className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                      Organization Name
                    </label>
                    <input
                      id="organization"
                      name="organization"
                      type="text"
                      value={formData.organization}
                      onChange={handleInputChange}
                      placeholder="Enter your organization name"
                      className={`block w-full px-4 py-4 border-2 rounded-xl transition-all duration-200 ${
                        errors.organization 
                          ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-[#00B5AD] focus:ring-4 focus:ring-[#00B5AD]/20'
                      } bg-white dark:bg-gray-800 text-[#0B1E3F] dark:text-white focus:outline-none`}
                      style={{ fontSize: '16px' }}
                    />
                    {errors.organization && (
                      <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>{errors.organization}</p>
                    )}
                  </div>
                )}

                <div className="relative">
                  <label htmlFor="bio" className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                    Bio (Optional)
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    className="block w-full px-4 py-4 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:border-[#00B5AD] focus:ring-4 focus:ring-[#00B5AD]/20 bg-white dark:bg-gray-800 text-[#0B1E3F] dark:text-white focus:outline-none resize-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center px-6 py-5 border-2 rounded-xl font-semibold transition-all duration-200 hover:shadow-md"
                  style={{ 
                    borderColor: '#E5E7EB',
                    color: '#0B1E3F',
                    backgroundColor: 'white'
                  }}
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center px-8 py-5 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
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
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs" style={{ color: '#6F73D2' }}>
          <div className="flex justify-center gap-6 mb-4">
            <Link to="/privacy" className="hover:opacity-80 transition-opacity">Privacy Policy</Link>
            <Link to="/terms" className="hover:opacity-80 transition-opacity">Terms of Service</Link>
          </div>
          <p>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: '#00B5AD' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
