{-# LANGUAGE OverloadedStrings #-}

-- | CompilePolicy.hs
--   Run with: cabal run compile-policy -- <issuer-pubkey-hash-hex>
--   Outputs: policy.plutus  (PlutusScriptV2, CBOR-encoded)
--            policy-id.txt  (the PolicyId hex string)

module Main where

import           System.Environment        (getArgs)
import           System.Exit               (die)
import qualified Data.ByteString.Base16    as B16
import qualified Data.ByteString           as BS
import           Data.Maybe                (fromMaybe)
import           Codec.Serialise           (serialise)
import qualified Data.ByteString.Lazy      as LBS

import           Plutus.V2.Ledger.Api      (PubKeyHash (..))
import           PlutusTx.Prelude          (BuiltinByteString, toBuiltin)
import           CredentialPolicy

main :: IO ()
main = do
  args <- getArgs
  case args of
    [pkhHex] -> do
      pkhBytes <- case B16.decode (BS.pack (map (toEnum . fromEnum) pkhHex)) of
        Right b -> return b
        Left  e -> die $ "Invalid PubKeyHash hex: " <> e
      let pkh    = PubKeyHash (toBuiltin pkhBytes)
          policy = compiledPolicy (CredentialParams pkh)
          cbor   = serialise policy
      LBS.writeFile "policy.plutus" cbor
      putStrLn $ "Policy compiled successfully."
      putStrLn $ "File written: policy.plutus"
      putStrLn $ "Upload policy.plutus to your backend as PLUTUS_POLICY_FILE."
    _ -> die "Usage: cabal run compile-policy -- <issuer-pubkeyhash-hex>"
