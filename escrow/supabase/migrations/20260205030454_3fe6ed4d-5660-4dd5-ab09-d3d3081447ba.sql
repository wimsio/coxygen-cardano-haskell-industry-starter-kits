-- Add multi-signature support columns to escrows table
ALTER TABLE public.escrows 
ADD COLUMN IF NOT EXISTS buyer_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS seller_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requires_multi_sig BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS on_chain_status TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS utxo_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS utxo_output_index INTEGER;

-- Add index for syncing queries
CREATE INDEX IF NOT EXISTS idx_escrows_sync ON public.escrows (status, last_synced_at) WHERE status = 'active';

-- Add index for UTxO lookups
CREATE INDEX IF NOT EXISTS idx_escrows_utxo ON public.escrows (utxo_tx_hash, utxo_output_index) WHERE utxo_tx_hash IS NOT NULL;