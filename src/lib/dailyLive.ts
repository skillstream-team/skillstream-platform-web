export type LiveSessionMode = 'free' | 'paid';

export interface LessonLiveConfig {
  roomUrl: string;
  sessionMode: LiveSessionMode;
  ticketPriceGBP?: number;
  notes?: string;
}

const STORAGE_KEY = 'skillstream_daily_live_config_v1';

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getRootDomain = (): string => {
  const configured = (process.env.REACT_APP_DAILY_DEFAULT_DOMAIN || '').trim();
  return configured || '';
};

export const buildSuggestedRoomUrl = (classId: string, lessonId: string, lessonTitle: string): string => {
  const rootDomain = getRootDomain();
  if (!rootDomain) {
    return '';
  }
  const base = /^https?:\/\//.test(rootDomain) ? rootDomain : `https://${rootDomain}`;
  const classSlug = toSlug(classId);
  const lessonSlug = toSlug(lessonTitle || lessonId);
  return `${base.replace(/\/+$/, '')}/skillstream-${classSlug}-${lessonSlug}`.slice(0, 240);
};

const readAllConfigs = (): Record<string, LessonLiveConfig> => {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Record<string, LessonLiveConfig>;
  } catch {
    return {};
  }
};

const writeAllConfigs = (value: Record<string, LessonLiveConfig>) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const getLessonKey = (classId: string, lessonId: string) => `${classId}::${lessonId}`;

const normalizeConfig = (rawConfig: unknown): LessonLiveConfig | null => {
  if (!rawConfig || typeof rawConfig !== 'object' || !('roomUrl' in rawConfig)) {
    return null;
  }

  const source = rawConfig as {
    roomUrl: string;
    sessionMode?: string;
    accessType?: string;
    ticketPriceGBP?: number;
    notes?: string;
  };

  const legacyAccessType = typeof source.accessType === 'string' ? source.accessType : null;
  const normalizedMode: LiveSessionMode =
    source.sessionMode === 'paid' || legacyAccessType === 'e_ticket'
      ? 'paid'
      : 'free';
  const normalizedPrice = typeof source.ticketPriceGBP === 'number'
    ? source.ticketPriceGBP
    : normalizedMode === 'paid'
      ? 15
      : 0;

  return {
    roomUrl: source.roomUrl,
    sessionMode: normalizedMode,
    ticketPriceGBP: normalizedPrice,
    notes: typeof source.notes === 'string' ? source.notes : '',
  };
};

export const getLessonLiveConfig = (classId: string, lessonId: string): LessonLiveConfig | null => {
  const all = readAllConfigs();
  return normalizeConfig(all[getLessonKey(classId, lessonId)]);
};

export const saveLessonLiveConfig = (classId: string, lessonId: string, config: LessonLiveConfig) => {
  const all = readAllConfigs();
  all[getLessonKey(classId, lessonId)] = config;
  writeAllConfigs(all);
};

export const getDefaultLiveConfig = (classId: string, lessonId: string, lessonTitle: string): LessonLiveConfig => ({
  roomUrl: buildSuggestedRoomUrl(classId, lessonId, lessonTitle),
  sessionMode: 'free',
  ticketPriceGBP: 0,
  notes: '',
});
