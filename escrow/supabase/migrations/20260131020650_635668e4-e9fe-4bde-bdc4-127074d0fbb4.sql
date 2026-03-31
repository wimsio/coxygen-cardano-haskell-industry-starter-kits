-- Fix RLS policies for escrow_messages to properly check participant access
-- The issue: we need to check if the user is a participant via their profile's wallet_address

DROP POLICY IF EXISTS "Users can view messages for their escrows" ON public.escrow_messages;
DROP POLICY IF EXISTS "Users can send messages to their escrows" ON public.escrow_messages;

-- View messages: user must be buyer or seller of the escrow
CREATE POLICY "Participants can view messages"
  ON public.escrow_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.escrows e
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE e.id = escrow_messages.escrow_id
      AND (e.buyer_address = p.wallet_address OR e.seller_address = p.wallet_address)
    )
  );

-- Send messages: user must be participant and sender_address must match their wallet
CREATE POLICY "Participants can send messages"
  ON public.escrow_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.escrows e
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE e.id = escrow_messages.escrow_id
      AND (e.buyer_address = p.wallet_address OR e.seller_address = p.wallet_address)
      AND sender_address = p.wallet_address
    )
  );

-- Fix RLS policies for escrow_attachments
DROP POLICY IF EXISTS "Users can view attachments for their escrows" ON public.escrow_attachments;
DROP POLICY IF EXISTS "Users can upload attachments to their escrows" ON public.escrow_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON public.escrow_attachments;

-- View attachments: user must be buyer or seller
CREATE POLICY "Participants can view attachments"
  ON public.escrow_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.escrows e
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE e.id = escrow_attachments.escrow_id
      AND (e.buyer_address = p.wallet_address OR e.seller_address = p.wallet_address)
    )
  );

-- Upload attachments: user must be participant and uploader must match their wallet
CREATE POLICY "Participants can upload attachments"
  ON public.escrow_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.escrows e
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE e.id = escrow_attachments.escrow_id
      AND (e.buyer_address = p.wallet_address OR e.seller_address = p.wallet_address)
      AND uploader_address = p.wallet_address
    )
  );

-- Delete attachments: user must have uploaded the attachment
CREATE POLICY "Users can delete own attachments"
  ON public.escrow_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.wallet_address = uploader_address
    )
  );