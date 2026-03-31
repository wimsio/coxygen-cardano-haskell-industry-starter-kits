# Deploying to Supabase - Step by Step

## Prerequisites

- Supabase project ID: `jqdrthsjqckptwbalpuj`
- Access to Supabase dashboard: https://supabase.com/dashboard

## Step 1: Set Environment Variables in Supabase Dashboard

### Navigate to Environment Variables

1. Go to https://supabase.com/dashboard/project/jqdrthsjqckptwbalpuj/settings/environment
2. Or manually: **Settings** > **Environment Variables**

### Add Three Environment Variables

Click **+ New variable** for each:

#### 1. BLOCKFROST_API_KEY
- **Key:** `BLOCKFROST_API_KEY`
- **Value:** `preprodYjRkHfcazNkL0xxG9C2RdUbUoTrG7wip`
- **Type:** Text
- **Click "Save"**

#### 2. ESCROW_SCRIPT_BASE64
- **Key:** `ESCROW_SCRIPT_BASE64`
- **Value:** `TQEAADMiIiAFEgASABFYIEprYbk94qYpQcoLSPegJ13MLCcmSTi/D/U4qY5c/AE/`
- **Type:** Text
- **Click "Save"**

#### 3. ESCROW_SCRIPT_ADDRESS
- **Key:** `ESCROW_SCRIPT_ADDRESS`
- **Value:** `addr_test1wzk86vux4278453f65675865675865675865675865675865675865675`
- **Type:** Text
- **Click "Save"**

### Wait for Deployment

You should see a notification that environment variables were saved. Allow **1-2 minutes** for the variables to propagate to all edge functions.

## Step 2: Verify Environment Variables are Set

After 1-2 minutes, verify the variables are available:

1. Go to **Functions** in sidebar
2. Click on `cardano-tx-builder`
3. Open the **Editor** tab
4. In the browser console, you can verify via function logs

Or in your local terminal:
```bash
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  "https://jqdrthsjqckptwbalpuj.supabase.co/functions/v1/cardano-tx-builder" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

## Step 3: Redeploy Edge Functions

The edge functions will automatically use the new environment variables, but you may want to explicitly redeploy them to ensure they pick up the changes:

### Option A: Via Dashboard (Recommended)

1. Go to **Functions** in sidebar
2. For each function (`cardano-tx-builder`, `escrow-transactions`):
   - Click the function name
   - Click **⋮ (More)** menu
   - Click **Redeploy function**
   - Wait for success message

### Option B: Via Supabase CLI (if installed locally)

```bash
# Login to Supabase
supabase login

# Deploy specific functions
supabase functions deploy cardano-tx-builder --project-id jqdrthsjqckptwbalpuj
supabase functions deploy escrow-transactions --project-id jqdrthsjqckptwbalpuj

# Or deploy all functions
supabase functions deploy
```

## Step 4: Test Local Development

Verify everything works locally:

```bash
# Start dev server
npm run dev

# In another terminal, check that env vars were loaded
npm run dev
```

### Browser Console Test

Open browser DevTools (F12) and run:

```javascript
import { escrowApi } from '@/services/escrowApi';

// Get script configuration
const config = escrowApi.getScriptConfig();
console.log('Script Config:', config);
// Expected output:
// {
//   scriptBase64: "TQEAADMiIiAFEgASABFYIEpr...",
//   scriptAddress: "addr_test1wzk86...",
//   isDeployed: true
// }
```

Or check in React component:

```typescript
import { isScriptDeployed, getScriptAddress } from '@/services/lucidService';

export function TestComponent() {
  const ready = isScriptDeployed();
  const addr = getScriptAddress();
  
  return (
    <div>
      <p>Script Deployed: {ready ? '✅' : '❌'}</p>
      <p>Script Address: {addr?.slice(0, 20)}...</p>
    </div>
  );
}
```

## Step 5: Test Escrow Creation

Once verified, test the full escrow flow:

```bash
# 1. Start dev server
npm run dev

# 2. In browser, navigate to Dashboard
# 3. Try creating an escrow
# 4. Check browser DevTools Console for:
#    - Script verification success
#    - Transaction building process
#    - Any error messages
```

Check edge function logs in Supabase:

1. Go to **Functions** > `escrow-transactions`
2. Click **Logs** tab
3. Look for recent invocations
4. Check for errors related to missing environment variables

## Troubleshooting

### Problem: "ESCROW_SCRIPT_BASE64 environment variable not set" Error

**Cause:** Environment variables haven't propagated yet

**Solution:**
1. Verify variables are saved in Supabase dashboard
2. Wait 2-3 minutes for deployment
3. Try redeploying the function
4. Check function logs for confirmation

### Problem: Script Address Validation Fails

**Cause:** Address format or network mismatch

**Solution:**
1. Verify address starts with `addr_test1` (testnet)
2. Address should be 57+ characters
3. Regenerate via:
   ```bash
   cd plutus-contract
   cabal exec SerializeEscrow
   ```

### Problem: Local Dev Server Can't Load Script

**Cause:** `.env.local` not loaded or frontend env vars missing

**Solution:**
```bash
# Verify .env.local has VITE_ prefixed vars
cat .env.local | grep VITE_ESCROW

# If missing, add:
# VITE_ESCROW_SCRIPT_BASE64=...
# VITE_ESCROW_SCRIPT_ADDRESS=...

# Restart dev server
npm run dev
```

### Problem: Function Logs Show "Cannot read undefined"

**Cause:** Environment variable not set in Supabase

**Solution:**
1. Double-check all 3 variables are set
2. Use exact values (no extra spaces)
3. Redeploy function
4. Wait 2 minutes

## File Reference

These functions use the environment variables:

- **[supabase/functions/cardano-tx-builder/index.ts](supabase/functions/cardano-tx-builder/index.ts)**
  - Uses: `BLOCKFROST_API_KEY`, `ESCROW_SCRIPT_BASE64`, `ESCROW_SCRIPT_ADDRESS`
  - Purpose: Build and sign Cardano transactions

- **[supabase/functions/escrow-transactions/index.ts](supabase/functions/escrow-transactions/index.ts)**
  - Uses: Database queries + edge function calls
  - Purpose: Manage escrow lifecycle (create, release, refund)

## Monitoring

After deployment, monitor in Supabase dashboard:

1. **Functions > Logs:** Check for errors
2. **Database > escrows:** Verify new escrows are created
3. **Edge Function Details:** Check invocation counts and latency

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git
- Supabase environment variables are not secret by default
- For sensitive keys, use Supabase Secrets:
  - Go to **Settings > Secrets**
  - These are masked and can't be read via API

## Rollback

If something goes wrong:

1. Remove the environment variables from Supabase dashboard
2. Redeploy functions (they'll fail gracefully without env vars)
3. Fix issues locally and re-add variables
4. Redeploy again

## Support Files

- [PLUTUS_SCRIPT_DEPLOYMENT.md](PLUTUS_SCRIPT_DEPLOYMENT.md) - Overall deployment guide
- [PREPROD_SETUP.md](PREPROD_SETUP.md) - Preprod network setup
- [supabase/config.toml](supabase/config.toml) - Edge function configuration
