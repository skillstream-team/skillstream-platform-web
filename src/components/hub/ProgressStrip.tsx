import React from 'react';
import { TopicInsight } from '../../data/teacherHub';
import { cn } from '../../lib/utils';

const toneClasses: Record<TopicInsight['tone'], string> = {
  strong: 'bg-emerald-500',
  steady: 'bg-sky-500',
  attention: 'bg-amber-500',
};

export const ProgressStrip: React.FC<{ items: TopicInsight[] }> = ({ items }) => {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div key={item.topic} className="rounded-[22px] border border-[color:var(--hub-border)] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-[color:var(--hub-text)]">{item.topic}</h4>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{item.note}</p>
            </div>
            <span className="text-sm font-semibold text-[color:var(--hub-text)]">{item.mastery}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[color:var(--hub-soft)]">
            <div className={cn('h-2 rounded-full', toneClasses[item.tone])} style={{ width: `${item.mastery}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};
