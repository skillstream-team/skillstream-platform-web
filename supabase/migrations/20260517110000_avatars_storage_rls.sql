-- Storage RLS for the avatars bucket.
--
-- The bucket is public-read so avatar URLs work without a token (standard for
-- profile photos — URLs contain user UUIDs which are not guessable).
-- Write access is locked to the file owner only.

-- Enable RLS on storage.objects if not already on (Supabase enables it by default).

-- Each user may only upload/overwrite/delete the file named after their own UUID.
-- File path inside the bucket is simply: {user_uuid}  (no folder, no extension).

CREATE POLICY "Avatar: owner can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = auth.uid()::text
  );

CREATE POLICY "Avatar: owner can update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name = auth.uid()::text
  );

CREATE POLICY "Avatar: owner can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name = auth.uid()::text
  );

-- Public read is handled by the bucket's public flag set in the dashboard.
-- No SELECT policy is needed for public buckets; Supabase bypasses RLS for reads.
