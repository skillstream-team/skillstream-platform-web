import { hasSupabaseConfig, supabase } from './supabase';
import { useAuthStore } from '../store/auth';

export type RuleInsight = {
  id: string;
  text: string;
  tone: 'info' | 'attention' | 'success';
};

export type RuleSummary = {
  summary: string;
  bullets: string[];
};

export type RuleTutorReply = {
  answer: string;
  tips: string[];
};

const asError = (fallback: string, error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
};

const isDemoUser = () => {
  const user = useAuthStore.getState().user;
  return Boolean(user?.id.startsWith('demo-') || user?.email.endsWith('@skillstream.demo'));
};

export const fetchAiInsights = async (): Promise<RuleInsight[]> => {
  if (!hasSupabaseConfig || isDemoUser()) {
    return [
      { id: 'demo-insight-1', text: 'Homework completion is trending up this week.', tone: 'success' },
      { id: 'demo-insight-2', text: 'One learner may need extra support in algebra.', tone: 'attention' },
      { id: 'demo-insight-3', text: 'Next lesson is ready to start from Schedule.', tone: 'info' },
    ];
  }
  const { data, error } = await supabase.functions.invoke('ai-insights', { body: {} });
  if (error) throw new Error(asError('Could not load assistant insights.', error));
  const insights = Array.isArray((data as { insights?: unknown[] })?.insights) ? (data as { insights: RuleInsight[] }).insights : [];
  return insights;
};

export const fetchAiSummary = async (classId?: string): Promise<RuleSummary> => {
  if (!hasSupabaseConfig || isDemoUser()) {
    return {
      summary: 'Demo summary: class activity is healthy with one learner needing follow-up.',
      bullets: [
        'Latest lesson is scheduled and ready.',
        'Average completion is around 70%.',
        'Review one pending assignment submission.',
      ],
    };
  }
  const { data, error } = await supabase.functions.invoke('ai-summarize', {
    body: { classId: classId || undefined },
  });
  if (error) throw new Error(asError('Could not generate summary.', error));
  const result = data as { summary?: string; bullets?: string[] };
  return {
    summary: result?.summary || 'No summary available.',
    bullets: Array.isArray(result?.bullets) ? result.bullets : [],
  };
};

export const askAiTutor = async (question: string, classId?: string): Promise<RuleTutorReply> => {
  if (!hasSupabaseConfig || isDemoUser()) {
    return {
      answer: `Demo tutor: for "${question}", start with one focused 25-minute study block, then recap key points.`,
      tips: ['Use one topic goal per session.', 'Write one question to ask in the next lesson.'],
    };
  }
  const { data, error } = await supabase.functions.invoke('ai-tutor', {
    body: {
      question,
      classId: classId || undefined,
    },
  });
  if (error) throw new Error(asError('Could not get tutor response.', error));
  const result = data as { answer?: string; tips?: string[] };
  return {
    answer: result?.answer || 'No answer available.',
    tips: Array.isArray(result?.tips) ? result.tips : [],
  };
};
