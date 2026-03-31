import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Safe error messages - never expose internal details
const SAFE_ERRORS = {
  UNAUTHORIZED: "Unauthorized",
  MISSING_FIELDS: "Missing required fields",
  INVALID_AMOUNT: "Amount must be between 10 and 1,000,000 ADA",
  INVALID_DEADLINE: "Deadline must be in the future (within 1 year)",
  INVALID_ADDRESS: "Invalid Cardano address format",
  INVALID_TX_HASH: "Invalid transaction hash format",
  DESCRIPTION_TOO_LONG: "Description must be less than 500 characters",
  ESCROW_NOT_FOUND: "Escrow not found",
  NOT_PARTICIPANT: "You are not a participant in this escrow",
  ONLY_BUYER_RELEASE: "Only the buyer can release funds to the seller",
  ONLY_BUYER_REFUND: "Only the buyer can request a refund",
  ESCROW_NOT_ACTIVE: "Escrow is not active",
  REFUND_DEADLINE_NOT_PASSED: "Cannot refund before deadline has passed",
  INVALID_ACTION: "Invalid action",
  SERVER_ERROR: "An error occurred. Please try again.",
  DUPLICATE_ESCROW: "An escrow with these details already exists",
  INVALID_REFERENCE: "Invalid reference data",
   MULTI_SIG_REQUIRED: "Both buyer and seller must sign to release funds",
    ALREADY_SIGNED: "You have already signed this escrow",
    DUPLICATE_TX_HASH: "Transaction hash has already been processed",
    INVALID_JSON: "Invalid JSON payload",
};

