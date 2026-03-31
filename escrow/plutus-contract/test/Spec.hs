{-# LANGUAGE OverloadedStrings #-}

{-|
Module      : Spec
Description : Unit tests for Escrow Contract
License     : MIT
-}

module Main where

import           Test.Tasty
import           Test.Tasty.HUnit
import qualified PlutusTx.Prelude           as P
import           Plutus.V2.Ledger.Api

import           EscrowContract

-- | Main test runner
main :: IO ()
main = defaultMain tests

tests :: TestTree
tests = testGroup "Escrow Contract Tests"
    [ datumTests
    , actionTests
    ]

-- | Tests for EscrowDatum creation
datumTests :: TestTree
datumTests = testGroup "Datum Tests"
    [ testCase "Create valid datum" $ do
        let buyerPkh = "aabbccdd"
            sellerPkh = "11223344"
            deadlineTime = POSIXTime 1700000000000
            datum = mkEscrowDatum buyerPkh sellerPkh deadlineTime
        
        buyer datum @?= buyerPkh
        seller datum @?= sellerPkh
        deadline datum @?= deadlineTime
    
    , testCase "Datum fields are independent" $ do
        let datum1 = mkEscrowDatum "buyer1" "seller1" (POSIXTime 1000)
            datum2 = mkEscrowDatum "buyer2" "seller2" (POSIXTime 2000)
        
        buyer datum1 @?/= buyer datum2
        seller datum1 @?/= seller datum2
    ]

-- | Tests for EscrowAction
actionTests :: TestTree
actionTests = testGroup "Action Tests"
    [ testCase "Release action exists" $ do
        let action = Release
        action @?= Release
    
    , testCase "Refund action exists" $ do
        let action = Refund
        action @?= Refund
    
    , testCase "Actions are distinct" $ do
        Release @?/= Refund
    ]

-- | Helper for not equal assertion
(@?/=) :: (Eq a, Show a) => a -> a -> Assertion
actual @?/= expected
    | actual /= expected = return ()
    | otherwise = assertFailure $ "Expected different values but got: " ++ show actual
