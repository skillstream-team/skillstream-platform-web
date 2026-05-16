ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS student_theme TEXT NOT NULL DEFAULT 'navy';
