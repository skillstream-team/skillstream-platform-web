import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export function EduSection({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('edu-page', className)} {...props}>
      {children}
    </section>
  );
}

export function EduSectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-2">
        {eyebrow ? <p className="edu-kicker">{eyebrow}</p> : null}
        <h2 className="edu-title text-3xl font-bold text-[color:var(--edu-text)] sm:text-4xl">{title}</h2>
        {description ? <p className="edu-muted max-w-xl text-sm sm:text-base">{description}</p> : null}
      </div>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="edu-button-secondary w-fit">
          <span>{actionLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function EduMetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="edu-card">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(27,74,128,0.08)] text-[color:var(--edu-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium edu-muted">{label}</p>
      <p className="edu-stat-value mt-2">{value}</p>
      {hint ? <p className="mt-2 text-sm edu-muted">{hint}</p> : null}
    </div>
  );
}

export function EduActionCard({
  icon: Icon,
  title,
  description,
  to,
  tone = 'teal',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  tone?: 'teal' | 'gold' | 'navy';
}) {
  const toneMap = {
    teal: 'bg-[rgba(15,139,131,0.12)] text-[color:var(--edu-primary)]',
    gold: 'bg-[rgba(239,155,32,0.14)] text-[color:var(--edu-accent)]',
    navy: 'bg-[rgba(29,56,83,0.12)] text-[color:var(--edu-secondary)]',
  };

  return (
    <Link to={to} className="edu-card group flex h-full flex-col gap-4 transition-transform duration-200 hover:-translate-y-1">
      <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl', toneMap[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-[color:var(--edu-text)]">{title}</h3>
        <p className="text-sm edu-muted">{description}</p>
      </div>
      <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--edu-secondary)]">
        <span>Open</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export function EduEmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaTo,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
}) {
  return (
    <div className="edu-card flex flex-col items-start gap-4 text-left">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(29,56,83,0.08)] text-[color:var(--edu-secondary)]">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-[color:var(--edu-text)]">{title}</h3>
        <p className="max-w-md text-sm edu-muted">{description}</p>
      </div>
      {ctaLabel && ctaTo ? (
        <Link to={ctaTo} className="edu-button-primary w-fit">
          <span>{ctaLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