function jsonResponse(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Validation helpers
function isValidCardanoAddress(address: string): boolean {
  // Bech32 address validation for Cardano (addr or addr_test prefix)
  const bech32Pattern = /^(addr1|addr_test1)[a-z0-9]{53,}$/i;
  // Hex-encoded address validation (56+ characters, hex only)
  const hexPattern = /^[a-fA-F0-9]{56,}$/;
  return bech32Pattern.test(address) || hexPattern.test(address);
}

function isValidTxHash(hash: string): boolean {
  // Cardano tx hash is 64 hex characters
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

function isValidDeadline(deadline: string): { valid: boolean; date?: Date } {
  const date = new Date(deadline);
  if (isNaN(date.getTime())) return { valid: false };
  
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  
  return { 
    valid: date > oneHourFromNow && date <= oneYearFromNow,
    date 
  };
}

function isValidAmount(amount: number): boolean {
  // Amount in lovelace: 10 ADA = 10,000,000 lovelace, 1M ADA = 1,000,000,000,000 lovelace
  const minAmount = 10_000_000; // 10 ADA
  const maxAmount = 1_000_000_000_000; // 1M ADA
  return Number.isInteger(amount) && amount >= minAmount && amount <= maxAmount;
}

function sanitizeDbError(error: { code?: string; message?: string }): string {
  // Map database error codes to safe messages
  if (error.code === '23505') return SAFE_ERRORS.DUPLICATE_ESCROW;
  if (error.code === '23503') return SAFE_ERRORS.INVALID_REFERENCE;
  return SAFE_ERRORS.SERVER_ERROR;
}

interface CreateEscrowRequest {
  action: "create";
  buyer_address: string;
  seller_address: string;
  amount: number;
  deadline: string;
  description?: string;
  tx_hash: string;
  requires_multi_sig?: boolean;
  utxo_tx_hash?: string;
  utxo_output_index?: number;
}

interface UpdateEscrowRequest {
  action: "release" | "refund";
  escrow_id: string;
  tx_hash: string;
}

 interface SignEscrowRequest {
   action: "sign";
   escrow_id: string;
   signer_address: string;
 }
 
 interface GetMultiSigStatusRequest {
   action: "get_multisig_status";
   escrow_id: string;
 }
 
 type EscrowRequest = CreateEscrowRequest | UpdateEscrowRequest | SignEscrowRequest | GetMultiSigStatusRequest;

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(401, { error: SAFE_ERRORS.UNAUTHORIZED, code: 'UNAUTHORIZED' });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData?.user) {
      return jsonResponse(401, { error: SAFE_ERRORS.UNAUTHORIZED, code: 'UNAUTHORIZED' });
    }

    const userId = authData.user.id;
    let body: EscrowRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(400, { error: SAFE_ERRORS.INVALID_JSON, code: 'INVALID_JSON' });
    }

    if (body.action === "create") {
       const { buyer_address, seller_address, amount, deadline, description, tx_hash, requires_multi_sig, utxo_tx_hash, utxo_output_index } = body as CreateEscrowRequest;

      // Validate required fields exist
      if (!buyer_address || !seller_address || !amount || !deadline || !tx_hash) {
        return jsonResponse(400, { error: SAFE_ERRORS.MISSING_FIELDS, code: 'MISSING_FIELDS' });
      }

      // Validate Cardano addresses
      if (!isValidCardanoAddress(buyer_address) || !isValidCardanoAddress(seller_address)) {
        return new Response(
          JSON.stringify({ error: SAFE_ERRORS.INVALID_ADDRESS }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate amount range
      if (!isValidAmount(amount)) {
        return new Response(
          JSON.stringify({ error: SAFE_ERRORS.INVALID_AMOUNT }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate deadline
      const deadlineValidation = isValidDeadline(deadline);
      if (!deadlineValidation.valid) {
        return new Response(
          JSON.stringify({ error: SAFE_ERRORS.INVALID_DEADLINE }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate tx_hash format
      if (!isValidTxHash(tx_hash)) {
        return jsonResponse(400, { error: SAFE_ERRORS.INVALID_TX_HASH, code: 'INVALID_TX_HASH' });
      }

      const { data: duplicateTx } = await supabase
        .from('escrow_transactions')
        .select('id')
        .eq('tx_hash', tx_hash)
        .limit(1)
        .maybeSingle();

      if (duplicateTx) {
        return jsonResponse(409, { error: SAFE_ERRORS.DUPLICATE_TX_HASH, code: 'DUPLICATE_TX_HASH' });
      }

      // Validate description length
      if (description && description.length > 500) {
        return new Response(
          JSON.stringify({ error: SAFE_ERRORS.DESCRIPTION_TOO_LONG }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert escrow
      const { data: escrow, error: escrowError } = await supabase
        .from("escrows")
        .insert({
          buyer_address,
          seller_address,
          amount,
          deadline,
          description: description?.substring(0, 500),
          buyer_user_id: userId,
          status: "active",
          requires_multi_sig: requires_multi_sig || false,
          utxo_tx_hash: utxo_tx_hash || null,
          utxo_output_index: utxo_output_index ?? null,
        })
        .select()
        .single();

      if (escrowError) {
        console.error("Escrow creation error:", escrowError);
        return new Response(
          JSON.stringify({ error: sanitizeDbError(escrowError) }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert funding transaction
      const { data: transaction, error: txError } = await supabase
        .from("escrow_transactions")
        .insert({
          escrow_id: escrow.id,
          tx_type: "funded",
          tx_hash,
          from_address: buyer_address,
          amount,
        })
        .select()
        .single();

      if (txError) {
        console.error("Transaction creation error:", txError);
        // Don't fail the whole request, escrow was created
      }

      return new Response(
        JSON.stringify({ escrow, transaction }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action === "release" || body.action === "refund") {
      const { escrow_id, tx_hash } = body as UpdateEscrowRequest;
      
      console.log(`[${body.action.toUpperCase()}] Processing escrow_id: ${escrow_id}, userId: ${userId}`);

      if (!escrow_id || !tx_hash) {
        console.error(`[${body.action.toUpperCase()}] Missing fields: escrow_id=${escrow_id}, tx_hash=${tx_hash}`);
        return jsonResponse(400, { error: SAFE_ERRORS.MISSING_FIELDS, code: 'MISSING_FIELDS' });
      }

      // Validate tx_hash format
      if (!isValidTxHash(tx_hash)) {
        console.error(`[${body.action.toUpperCase()}] Invalid tx_hash format: ${tx_hash}`);
        return jsonResponse(400, { error: SAFE_ERRORS.INVALID_TX_HASH, code: 'INVALID_TX_HASH' });
      }

      const { data: duplicateTx } = await supabase
        .from('escrow_transactions')
        .select('id')
        .eq('tx_hash', tx_hash)
        .limit(1)
        .maybeSingle();

      if (duplicateTx) {
        return jsonResponse(409, { error: SAFE_ERRORS.DUPLICATE_TX_HASH, code: 'DUPLICATE_TX_HASH' });
      }

      // Get escrow
      const { data: escrow, error: fetchError } = await supabase
        .from("escrows")
        .select("*")
        .eq("id", escrow_id)
        .single();

      if (fetchError) {
        console.error(`[${body.action.toUpperCase()}] Escrow fetch error:`, fetchError);
      }
      
      if (fetchError || !escrow) {
        console.error(`[${body.action.toUpperCase()}] Escrow not found or fetch error`);
        return new Response(
          JSON.stringify({ error: SAFE_ERRORS.ESCROW_NOT_FOUND }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user is the buyer (only buyer can release or refund)
      // This is intentional - in a blockchain escrow, the buyer holds the power
      // to release funds to seller or reclaim after deadline
      const isBuyer = escrow.buyer_user_id === userId;
      console.log(`[${body.action.toUpperCase()}] Buyer check: escrow.buyer_user_id=${escrow.buyer_user_id}, userId=${userId}, isBuyer=${isBuyer}`);
      
      if (!isBuyer) {
        const errorMessage = body.action === "release" 
          ? SAFE_ERRORS.ONLY_BUYER_RELEASE 
          : SAFE_ERRORS.ONLY_BUYER_REFUND;
        console.error(`[${body.action.toUpperCase()}] User is not buyer: ${errorMessage}`);
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (escrow.status !== "active") {
        console.error(`[${body.action.toUpperCase()}] Escrow not active, status: ${escrow.status}`);
        return new Response(
          JSON.stringify({ error: SAFE_ERRORS.ESCROW_NOT_ACTIVE }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For refund, check deadline has passed
      if (body.action === "refund") {
        const now = new Date();
        const deadline = new Date(escrow.deadline);
        console.log(`[REFUND] Deadline check: now=${now.toISOString()}, deadline=${deadline.toISOString()}, passed=${now >= deadline}`);
        if (now < deadline) {
          console.error(`[REFUND] Deadline has not passed yet`);
          return new Response(
            JSON.stringify({ error: SAFE_ERRORS.REFUND_DEADLINE_NOT_PASSED }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
        }
      }
       
       // For multi-sig release, check both parties have signed
       if (body.action === "release" && escrow.requires_multi_sig) {
         console.log(`[RELEASE] Multi-sig check: requires_multi_sig=${escrow.requires_multi_sig}, buyer_signed_at=${escrow.buyer_signed_at}, seller_signed_at=${escrow.seller_signed_at}`);
         if (!escrow.buyer_signed_at || !escrow.seller_signed_at) {
           console.error(`[RELEASE] Multi-sig not complete`);
           return new Response(
             JSON.stringify({ error: SAFE_ERRORS.MULTI_SIG_REQUIRED }),
             { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
           );
         }
       }

      const newStatus = body.action === "release" ? "completed" : "refunded";
      const txType = body.action === "release" ? "released" : "refunded";
      const toAddress = body.action === "release" ? escrow.seller_address : escrow.buyer_address;
      
      console.log(`[${body.action.toUpperCase()}] Updating escrow status to: ${newStatus}`);

      // Update escrow status
      const { data: updatedEscrow, error: updateError } = await supabase
        .from("escrows")
        .update({ status: newStatus })
        .eq("id", escrow_id)
        .select()
        .single();

      if (updateError) {
        console.error(`[${body.action.toUpperCase()}] Escrow update error:`, updateError);
        return new Response(
          JSON.stringify({ error: sanitizeDbError(updateError) }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log(`[${body.action.toUpperCase()}] Escrow status updated successfully`);

      // Insert transaction
      const { data: transaction, error: txError } = await supabase
        .from("escrow_transactions")
        .insert({
          escrow_id,
          tx_type: txType,
          tx_hash,
          from_address: escrow.buyer_address,
          to_address: toAddress,
          amount: escrow.amount,
        })
        .select()
        .single();

      if (txError) {
        console.error("Transaction insert error:", txError);
      }

      return new Response(
        JSON.stringify({ escrow: updatedEscrow, transaction }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

     // Handle sign action for multi-sig
     if (body.action === "sign") {
       const { escrow_id, signer_address } = body as SignEscrowRequest;
 
       if (!escrow_id || !signer_address) {
         return new Response(
           JSON.stringify({ error: SAFE_ERRORS.MISSING_FIELDS }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       // Validate address format
       if (!isValidCardanoAddress(signer_address)) {
         return new Response(
           JSON.stringify({ error: SAFE_ERRORS.INVALID_ADDRESS }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       // Get escrow
       const { data: escrow, error: fetchError } = await supabase
         .from("escrows")
         .select("*")
         .eq("id", escrow_id)
         .single();
 
       if (fetchError || !escrow) {
         return new Response(
           JSON.stringify({ error: SAFE_ERRORS.ESCROW_NOT_FOUND }),
           { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       if (escrow.status !== "active") {
         return new Response(
           JSON.stringify({ error: SAFE_ERRORS.ESCROW_NOT_ACTIVE }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       // Determine if signer is buyer or seller
       const isBuyer = signer_address === escrow.buyer_address;
       const isSeller = signer_address === escrow.seller_address;
 
       if (!isBuyer && !isSeller) {
         return new Response(
           JSON.stringify({ error: SAFE_ERRORS.NOT_PARTICIPANT }),
           { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       // Check if already signed
       if (isBuyer && escrow.buyer_signed_at) {
         return new Response(
           JSON.stringify({ error: SAFE_ERRORS.ALREADY_SIGNED }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       if (isSeller && escrow.seller_signed_at) {
         return new Response(
           JSON.stringify({ error: SAFE_ERRORS.ALREADY_SIGNED }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       // Record signature
       const now = new Date().toISOString();
       const updateField = isBuyer ? { buyer_signed_at: now } : { seller_signed_at: now };
 
       const { data: updatedEscrow, error: updateError } = await supabase
         .from("escrows")
         .update(updateField)
         .eq("id", escrow_id)
         .select()
         .single();
 
       if (updateError) {
         console.error("Signature update error:", updateError);
         return new Response(
           JSON.stringify({ error: sanitizeDbError(updateError) }),
           { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       const buyerSigned = !!updatedEscrow.buyer_signed_at;
       const sellerSigned = !!updatedEscrow.seller_signed_at;
       const canRelease = updatedEscrow.requires_multi_sig 
         ? (buyerSigned && sellerSigned) 
         : buyerSigned;
 
       return new Response(
         JSON.stringify({
           escrow: updatedEscrow,
           signature: {
             role: isBuyer ? "buyer" : "seller",
             signed_at: now,
             buyer_signed: buyerSigned,
             seller_signed: sellerSigned,
             can_release: canRelease,
           }
         }),
         { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Handle get multi-sig status
     if (body.action === "get_multisig_status") {
       const { escrow_id } = body as GetMultiSigStatusRequest;
 
       if (!escrow_id) {
         return new Response(
           JSON.stringify({ error: SAFE_ERRORS.MISSING_FIELDS }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       const { data: escrow, error: fetchError } = await supabase
         .from("escrows")
         .select("id, requires_multi_sig, buyer_signed_at, seller_signed_at, status")
         .eq("id", escrow_id)
         .single();
 
       if (fetchError || !escrow) {
         return new Response(
           JSON.stringify({ error: SAFE_ERRORS.ESCROW_NOT_FOUND }),
           { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       const buyerSigned = !!escrow.buyer_signed_at;
       const sellerSigned = !!escrow.seller_signed_at;
       const canRelease = escrow.requires_multi_sig 
         ? (buyerSigned && sellerSigned) 
         : buyerSigned;
 
       return new Response(
         JSON.stringify({
           escrow_id: escrow.id,
           requires_multi_sig: escrow.requires_multi_sig,
           buyer_signed: buyerSigned,
           seller_signed: sellerSigned,
           buyer_signed_at: escrow.buyer_signed_at,
           seller_signed_at: escrow.seller_signed_at,
           can_release: canRelease,
           status: escrow.status,
         }),
         { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
    return new Response(
      JSON.stringify({ error: SAFE_ERRORS.INVALID_ACTION }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Edge function error:", error);
    // Never expose internal error details to client
    return new Response(
      JSON.stringify({ error: SAFE_ERRORS.SERVER_ERROR }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
