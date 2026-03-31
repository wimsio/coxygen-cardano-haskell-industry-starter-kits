-- Drop existing overly permissive storage policies
DROP POLICY IF EXISTS "Users can upload to their escrow folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their escrow documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Upload: only escrow participants
CREATE POLICY "Participants can upload escrow documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'escrow-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.escrows
      WHERE buyer_user_id = auth.uid() OR seller_user_id = auth.uid()
      OR buyer_address IN (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid())
      OR seller_address IN (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- View: only escrow participants
CREATE POLICY "Participants can view escrow documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'escrow-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.escrows
      WHERE buyer_user_id = auth.uid() OR seller_user_id = auth.uid()
      OR buyer_address IN (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid())
      OR seller_address IN (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Delete: only uploader who is participant
CREATE POLICY "Uploaders can delete own escrow documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'escrow-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text FROM public.escrows e
      JOIN public.escrow_attachments ea ON ea.escrow_id = e.id
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE ea.file_path = name
      AND ea.uploader_address = p.wallet_address
    )
  );