-- Rename Agora-specific columns to provider-agnostic names
ALTER TABLE public.lesson_live_configs
  RENAME COLUMN agora_channel_name TO room_name;

ALTER TABLE public.lesson_live_configs
  DROP COLUMN IF EXISTS whiteboard_room_uuid;

ALTER TABLE public.live_attendance_events
  RENAME COLUMN agora_uid TO member_id;
