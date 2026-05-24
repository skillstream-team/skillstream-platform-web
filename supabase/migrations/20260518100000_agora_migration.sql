-- lesson_live_configs: replace daily_room_url with agora fields
ALTER TABLE public.lesson_live_configs
  ADD COLUMN IF NOT EXISTS agora_channel_name TEXT,
  ADD COLUMN IF NOT EXISTS whiteboard_room_uuid TEXT;

ALTER TABLE public.lesson_live_configs
  DROP COLUMN IF EXISTS daily_room_url;

-- live_attendance_events: replace daily_session_id with agora_uid
ALTER TABLE public.live_attendance_events
  ADD COLUMN IF NOT EXISTS agora_uid TEXT;

ALTER TABLE public.live_attendance_events
  DROP COLUMN IF EXISTS daily_session_id;

-- recordings storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload recordings (guard against re-run)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'authenticated can upload recordings'
  ) THEN
    CREATE POLICY "authenticated can upload recordings"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'recordings');
  END IF;
END $$;

-- Allow public read of recordings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'recordings are public'
  ) THEN
    CREATE POLICY "recordings are public"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'recordings');
  END IF;
END $$;
