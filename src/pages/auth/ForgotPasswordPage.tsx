import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      await apiService.requestPasswordReset(email);
      setStatus('success');
      setMessage('If an account exists for this email, a reset link has been sent.');
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again in a few minutes.');
    } finally {
      setStatus(prev => (prev === 'submitting' ? 'idle' : prev));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F4F7FA]">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8">
        <div>
          <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to login
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the email associated with your account and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-md text-sm ${
              status === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00B5AD] hover:bg-[#009b94] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00B5AD] disabled:opacity-60"
          >
            {status === 'submitting' ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
};


