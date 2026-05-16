export const STUDENT_THEMES = {
  navy:   { label: 'Navy',   light: '#1b4a80', dark: '#4493f8' },
  indigo: { label: 'Indigo', light: '#3730a3', dark: '#818cf8' },
  violet: { label: 'Violet', light: '#5b21b6', dark: '#a78bfa' },
  teal:   { label: 'Teal',   light: '#0f766e', dark: '#2dd4bf' },
  rose:   { label: 'Rose',   light: '#9f1239', dark: '#fb7185' },
  forest: { label: 'Forest', light: '#166534', dark: '#4ade80' },
} as const;

export type StudentThemeKey = keyof typeof STUDENT_THEMES;

export const resolveStudentTheme = (key: string, effectiveTheme: 'light' | 'dark'): string => {
  const entry = STUDENT_THEMES[key as StudentThemeKey] ?? STUDENT_THEMES.navy;
  return effectiveTheme === 'dark' ? entry.dark : entry.light;
};
