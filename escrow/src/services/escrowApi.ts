import { supabase } from '@/integrations/supabase/client';
import { isScriptDeployed } from './cardano/scriptRegistry';

interface CreateEscrowParams {
  buyer_address: string;
  seller_address: string;
  amount: number;
  deadline: string;
  description?: string;
  tx_hash: string;
  requires_multi_sig?: boolean;
  utxo_tx_hash?: string;
  utxo_output_index?: number;
  script_address?: string;
}

interface EscrowActionParams {
  escrow_id: string;
  tx_hash: string;
}

interface SignEscrowParams {
  escrow_id: string;
  signer_address: string;
}

export const escrowApi = {
  async createEscrow(params: CreateEscrowParams) {
    if (!isScriptDeployed()) {
      throw new Error('Escrow is not enabled on this network');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Insert escrow directly via Supabase client (bypasses old edge function)
    const { data: escrow, error } = await supabase
      .from('escrows')
      .insert({
        buyer_address: params.buyer_address,
        seller_address: params.seller_address,
        amount: params.amount,
        deadline: params.deadline,
        description: params.description,
        status: 'active',
        buyer_user_id: session.user.id,
        utxo_tx_hash: params.utxo_tx_hash,
        utxo_output_index: params.utxo_output_index,
        script_address: params.script_address,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Record the funding transaction
    const { data: transaction, error: txError } = await supabase
      .from('escrow_transactions')
      .insert({
        escrow_id: escrow.id,
        tx_type: 'funded' as const,
        tx_hash: params.tx_hash,
        from_address: params.buyer_address,
        to_address: params.script_address || null,
        amount: params.amount,
      })
      .select()
      .single();

    if (txError) console.error('Failed to record funding tx:', txError);

    return { escrow, transaction };
  },

  async releaseEscrow(params: EscrowActionParams) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data: escrow, error } = await supabase
      .from('escrows')
      .update({ status: 'completed' as const, on_chain_status: 'spent' })
      .eq('id', params.escrow_id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const { data: transaction } = await supabase
      .from('escrow_transactions')
      .insert({
        escrow_id: params.escrow_id,
        tx_type: 'released' as const,
        tx_hash: params.tx_hash,
        from_address: escrow.buyer_address,
        to_address: escrow.seller_address,
        amount: escrow.amount,
      })
      .select()
      .single();

    return { escrow, transaction };
  },

  async refundEscrow(params: EscrowActionParams) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data: escrow, error } = await supabase
      .from('escrows')
      .update({ status: 'refunded' as const, on_chain_status: 'spent' })
      .eq('id', params.escrow_id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const { data: transaction } = await supabase
      .from('escrow_transactions')
      .insert({
        escrow_id: params.escrow_id,
        tx_type: 'refunded' as const,
        tx_hash: params.tx_hash,
        from_address: escrow.seller_address,
        to_address: escrow.buyer_address,
        amount: escrow.amount,
      })
      .select()
      .single();

    return { escrow, transaction };
  },

  async signEscrow(params: SignEscrowParams) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Determine which field to update based on the signer
    const { data: escrow } = await supabase
      .from('escrows')
      .select('buyer_address, seller_address')
      .eq('id', params.escrow_id)
      .single();

    if (!escrow) throw new Error('Escrow not found');

    const updateField = params.signer_address === escrow.buyer_address
      ? { buyer_signed_at: new Date().toISOString() }
      : { seller_signed_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from('escrows')
      .update(updateField)
      .eq('id', params.escrow_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async getEscrows() {
    const { data, error } = await supabase
      .from('escrows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getEscrowById(id: string) {
    const { data, error } = await supabase
      .from('escrows')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getEscrowTransactions(escrowId: string) {
    const { data, error } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('escrow_id', escrowId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateProfileWallet(walletAddress: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({ wallet_address: walletAddress })
      .eq('user_id', user.id);

    if (error) throw error;
  },

  getScriptConfig() {
    return {
      isDeployed: isScriptDeployed(),
      type: 'native',
    };
  },
};
