# Plutus Escrow Contract - Compilation & Deployment Guide

## Overview

This guide walks you through compiling the Haskell Plutus contract and integrating the serialized script with your Edge Function for **preprod** deployment.

**Network**: Cardano Preprod (testnet)  
**Script Type**: Plutus V2  
**Language**: Haskell (GHC + Cabal)

---

## Step 1: Set Up Plutus Build Environment

### Option A: Using Nix (Recommended for reproducibility)

```bash
cd /workspace/trusty-deal-maker/plutus-contract

# Install Nix (if not already installed)
curl -L https://nixos.org/nix/install | sh

# Enter nix-shell with Plutus dependencies
nix-shell

# Inside nix-shell, you'll have GHC, cabal, etc.
```

### Option B: Direct Cabal Build (requires GHC 8.10+ and Cabal 3.4+)

```bash
cd /workspace/trusty-deal-maker/plutus-contract

# Update cabal package database
cabal update

# Build the project
cabal build all
```

---

## Step 2: Compile the Escrow Validator

Once in the build environment:

```bash
cd /workspace/trusty-deal-maker/plutus-contract

# Compile the serialize-escrow executable
cabal build serialize-escrow:exe:serialize-escrow

# Find the executable path (usually in dist-newstyle/)
SERIALIZE_EXE=$(find plutus-contract/dist-newstyle -name serialize-escrow -type f | grep bin | head -1)

# Run it to generate escrow.plutus
$SERIALIZE_EXE
```

**Output**: `escrow.plutus` file in `/workspace/trusty-deal-maker/plutus-contract/`

---

## Step 3: Extract Script Address (Preprod)

Once you have `escrow.plutus`, get the script address for preprod:

```bash
cd /workspace/trusty-deal-maker/plutus-contract

cardano-cli address build \
  --payment-script-file escrow.plutus \
  --testnet-magic 1 \
  --out-file escrow.addr

# View the script address
cat escrow.addr
# Should output something like: addr_test1wz2lxqkv...
```

**Save this address** - it's where funds will be locked in escrow! 🔐

---

## Step 4: Get the Script Bytes

Your Edge Function needs the compiled script as base64-encoded bytes:

```bash
cd /workspace/trusty-deal-maker/plutus-contract

# Convert plutus script to hex
xxd -p -c 256 escrow.plutus | tr -d '\n' > escrow.hex

# Convert hex to base64 (for embedding in Node/Deno)
xxd -r -p escrow.hex | base64 > escrow.base64

# View the base64 script
cat escrow.base64
```

**Copy this entire base64 string** - you'll embed it in the Edge Function as `ESCROW_SCRIPT_BASE64`.

---

## Step 5: Update Environment Variables

Add to your Supabase Secrets / `.env.local`:

```env
BLOCKFROST_API_KEY=your_preprod_blockfrost_key
ESCROW_SCRIPT_BASE64=<paste_the_base64_from_step_4>
ESCROW_SCRIPT_ADDRESS=<paste_the_address_from_step_3>
```

---

## Step 6: Update Edge Function

Replace `/workspaces/trusty-deal-maker/supabase/functions/cardano-tx-builder/index.ts` with the new Plutus-aware version (see below).

---

## Verification Checklist

- ✅ `escrow.plutus` file exists
- ✅ `escrow.addr` shows valid preprod address (starts with `addr_test1`)
- ✅ `escrow.base64` contains the script bytes
- ✅ Environment variables are set in Supabase
- ✅ Edge Function updated with Plutus V2 logic
- ✅ Test: Create escrow → verify UTxO at script address on preprod explorer

---

## Troubleshooting

### "Can't find ghc" / "cabal: command not found"

You're not in a proper build environment. Use `nix-shell` or install GHC 8.10+.

### "escrow.plutus not created"

The serialize-escrow executable failed. Check:
```bash
cabal build serialize-escrow 2>&1 | tail -20
```

### "Invalid script address"

Your `cardano-cli` isn't installed or is outdated. Install from:
https://github.com/input-output-hk/cardano-cli/releases

### "Script validation fails on-chain"

Common causes:
- Wrong script bytes (corrupted base64)
- Wrong network (mainnet vs preprod mismatch)
- Datum format mismatch with validator
- Redeemer encoding incorrect

---

## Next: Update Your Edge Function

Once you have `ESCROW_SCRIPT_BASE64` and `ESCROW_SCRIPT_ADDRESS`, use the corrected Edge Function provided below. The Edge Function will:

1. ✅ Deserialize the Plutus script
2. ✅ Build datum correctly (buyer, seller, deadline)
3. ✅ Build redeemer (Release=0, Refund=1)
4. ✅ Attach both to transactions
5. ✅ Handle Blockfrost errors gracefully
6. ✅ Return real tx hashes instead of silent failures

---

## References

- Plutus Docs: https://plutus.readthedocs.io/
- Blockfrost Preprod: https://docs.blockfrost.io/
- Cardano CLI: https://github.com/input-output-hk/cardano-cli
- Lucid Cardano: https://github.com/spacebudz/lucid
