module InvoiceSpec (tests) where

import Test.Tasty       (TestTree, testGroup)
import Test.Tasty.HUnit (testCase, assertFailure, (@?=), assertBool)

import Invoice
  ( Investor(..)
  , InvoiceDatum(..)
  , InvoiceAction(..)
  , notFunded
  , validator
  , plutusValidatorHash
  , toBech32ScriptAddress
  )

import qualified Data.ByteString.Base16  as B16
import qualified Data.ByteString.Char8   as C
import qualified PlutusTx
import qualified PlutusTx.Builtins.Class as Builtins

import qualified Plutus.V2.Ledger.Api    as PlutusV2
import qualified Plutus.V1.Ledger.Value  as Value
import qualified Cardano.Api             as CApi

--------------------------------------------------------------------------------
-- Helpers
--------------------------------------------------------------------------------

decodeHexBS :: String -> IO Builtins.BuiltinByteString
decodeHexBS hex =
  case B16.decode (C.pack hex) of
    Left err      -> assertFailure ("Base16 decode failed: " ++ err) >> fail err
    Right decoded -> pure (Builtins.toBuiltin decoded)

mkPkh :: String -> IO PlutusV2.PubKeyHash
mkPkh hex = do
  bs <- decodeHexBS hex
  pure (PlutusV2.PubKeyHash bs)

mkCurrencySymbol :: String -> IO Value.CurrencySymbol
mkCurrencySymbol hex = do
  bs <- decodeHexBS hex
  pure (Value.CurrencySymbol bs)

mkTokenName :: String -> IO Value.TokenName
mkTokenName hex = do
  bs <- decodeHexBS hex
  pure (Value.TokenName bs)

mkAssetClass :: String -> String -> IO Value.AssetClass
mkAssetClass csHex tnHex = do
  cs <- mkCurrencySymbol csHex
  tn <- mkTokenName tnHex
  pure (Value.AssetClass (cs, tn))

assertInvestorEq :: Investor -> Investor -> IO ()
assertInvestorEq actual expected = do
  invPkh actual    @?= invPkh expected
  invAmount actual @?= invAmount expected

assertInvoiceDatumEq :: InvoiceDatum -> InvoiceDatum -> IO ()
assertInvoiceDatumEq actual expected = do
  idIssuer actual     @?= idIssuer expected
  idInvoiceNFT actual @?= idInvoiceNFT expected
  idFaceValue actual  @?= idFaceValue expected
  idRepayment actual  @?= idRepayment expected
  isRepaid actual     @?= isRepaid expected

  let actualInvs   = idInvestors actual
      expectedInvs = idInvestors expected

  length actualInvs @?= length expectedInvs
  sequence_ (zipWith assertInvestorEq actualInvs expectedInvs)

mkSampleInvoiceDatum :: IO InvoiceDatum
mkSampleInvoiceDatum = do
  issuerPkh   <- mkPkh "659ad08ff173857842dc6f8bb0105253b9713d2e5e370ccb880d6d50"
  investorPkh <- mkPkh "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  nftAc       <- mkAssetClass
                   "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
                   "696e766f696365" -- "invoice" in hex

  let investor = Investor
        { invPkh = investorPkh
        , invAmount = 10000000
        }

  pure InvoiceDatum
    { idIssuer = issuerPkh
    , idInvoiceNFT = nftAc
    , idFaceValue = 10000000
    , idRepayment = 12000000
    , idInvestors = [investor]
    , isRepaid = False
    }

mkUnfundedInvoiceDatum :: IO InvoiceDatum
mkUnfundedInvoiceDatum = do
  issuerPkh <- mkPkh "659ad08ff173857842dc6f8bb0105253b9713d2e5e370ccb880d6d50"
  nftAc     <- mkAssetClass
                 "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
                 "696e766f696365"

  pure InvoiceDatum
    { idIssuer = issuerPkh
    , idInvoiceNFT = nftAc
    , idFaceValue = 10000000
    , idRepayment = 12000000
    , idInvestors = []
    , isRepaid = False
    }

--------------------------------------------------------------------------------
-- Tests
--------------------------------------------------------------------------------

tests :: TestTree
tests = testGroup "Invoice Validator Tests"
  [ testCase "notFunded returns True for unfunded invoice" $ do
      dat <- mkUnfundedInvoiceDatum
      notFunded dat @?= True

  , testCase "notFunded returns False for funded invoice" $ do
      dat <- mkSampleInvoiceDatum
      notFunded dat @?= False

  , testCase "InvoiceDatum BuiltinData round-trip test" $ do
      dat <- mkSampleInvoiceDatum
      case PlutusTx.fromBuiltinData (PlutusTx.toBuiltinData dat) of
        Nothing       -> assertFailure "InvoiceDatum round-trip failed"
        Just decoded  -> assertInvoiceDatumEq decoded dat

  , testCase "InvoiceAction FundInvoice round-trip test" $ do
      case PlutusTx.fromBuiltinData (PlutusTx.toBuiltinData FundInvoice) of
        Just FundInvoice -> pure ()
        _                -> assertFailure "FundInvoice round-trip failed"

  , testCase "InvoiceAction RepayInvoice round-trip test" $ do
      case PlutusTx.fromBuiltinData (PlutusTx.toBuiltinData RepayInvoice) of
        Just RepayInvoice -> pure ()
        _                 -> assertFailure "RepayInvoice round-trip failed"

  , testCase "Validator hash is deterministic" $ do
      let h1 = plutusValidatorHash validator
          h2 = plutusValidatorHash validator
      h1 @?= h2

  , testCase "Testnet script address is Bech32 addr_test..." $ do
      let addr = toBech32ScriptAddress (CApi.Testnet (CApi.NetworkMagic 1)) validator
      assertBool ("Expected testnet address, got: " ++ addr) ("addr_test" `Prelude.take` 9 == "addr_test" && Prelude.take 9 addr == "addr_test")

  , testCase "Mainnet script address is Bech32 addr1..." $ do
      let addr = toBech32ScriptAddress CApi.Mainnet validator
      assertBool ("Expected mainnet address prefix, got: " ++ addr) (Prelude.take 5 addr == "addr1")
  ]