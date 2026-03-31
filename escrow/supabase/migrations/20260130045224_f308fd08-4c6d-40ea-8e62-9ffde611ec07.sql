-- =====================
-- MESSAGING SYSTEM
-- =====================

-- Create escrow_messages table for in-app messaging
CREATE TABLE public.escrow_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escrow_id UUID NOT NULL REFERENCES public.escrows(id) ON DELETE CASCADE,
  sender_address TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.escrow_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for escrows they're part of
CREATE POLICY "Users can view messages for their escrows"
  ON public.escrow_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.escrows e
      WHERE e.id = escrow_messages.escrow_id
      AND (e.buyer_address = sender_address OR e.seller_address = sender_address)
    )
  );

-- Users can send messages to escrows they're part of
CREATE POLICY "Users can send messages to their escrows"
  ON public.escrow_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.escrows e
      WHERE e.id = escrow_messages.escrow_id
      AND (e.buyer_address = sender_address OR e.seller_address = sender_address)
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_messages;

-- =====================
-- DOCUMENT ATTACHMENTS
-- =====================

-- Create escrow_attachments table
CREATE TABLE public.escrow_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escrow_id UUID NOT NULL REFERENCES public.escrows(id) ON DELETE CASCADE,
  uploader_address TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.escrow_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments for escrows they're part of
CREATE POLICY "Users can view attachments for their escrows"
  ON public.escrow_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.escrows e
      WHERE e.id = escrow_attachments.escrow_id
      AND (e.buyer_address = uploader_address OR e.seller_address = uploader_address)
    )
  );

-- Users can upload attachments to escrows they're part of
CREATE POLICY "Users can upload attachments to their escrows"
  ON public.escrow_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.escrows e
      WHERE e.id = escrow_attachments.escrow_id
      AND (e.buyer_address = uploader_address OR e.seller_address = uploader_address)
    )
  );

-- Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
  ON public.escrow_attachments FOR DELETE
  USING (
    uploader_address IN (
      SELECT buyer_address FROM public.escrows WHERE id = escrow_attachments.escrow_id
      UNION
      SELECT seller_address FROM public.escrows WHERE id = escrow_attachments.escrow_id
    )
  );

-- =====================
-- STORAGE BUCKET FOR ATTACHMENTS
-- =====================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('escrow-documents', 'escrow-documents', false, 10485760); -- 10MB limit

-- Storage policies
CREATE POLICY "Users can upload to their escrow folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'escrow-documents' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view their escrow documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'escrow-documents'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'escrow-documents'
    AND auth.uid() IS NOT NULL
  );

-- =====================
-- ANALYTICS: Add read tracking
-- =====================

-- Add view count to escrows (for basic analytics)
ALTER TABLE public.escrows 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;