
ALTER TABLE public.escrows
ADD COLUMN pending_release_tx_cbor TEXT DEFAULT NULL,
ADD COLUMN pending_release_script_witness TEXT DEFAULT NULL,
ADD COLUMN pending_release_buyer_witness TEXT DEFAULT NULL;
