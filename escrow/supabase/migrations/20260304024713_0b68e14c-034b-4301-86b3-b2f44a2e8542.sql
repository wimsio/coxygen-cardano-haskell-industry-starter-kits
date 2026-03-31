
CREATE POLICY "Seller can update escrow for co-sign"
ON public.escrows
FOR UPDATE
TO authenticated
USING (auth.uid() = seller_user_id)
WITH CHECK (auth.uid() = seller_user_id);
