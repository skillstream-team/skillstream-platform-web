import { hasSupabaseConfig, supabase } from './supabase';

type TrackAnalyticsInput = {
  eventType: string;
  classId?: string | null;
  lessonId?: string | null;
  metadata?: Record<string, unknown>;
};

const inMemoryDedupe = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1_500;

export const trackAnalyticsEvent = (input: TrackAnalyticsInput) => {
  if (!hasSupabaseConfig) return;

  const eventType = input.eventType.trim();
  if (!eventType) return;

  const dedupeKey = `${eventType}:${input.classId || ''}:${input.lessonId || ''}`;
  const now = Date.now();
  const lastSeen = inMemoryDedupe.get(dedupeKey) || 0;
  if (now - lastSeen < DEDUPE_WINDOW_MS) return;
  inMemoryDedupe.set(dedupeKey, now);

  void supabase.functions
    .invoke('analytics-ingest', {
      body: {
        eventType,
        classId: input.classId || null,
        lessonId: input.lessonId || null,
        metadata: input.metadata || {},
      },
    })
    .catch(() => {
      // Analytics should never block user flows.
    });
};

