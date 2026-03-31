{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TypeApplications #-}

module EscrowContract where

import Prelude (IO, String, FilePath, putStrLn, (<>))
import qualified Prelude as P

import Plutus.V2.Ledger.Api
import Plutus.V2.Ledger.Contexts
import PlutusTx
import PlutusTx.Prelude hiding (Semigroup(..), unless)

import Plutus.V1.Ledger.Value (valueOf, adaSymbol, adaToken)
import qualified Plutus.V1.Ledger.Interval as Interval

import qualified Codec.Serialise as Serialise
import qualified Data.ByteString.Lazy  as LBS
import qualified Data.ByteString.Short as SBS
import qualified Data.ByteString       as BS
import qualified Data.ByteString.Base16 as B16

import qualified Cardano.Api as C
import qualified Cardano.Api.Shelley as CS

------------------------------------------------------------------------
-- Datum & Redeemer
------------------------------------------------------------------------

data EscrowDatum = EscrowDatum
  { buyer    :: PubKeyHash
  , seller   :: PubKeyHash
  , deadline :: POSIXTime
  }

data EscrowAction = Release | Refund

PlutusTx.unstableMakeIsData ''EscrowDatum
PlutusTx.unstableMakeIsData ''EscrowAction

------------------------------------------------------------------------
-- Helpers
------------------------------------------------------------------------

{-# INLINABLE signedBy #-}
signedBy :: PubKeyHash -> ScriptContext -> Bool
signedBy pkh ctx =
  txSignedBy (scriptContextTxInfo ctx) pkh

{-# INLINABLE ownInput #-}
ownInput :: ScriptContext -> TxOut
ownInput ctx =
  case findOwnInput ctx of
    Nothing -> traceError "Escrow input missing"
    Just i  -> txInInfoResolved i

{-# INLINABLE escrowAda #-}
escrowAda :: ScriptContext -> Integer
escrowAda ctx =
  valueOf (txOutValue (ownInput ctx)) adaSymbol adaToken

{-# INLINABLE paidAdaTo #-}
paidAdaTo :: TxInfo -> PubKeyHash -> Integer
paidAdaTo info pkh =
  valueOf (valuePaidTo info pkh) adaSymbol adaToken

------------------------------------------------------------------------
-- Validator Logic
------------------------------------------------------------------------

{-# INLINABLE mkEscrowValidator #-}
mkEscrowValidator :: EscrowDatum -> EscrowAction -> ScriptContext -> Bool
mkEscrowValidator dat action ctx =
  case action of
    --------------------------------------------------------------------
    -- Release: seller can claim (requires seller signature)
    --------------------------------------------------------------------
    Release ->
      traceIfFalse "Seller signature missing" sellerSigned &&
      traceIfFalse "Escrow ADA not paid to seller" paysSeller

    --------------------------------------------------------------------
    -- Refund: buyer can refund only after deadline (requires buyer sig)
    --------------------------------------------------------------------
    Refund  ->
      traceIfFalse "Buyer signature missing" buyerSigned &&
      traceIfFalse "Deadline not reached" deadlineReached &&
      traceIfFalse "Escrow ADA not refunded to buyer" paysBuyer
  where
    info :: TxInfo
    info = scriptContextTxInfo ctx

    sellerSigned :: Bool
    sellerSigned = signedBy (seller dat) ctx

    buyerSigned :: Bool
    buyerSigned = signedBy (buyer dat) ctx

    -- validRange must be entirely after (or equal to) the deadline
    deadlineReached :: Bool
    deadlineReached =
      Interval.from (deadline dat) `Interval.contains` txInfoValidRange info

    needed :: Integer
    needed = escrowAda ctx

    paysSeller :: Bool
    paysSeller = paidAdaTo info (seller dat) >= needed

    paysBuyer :: Bool
    paysBuyer = paidAdaTo info (buyer dat) >= needed

------------------------------------------------------------------------
-- Untyped Wrapper
------------------------------------------------------------------------

{-# INLINABLE mkValidatorUntyped #-}
mkValidatorUntyped :: BuiltinData -> BuiltinData -> BuiltinData -> ()
mkValidatorUntyped d r c =
  if mkEscrowValidator
      (unsafeFromBuiltinData d)
      (unsafeFromBuiltinData r)
      (unsafeFromBuiltinData c)
  then ()
  else error ()

validator :: Validator
validator =
  mkValidatorScript $$(PlutusTx.compile [|| mkValidatorUntyped ||])

-------------------------------------------------
-- SCRIPT ADDRESS (OFF-CHAIN HELPERS)
-------------------------------------------------

toBech32ScriptAddress :: C.NetworkId -> Validator -> String
toBech32ScriptAddress network val =
  let serialised = SBS.toShort . LBS.toStrict $ Serialise.serialise val
      plutusScript :: C.PlutusScript C.PlutusScriptV2
      plutusScript = CS.PlutusScriptSerialised serialised
      scriptHash   = C.hashScript (C.PlutusScript C.PlutusScriptV2 plutusScript)
      shelleyAddr :: C.AddressInEra C.BabbageEra
      shelleyAddr =
        C.makeShelleyAddressInEra
          network
          (C.PaymentCredentialByScript scriptHash)
          C.NoStakeAddress
  in P.show shelleyAddr

-------------------------------------------------
-- FILE OUTPUT
-------------------------------------------------

writeValidator :: FilePath -> Validator -> IO ()
writeValidator path val = do
  LBS.writeFile path (Serialise.serialise val)
  putStrLn $ "Validator written to: " <> path

writeCBOR :: FilePath -> Validator -> IO ()
writeCBOR path val = do
  let bytes = LBS.toStrict (Serialise.serialise val)
  BS.writeFile path (B16.encode bytes)
  putStrLn $ "CBOR hex written to: " <> path

-------------------------------------------------
-- MAIN
-------------------------------------------------

main :: IO ()
main = do
  let network = C.Testnet (C.NetworkMagic 1)

  writeValidator "escrow_deadline.plutus" validator
  writeCBOR      "escrow_deadline.cbor"   validator

  putStrLn $ "Script address: " <> toBech32ScriptAddress network validator
  putStrLn "Escrow (deadline) validator generated"
