import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const calculateStrength = (pwd: string): { score: number; label: string; color: string; bgColor: string } => {
    if (!pwd) return { score: 0, label: '', color: '', bgColor: '' };

    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^a-zA-Z0-9]/.test(pwd),
    };

    if (checks.length) score++;
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    if (score <= 2) {
      return { score, label: 'Weak', color: '#dc2626', bgColor: '#dc2626' };
    } else if (score <= 3) {
      return { score, label: 'Fair', color: '#f59e0b', bgColor: '#f59e0b' };
    } else if (score <= 4) {
      return { score, label: 'Good', color: '#6F73D2', bgColor: '#6F73D2' };
    } else {
      return { score, label: 'Strong', color: '#00B5AD', bgColor: '#00B5AD' };
    }
  };

  const strength = calculateStrength(password);
  const percentage = (strength.score / 5) * 100;

  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[^a-zA-Z0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: '#6F73D2' }}>Password strength:</span>
        {strength.label && (
          <span className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</span>
        )}
      </div>
      <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
        <div
          className="h-full transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: strength.bgColor }}
        />
      </div>
      <div className="space-y-1.5 mt-3">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {check.met ? (
              <Check className="h-3.5 w-3.5" style={{ color: '#00B5AD' }} />
            ) : (
              <X className="h-3.5 w-3.5" style={{ color: '#9CA3AF' }} />
            )}
            <span style={{ color: check.met ? '#00B5AD' : '#6B7280' }}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

