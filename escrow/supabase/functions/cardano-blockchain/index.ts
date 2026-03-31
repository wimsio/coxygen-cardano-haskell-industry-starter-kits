import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BLOCKFROST_URL = 'https://cardano-preprod.blockfrost.io/api/v0';

interface BlockfrostRequest {
  action: 'getUtxos' | 'submitTx' | 'getProtocolParams' | 'getTxInfo' | 'getAddressInfo';
  address?: string;
  txCbor?: string;
  txHash?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BLOCKFROST_API_KEY = Deno.env.get('BLOCKFROST_API_KEY');
    if (!BLOCKFROST_API_KEY) {
      throw new Error('BLOCKFROST_API_KEY is not configured');
    }

    const body: BlockfrostRequest = await req.json();
    const { action, address, txCbor, txHash } = body;

    const headers = {
      'Content-Type': 'application/json',
      'project_id': BLOCKFROST_API_KEY,
    };

    let result: unknown;

    switch (action) {
      case 'getUtxos': {
        if (!address) {
          throw new Error('Address is required for getUtxos');
        }
        
        const response = await fetch(`${BLOCKFROST_URL}/addresses/${address}/utxos`, {
          method: 'GET',
          headers,
        });
        
        if (response.status === 404) {
          // Address has no UTxOs (unused address)
          result = [];
        } else if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Blockfrost error: ${JSON.stringify(errorData)}`);
        } else {
          result = await response.json();
        }
        break;
      }

      case 'submitTx': {
        if (!txCbor) {
          throw new Error('txCbor is required for submitTx');
        }
        
        // Blockfrost expects raw CBOR bytes for tx submission
        const txBytes = hexToBytes(txCbor);
        
        const response = await fetch(`${BLOCKFROST_URL}/tx/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/cbor',
            'project_id': BLOCKFROST_API_KEY,
          },
          body: txBytes.buffer as BodyInit,
        });
        
        const responseText = await response.text();
        
        if (!response.ok) {
          console.error('Blockfrost submit error:', responseText);
          throw new Error(`Transaction submission failed: ${responseText}`);
        }
        
        // Blockfrost returns the tx hash as a plain string
        result = { txHash: responseText.replace(/"/g, '') };
        break;
      }

      case 'getProtocolParams': {
        const response = await fetch(`${BLOCKFROST_URL}/epochs/latest/parameters`, {
          method: 'GET',
          headers,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Blockfrost error: ${JSON.stringify(errorData)}`);
        }
        
        result = await response.json();
        break;
      }

      case 'getTxInfo': {
        if (!txHash) {
          throw new Error('txHash is required for getTxInfo');
        }
        
        const response = await fetch(`${BLOCKFROST_URL}/txs/${txHash}`, {
          method: 'GET',
          headers,
        });
        
        if (response.status === 404) {
          result = { found: false };
        } else if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Blockfrost error: ${JSON.stringify(errorData)}`);
        } else {
          const txData = await response.json();
          result = { found: true, ...txData };
        }
        break;
      }

      case 'getAddressInfo': {
        if (!address) {
          throw new Error('Address is required for getAddressInfo');
        }
        
        const response = await fetch(`${BLOCKFROST_URL}/addresses/${address}`, {
          method: 'GET',
          headers,
        });
        
        if (response.status === 404) {
          result = { found: false, balance: '0' };
        } else if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Blockfrost error: ${JSON.stringify(errorData)}`);
        } else {
          const addrData = await response.json();
          result = { found: true, ...addrData };
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Cardano blockchain error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}
