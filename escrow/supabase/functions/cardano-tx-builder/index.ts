import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  Blockfrost,
  Lucid,
  type Script,
  type UTxO,
} from "https://deno.land/x/lucid@0.10.11/mod.ts";

/* ============================================================================
   CORS
============================================================================ */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ============================================================================
   ENV
============================================================================ */

const BLOCKFROST_API_KEY = Deno.env.get("BLOCKFROST_API_KEY");

/* ============================================================================
   TYPES
============================================================================ */

interface FundRequest {
  action: "buildFundTx";
  buyerAddress: string;
  sellerAddress: string;
  amount: string; // lovelace
  deadlineSlot: number;
}

interface SpendRequest {
  action: "buildReleaseTx" | "buildRefundTx";
  buyerAddress: string;
  sellerAddress: string;
  escrowUtxoTxHash: string;
  escrowUtxoIndex: number;
  deadlineSlot: number;
}

type TxRequest = FundRequest | SpendRequest;

/* ============================================================================
   HELPERS
============================================================================ */

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function initLucid(): Promise<Lucid> {
  return await Lucid.new(
    new Blockfrost(
      "https://cardano-preprod.blockfrost.io/api/v0",
      BLOCKFROST_API_KEY!,
    ),
    "Preprod",
  );
}

function getPkh(lucid: Lucid, address: string): string {
  const details = lucid.utils.getAddressDetails(address);
  const cred = details.paymentCredential;
  if (!cred || !cred.hash) throw new Error(`Invalid payment address: ${address}`);
  return cred.hash;
}

/**
 * Build the Native Script JSON for escrow logic:
 *   any( all(sig buyer, sig seller),        // Release
 *        all(sig buyer, after deadlineSlot)) // Refund
 */
function buildNativeScriptJson(buyerPkh: string, sellerPkh: string, deadlineSlot: number) {
  return {
    type: "any" as const,
    scripts: [
      {
        type: "all" as const,
        scripts: [
          { type: "sig" as const, keyHash: buyerPkh },
          { type: "sig" as const, keyHash: sellerPkh },
        ],
      },
      {
        type: "all" as const,
        scripts: [
          { type: "sig" as const, keyHash: buyerPkh },
          { type: "after" as const, slot: deadlineSlot },
        ],
      },
    ],
  };
}

function deriveScriptAddress(lucid: Lucid, buyerPkh: string, sellerPkh: string, deadlineSlot: number): { script: Script; address: string } {
  const nsJson = buildNativeScriptJson(buyerPkh, sellerPkh, deadlineSlot);
  const script: Script = lucid.utils.nativeScriptFromJson(nsJson);
  const address = lucid.utils.validatorToAddress(script);
  return { script, address };
}

/* ============================================================================
   HANDLER
============================================================================ */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!BLOCKFROST_API_KEY) {
    return json({ success: false, error: "Missing BLOCKFROST_API_KEY secret" });
  }

  try {
    const body: TxRequest = await req.json();

    if (!body || typeof (body as any).action !== "string") {
      return json({ success: false, error: "Missing or invalid action" });
    }

    const lucid = await initLucid();

    switch (body.action) {
      case "buildFundTx":
        return json(await buildFundTx(lucid, body as FundRequest));
      case "buildReleaseTx":
        return json(await buildSpendTx(lucid, body as SpendRequest, "release"));
      case "buildRefundTx":
        return json(await buildSpendTx(lucid, body as SpendRequest, "refund"));
      default:
        return json({ success: false, error: `Unknown action: ${(body as any).action}` });
    }
  } catch (err) {
    console.error("[cardano-tx-builder] Error:", err);
    return json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

/* ============================================================================
   FUND TX
============================================================================ */

async function buildFundTx(lucid: Lucid, params: FundRequest) {
  const { buyerAddress, sellerAddress, amount, deadlineSlot } = params;

  const buyerPkh = getPkh(lucid, buyerAddress);
  const sellerPkh = getPkh(lucid, sellerAddress);
  const { address: scriptAddress } = deriveScriptAddress(lucid, buyerPkh, sellerPkh, deadlineSlot);

  console.log("[buildFundTx]", { scriptAddress, amount, deadlineSlot });

  // Select wallet UTxOs from buyer
  lucid.selectWalletFrom({ address: buyerAddress });

  const tx = await lucid
    .newTx()
    .payToAddress(scriptAddress, { lovelace: BigInt(amount) })
    .complete({ nativeUplc: false });

  return {
    success: true,
    txCbor: tx.toString(),
    scriptAddress,
    scriptOutputIndex: 0,
  };
}

/* ============================================================================
   SPEND TX (Release / Refund)
============================================================================ */

async function buildSpendTx(lucid: Lucid, params: SpendRequest, kind: "release" | "refund") {
  const { buyerAddress, sellerAddress, escrowUtxoTxHash, escrowUtxoIndex, deadlineSlot } = params;

  const buyerPkh = getPkh(lucid, buyerAddress);
  const sellerPkh = getPkh(lucid, sellerAddress);
  const { script, address: scriptAddress } = deriveScriptAddress(lucid, buyerPkh, sellerPkh, deadlineSlot);

  console.log(`[buildSpendTx:${kind}]`, { scriptAddress, utxo: `${escrowUtxoTxHash}#${escrowUtxoIndex}` });

  // Fetch UTxOs at script address
  const utxos: UTxO[] = await lucid.utxosAt(scriptAddress);
  const escrowUtxo = utxos.find(
    (u) => u.txHash === escrowUtxoTxHash && u.outputIndex === escrowUtxoIndex,
  );

  if (!escrowUtxo) {
    throw new Error(`Escrow UTxO not found: ${escrowUtxoTxHash}#${escrowUtxoIndex}. Found ${utxos.length} UTxO(s) at ${scriptAddress}`);
  }

  const recipient = kind === "release" ? sellerAddress : buyerAddress;

  // Select from buyer for tx building context
  lucid.selectWalletFrom({ address: buyerAddress });

  let txBuilder = lucid
    .newTx()
    .collectFrom([escrowUtxo])
    .attachSpendingValidator(script)
    .payToAddress(recipient, escrowUtxo.assets);

  if (kind === "release") {
    txBuilder = txBuilder.addSigner(buyerAddress).addSigner(sellerAddress);
  } else {
    txBuilder = txBuilder.addSigner(buyerAddress).validFrom(Date.now());
  }

  const tx = await txBuilder.complete({ nativeUplc: false });

  // --- Extract body and native script witness separately ---
  // Full tx CBOR = 84 <body> <witness> f5 f6
  // We derive the witness hex via string math, then return a clean
  // empty-witness tx for the wallet to sign.
  const fullTxHex = tx.toString();
  const txComplete = tx.txComplete;
  const bodyHex = toHex(txComplete.body().to_bytes());

  // witness hex sits between "84"+body and trailing "f5f6"
  const witnessHex = fullTxHex.slice(2 + bodyHex.length, -4);

  // Construct tx with empty witness set for wallet signing
  const txForSigning = "84" + bodyHex + "a0" + "f5f6";

  console.log(`[buildSpendTx:${kind}] bodyLen=${bodyHex.length}, witnessHex=${witnessHex.slice(0, 20)}..., txForSigning ends with a0f5f6=${txForSigning.endsWith("a0f5f6")}`);

  return {
    success: true,
    txCbor: txForSigning,
    originalWitnessCbor: witnessHex,
    scriptAddress,
    kind,
    requiredSigners: kind === "release" ? ["buyer", "seller"] : ["buyer"],
  };
}
