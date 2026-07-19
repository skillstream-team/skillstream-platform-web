import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const DISMISSED_KEY = 'ss_ios_install_dismissed';

function shouldShow(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  // Exclude Chrome, Firefox, Facebook etc. on iOS — they can't install PWAs
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|fbios/i.test(ua);
  const isStandalone =
    'standalone' in window.navigator &&
    (window.navigator as { standalone?: boolean }).standalone === true;
  return isIos && isSafari && !isStandalone;
}

// iOS share arrow — matches the system icon shape
const ShareIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M9 1v10M9 1L5.5 4.5M9 1l3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1 11v5a1 1 0 001 1h14a1 1 0 001-1v-5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

export const IosInstallBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!shouldShow()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    const t = window.setTimeout(() => setVisible(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => setEntered(true), 16);
    return () => window.clearTimeout(t);
  }, [visible]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setEntered(false);
    window.setTimeout(() => setVisible(false), 250);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      className={cn(
        'fixed inset-x-4 bottom-20 z-50 rounded-[24px] border border-[color:var(--hub-border)] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.20)] transition-all duration-300',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* App icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[color:var(--hub-primary)]">
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
            <defs>
              <linearGradient id="ib" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22589a" />
                <stop offset="100%" stopColor="#1b4a80" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="url(#ib)" />
            <rect x="1" y="1" width="30" height="14" rx="6" fill="white" opacity="0.09" />
            <line x1="16" y1="7" x2="16" y2="25" stroke="white" strokeWidth="0.8" opacity="0.22" />
            <text x="9.5" y="22.5" fontFamily="Georgia, serif" fontSize="15" fontWeight="bold" fontStyle="italic" fill="white" textAnchor="middle">S</text>
            <text x="22.5" y="22.5" fontFamily="Georgia, serif" fontSize="15" fontWeight="bold" fontStyle="italic" fill="white" textAnchor="middle">S</text>
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-[color:var(--hub-text)]">Install SkillStream</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--hub-muted)]">
            Tap{' '}
            <span className="inline-flex items-center gap-0.5 rounded-md border border-[color:var(--hub-border)] px-1.5 py-0.5 text-[color:var(--hub-text)]">
              <ShareIcon />
            </span>
            {' '}then <strong className="font-semibold text-[color:var(--hub-text)]">Add to Home Screen</strong>
          </p>
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--hub-muted)] transition hover:bg-[color:var(--hub-soft)] hover:text-[color:var(--hub-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom pointer arrow */}
      <div className="flex justify-center pb-3">
        <div className="flex items-center gap-1.5 rounded-full bg-[color:var(--hub-soft)] px-3 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--hub-primary)]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">
            from Safari only
          </p>
        </div>
      </div>
    </div>
  );
};
