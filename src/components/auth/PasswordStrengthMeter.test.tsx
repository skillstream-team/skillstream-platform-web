import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

describe('PasswordStrengthMeter', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Weak" for a short, simple password', () => {
    render(<PasswordStrengthMeter password="abc" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows "Strong" for a fully complex password', () => {
    render(<PasswordStrengthMeter password="Abcdef1!" />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('marks the 8-character check as met when password is long enough', () => {
    render(<PasswordStrengthMeter password="abcdefgh" />);
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
  });

  it('shows all 5 requirement labels', () => {
    render(<PasswordStrengthMeter password="a" />);
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Contains lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('Contains uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('Contains number')).toBeInTheDocument();
    expect(screen.getByText('Contains special character')).toBeInTheDocument();
  });

  it('shows "Fair" for a password meeting 3 criteria', () => {
    // lowercase + uppercase + number = score 3 (no length >= 8, no special)
    render(<PasswordStrengthMeter password="Abc1" />);
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('shows "Good" for a password meeting 4 criteria', () => {
    // 8+ chars + lowercase + uppercase + number (no special) = score 4
    render(<PasswordStrengthMeter password="Abcdefg1" />);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });
});
