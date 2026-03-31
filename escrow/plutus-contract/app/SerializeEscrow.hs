{-# LANGUAGE OverloadedStrings #-}

module Main where

import           Cardano.Api
import           Cardano.Api.Shelley        (PlutusScript (..))
import qualified Data.ByteString.Lazy       as LBS
import qualified Data.ByteString.Short      as SBS
import qualified Data.ByteString.Base64     as B64
import qualified Data.ByteString.Char8      as BS8
import qualified Plutus.V2.Ledger.Api       as Plutus
import           Codec.Serialise            (serialise)

import           EscrowContract             (validator)

main :: IO ()
main = do
    putStrLn "Serializing Escrow Contract..."

    let script        = Plutus.unValidatorScript validator
        scriptCBOR    = serialise script
        scriptSBS     = SBS.toShort $ LBS.toStrict scriptCBOR
        plutusScript  = PlutusScriptSerialised scriptSBS

    -- Write .plutus (for cardano-cli)
    result <- writeFileTextEnvelope
        "escrow.plutus"
        (Just "Escrow Validator Script")
        plutusScript

    case result of
        Left err -> putStrLn $ "Error writing script: " ++ show err
        Right () -> do
            putStrLn "escrow.plutus written"

            -- Write Base64 (for Lucid)
            let base64 = B64.encode $ SBS.fromShort scriptSBS
            BS8.writeFile "escrow.base64" base64

            putStrLn "escrow.base64 written"
            
            -- Print Base64 for environment variable
            putStrLn ""
            putStrLn "ESCROW_SCRIPT_BASE64="
            BS8.putStr base64
            putStrLn ""
            
            putStrLn ""
            putStrLn "Next steps:"
            putStrLn "  1. Build script address:"
            putStrLn "     cardano-cli address build \\"
            putStrLn "       --payment-script-file escrow.plutus \\"
            putStrLn "       --testnet-magic 1 \\"
            putStrLn "       --out-file escrow.addr"
            putStrLn ""
            putStrLn "  2. Copy the address and use as ESCROW_SCRIPT_ADDRESS"
            putStrLn ""
            putStrLn "  3. Add to .env.local:"
            putStrLn "     ESCROW_SCRIPT_BASE64=<base64_value_above>"
            putStrLn "     ESCROW_SCRIPT_ADDRESS=<address_from_step_1>"
