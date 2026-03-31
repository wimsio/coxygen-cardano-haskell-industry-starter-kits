import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MESSAGE_MAX_AGE_MS = 5 * 60 * 1000;
const ALLOWED_FUTURE_SKEW_MS = 60 * 1000;

type WalletMessagePayload = {
  escrow_id: string;
  content: string;
  ts: number;
  address: string;
};

function jsonResponse(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseAndValidatePayload(rawPayload: string): { ok: true; value: WalletMessagePayload } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    return { ok: false, error: 'Invalid payload JSON' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Invalid payload shape' };
  }

  const payload = parsed as Partial<WalletMessagePayload>;
  if (!payload.escrow_id || !payload.content || !payload.address || typeof payload.ts !== 'number') {
    return { ok: false, error: 'Payload missing required fields' };
  }

  const now = Date.now();
  const ageMs = now - payload.ts;
  if (ageMs > MESSAGE_MAX_AGE_MS) {
    return { ok: false, error: 'Payload is too old' };
  }

  if (ageMs < -ALLOWED_FUTURE_SKEW_MS) {
    return { ok: false, error: 'Payload timestamp is too far in the future' };
  }

  return {
    ok: true,
    value: {
      escrow_id: payload.escrow_id,
      content: payload.content,
      ts: payload.ts,
      address: payload.address,
    },
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse(500, { error: 'Server not configured', code: 'SERVER_NOT_CONFIGURED' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { escrow_id, content, sender_address, payload, signature, key } = body || {};

    if (!escrow_id || !content || !sender_address || !payload || !signature || !key) {
      return jsonResponse(400, { error: 'Missing required fields', code: 'MISSING_FIELDS' });
    }

    // Verify signature and that public key maps to the provided address using shared helpers
    const { verifySignature, publicKeyMatchesAddress } = await import('./lib.ts');

    const parsedPayload = parseAndValidatePayload(String(payload));
    if (!parsedPayload.ok) {
      return jsonResponse(400, { error: parsedPayload.error, code: 'INVALID_PAYLOAD' });
    }

    if (
      parsedPayload.value.escrow_id !== String(escrow_id) ||
      parsedPayload.value.content !== String(content) ||
      parsedPayload.value.address !== String(sender_address)
    ) {
      return jsonResponse(400, {
        error: 'Signed payload does not match message fields',
        code: 'PAYLOAD_FIELD_MISMATCH',
      });
    }

    const verified = await verifySignature(payload, signature, key);
    if (!verified) {
      return jsonResponse(401, { error: 'Invalid signature', code: 'INVALID_SIGNATURE' });
    }

    const matches = await publicKeyMatchesAddress(key, String(sender_address));
    if (!matches) {
      return jsonResponse(400, { error: 'Public key does not match address', code: 'KEY_ADDRESS_MISMATCH' });
    }

    const { data: escrow, error: escrowError } = await supabase
      .from('escrows')
      .select('id, buyer_address, seller_address')
      .eq('id', escrow_id)
      .maybeSingle();

    if (escrowError) {
      console.error('Escrow lookup failed', { escrowError, escrow_id });
      return jsonResponse(500, { error: 'Escrow lookup failed', code: 'ESCROW_LOOKUP_FAILED' });
    }

    if (!escrow) {
      return jsonResponse(404, { error: 'Escrow not found', code: 'ESCROW_NOT_FOUND' });
    }

    const sender = String(sender_address);
    if (sender !== escrow.buyer_address && sender !== escrow.seller_address) {
      return jsonResponse(403, { error: 'Sender is not a participant in this escrow', code: 'NOT_PARTICIPANT' });
    }

    // Insert message using service role (bypass RLS safely because we've verified ownership)
    const { data: insertedRows, error: insertError } = await supabase
      .from('escrow_messages')
      .insert({ escrow_id, sender_address, content })
      .select();

    if (insertError) {
      console.error('DB insert error', { insertError, escrow_id, sender_address });
      return jsonResponse(500, { error: insertError.message || 'Failed to save message', code: 'MESSAGE_INSERT_FAILED' });
    }

    const inserted = Array.isArray(insertedRows) && insertedRows.length > 0 ? insertedRows[0] : null;

    // Trigger email notification for recipient (fire-and-forget)
    try {
      const recipientAddress = String(sender_address) === String(inserted?.sender_address) ? (await (async () => {
        // Determine counterparty address from escrow
        const { data: e } = await supabase.from('escrows').select('buyer_address, seller_address').eq('id', escrow_id).maybeSingle();
        if (!e) return null;
        return (e.buyer_address === sender_address) ? e.seller_address : e.buyer_address;
      })()) : null;

      if (recipientAddress) {
        // Call existing notification function (re-use logic)
        await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
          },
          body: JSON.stringify({
            type: 'message_received',
            escrow_id,
            recipient_address: recipientAddress,
            data: { message: content, base_url: Deno.env.get('APP_BASE_URL') || 'https://trusty-deal-maker.lovable.app' },
          }),
        }).catch((err) => console.warn('notify call failed:', err));
      }
    } catch (notifyErr) {
      console.warn('Notification step failed:', notifyErr);
    }

    return jsonResponse(200, { success: true, message: inserted });

  } catch (err) {
    console.error('Error in send-wallet-message:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse(500, { error: msg, code: 'UNHANDLED_ERROR' });
  }
};

serve(handler);
