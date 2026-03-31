# Cardano Escrow Smart Contract (Plutus)

A two-party escrow smart contract written in Haskell/Plutus for the Cardano blockchain.

## Overview

This escrow contract enables secure peer-to-peer transactions:

| Role | Actions |
|------|---------|
| **Buyer** | Lock funds, Release to seller, Refund after deadline |
| **Seller** | Receive funds when buyer releases |

## Contract Logic

```
┌─────────────────────────────────────────────────────┐
│                    ESCROW CONTRACT                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  DATUM (stored on-chain):                           │
│  • buyer: PubKeyHash                                │
│  • seller: PubKeyHash                               │
│  • deadline: POSIXTime                              │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ACTIONS (redeemer):                                │
│                                                      │
│  [Release]                                          │
│  ├── Requires: Buyer signature                      │
│  └── Effect: Funds sent to Seller                  │
│                                                      │
│  [Refund]                                           │
│  ├── Requires: Buyer signature + Deadline passed   │
│  └── Effect: Funds returned to Buyer               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Nix Package Manager**
   ```bash
   sh <(curl -L https://nixos.org/nix/install) --daemon
   ```

2. **IOHK Binary Cache** (speeds up builds)
   ```bash
   # Add to /etc/nix/nix.conf:
   substituters = https://cache.nixos.org https://cache.iog.io
   trusted-public-keys = cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY= hydra.iohk.io:f/Ea+s+dFdN+3Y/G+FDgSq+a5NEWhJGzdjvKNGv0/EQ=
   ```

## Quick Start

### 1. Clone Plutus Apps
```bash
git clone https://github.com/input-output-hk/plutus-apps
cd plutus-apps
git checkout v1.2.0  # Use stable release
```

### 2. Enter Nix Shell
```bash
nix-shell
```

### 3. Create Project Structure
```bash
mkdir escrow-contract && cd escrow-contract
cp /path/to/EscrowContract.hs .
```

### 4. Create cabal file
```cabal
-- escrow-contract.cabal
cabal-version: 2.4
name:          escrow-contract
version:       1.0.0

library
  exposed-modules:  EscrowContract
  build-depends:    
      base ^>=4.14
    , plutus-tx
    , plutus-tx-plugin
    , plutus-ledger-api
    , plutus-script-utils
    , bytestring
    , serialise
  default-language: Haskell2010
  ghc-options:      
    -Wall 
    -fobject-code 
    -fno-ignore-interface-pragmas
    -fno-omit-interface-pragmas
```

### 5. Build
```bash
cabal build
```

### 6. Serialize to Plutus Script
Create `Serialize.hs`:
```haskell
module Main where

import Cardano.Api
import Cardano.Api.Shelley (PlutusScript(..))
import qualified Data.ByteString.Lazy as LBS
import qualified Data.ByteString.Short as SBS
import Codec.Serialise (serialise)
import qualified Plutus.V2.Ledger.Api as Plutus

import EscrowContract (validator)

main :: IO ()
main = do
  let script = Plutus.unValidatorScript validator
      scriptSerial = serialise script
      scriptSBS = SBS.toShort . LBS.toStrict $ scriptSerial
      
  result <- writeFileTextEnvelope "escrow.plutus" Nothing 
            (PlutusScriptSerialised scriptSBS :: PlutusScript PlutusScriptV2)
  case result of
    Left err -> print err
    Right () -> putStrLn "Wrote escrow.plutus"
```

Run: `cabal run serialize`

## Testnet Deployment

### 1. Generate Script Address
```bash
cardano-cli address build \
  --payment-script-file escrow.plutus \
  --testnet-magic 1 \
  --out-file escrow.addr

SCRIPT_ADDR=$(cat escrow.addr)
echo "Script Address: $SCRIPT_ADDR"
```

### 2. Fund the Script (Create Escrow)
```bash
# Build datum
BUYER_PKH="your_buyer_pubkeyhash"
SELLER_PKH="seller_pubkeyhash"
DEADLINE=1700000000000  # Unix timestamp in milliseconds

cardano-cli transaction build \
  --testnet-magic 1 \
  --tx-in $BUYER_UTXO \
  --tx-out "$SCRIPT_ADDR+50000000" \
  --tx-out-datum-hash-file datum.json \
  --change-address $BUYER_ADDR \
  --out-file tx.raw

cardano-cli transaction sign \
  --tx-body-file tx.raw \
  --signing-key-file buyer.skey \
  --testnet-magic 1 \
  --out-file tx.signed

cardano-cli transaction submit \
  --testnet-magic 1 \
  --tx-file tx.signed
```

### 3. Release Funds (Buyer Approves)
```bash
cardano-cli transaction build \
  --testnet-magic 1 \
  --tx-in $SCRIPT_UTXO \
  --tx-in-script-file escrow.plutus \
  --tx-in-datum-file datum.json \
  --tx-in-redeemer-file release-redeemer.json \
  --tx-in-collateral $COLLATERAL_UTXO \
  --tx-out "$SELLER_ADDR+50000000" \
  --required-signer-hash $BUYER_PKH \
  --change-address $BUYER_ADDR \
  --out-file release-tx.raw

# Sign and submit...
```

## Frontend Integration

Once deployed, update your React app with the script address:

```typescript
// src/services/cardanoService.ts
export const ESCROW_SCRIPT_ADDRESS = "addr_test1..."; // Your deployed address
export const ESCROW_SCRIPT_CBOR = "..."; // Serialized script hex
```

The React frontend uses Lucid to build transactions. See `EscrowContract.hs` comments for integration examples.

## Testing on Preview Testnet

1. Get test ADA: https://docs.cardano.org/cardano-testnet/tools/faucet/
2. Deploy contract to Preview testnet (`--testnet-magic 2`)
3. Update frontend with script address
4. Test full escrow flow!

## Security Considerations

- ✅ Only buyer can release or refund
- ✅ Refund only available after deadline
- ✅ Seller receives full locked amount on release
- ✅ No admin keys or backdoors

## Alternative: Aiken

For a simpler development experience, consider [Aiken](https://aiken-lang.org/):

```aiken
// escrow.ak
validator {
  fn escrow(datum: EscrowDatum, redeemer: Action, ctx: ScriptContext) -> Bool {
    when redeemer is {
      Release -> buyer_signed(datum, ctx) && seller_paid(datum, ctx)
      Refund -> buyer_signed(datum, ctx) && deadline_passed(datum, ctx)
    }
  }
}
```

Aiken compiles directly to Plutus Core without needing the full Haskell toolchain.

## License

MIT
