import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface SkillStreamLogoProps {
  to?: string;
  className?: string;
  compact?: boolean;
  light?: boolean;
  subtitle?: string;
  hideMark?: boolean;
}

export const SkillStreamLogo: React.FC<SkillStreamLogoProps> = ({
  to,
  className,
  compact = false,
  light = false,
  subtitle,
  hideMark = false,
}) => {
  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      {!hideMark ? (
        <div className="skillstream-mark" aria-hidden="true">
          <span>S</span>
          <span>S</span>
        </div>
      ) : null}
      <div className="min-w-0">
        <p className={cn('skillstream-wordmark', light && 'skillstream-wordmark-light', compact && 'text-[1.28rem]')}>
          <span className="skillstream-wordmark-accent">S</span>kill
          <span className="skillstream-wordmark-accent">S</span>tream
        </p>
        {subtitle ? (
          <p className={cn('text-xs font-medium tracking-[0.02em]', light ? 'text-white/70' : 'edu-muted')}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="shrink-0">
        {content}
      </Link>
    );
  }

  return content;
};
