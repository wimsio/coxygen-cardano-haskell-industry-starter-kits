<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

require_login();
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON body.']);
    exit;
}

$txHash = trim((string)($input['tx_hash'] ?? ''));
$actionType = trim((string)($input['action_type'] ?? ''));
$invoiceRef = isset($input['invoice_ref']) ? trim((string)$input['invoice_ref']) : null;
$actorAddr = trim((string)($input['actor_wallet_address'] ?? ''));
$counterAddr = isset($input['counterparty_wallet_address']) ? trim((string)$input['counterparty_wallet_address']) : null;
$amount = isset($input['amount_lovelace']) && $input['amount_lovelace'] !== '' ? (string)$input['amount_lovelace'] : null;
$assetUnit = isset($input['asset_unit']) && $input['asset_unit'] !== '' ? trim((string)$input['asset_unit']) : 'lovelace';
$faceValue = isset($input['face_value_lovelace']) && $input['face_value_lovelace'] !== '' ? (string)$input['face_value_lovelace'] : null;
$repaymentValue = isset($input['repayment_lovelace']) && $input['repayment_lovelace'] !== '' ? (string)$input['repayment_lovelace'] : null;

$documentPath = isset($input['document_path']) ? trim((string)$input['document_path']) : null;
$documentUrl = isset($input['document_url']) ? trim((string)$input['document_url']) : null;
$documentMime = isset($input['document_mime']) ? trim((string)$input['document_mime']) : null;
$nftPolicyId = isset($input['nft_policy_id']) ? trim((string)$input['nft_policy_id']) : null;
$nftAssetName = isset($input['nft_asset_name']) ? trim((string)$input['nft_asset_name']) : null;
$fileHashHex = isset($input['file_hash_hex']) ? trim((string)$input['file_hash_hex']) : null;

$allowedActions = ['create_invoice', 'fund_invoice', 'repay_invoice'];

$txHashOk = (bool)preg_match('/^[0-9a-f]{64}$/i', $txHash);
$actionOk = in_array($actionType, $allowedActions, true);
$addrOk = (bool)preg_match('/^(addr|addr_test)1[0-9a-z]{20,}$/', strtolower($actorAddr));

$counterOk = true;
if ($counterAddr !== null && $counterAddr !== '') {
    $parts = array_filter(array_map('trim', explode(',', $counterAddr)));
    foreach ($parts as $p) {
        if (!preg_match('/^(addr|addr_test)1[0-9a-z]{20,}$/', strtolower($p))) {
            $counterOk = false;
            break;
        }
    }
}

$invoiceOk = true;
if ($invoiceRef !== null && $invoiceRef !== '') {
    $invoiceOk = (bool)preg_match('/^[0-9a-f]{56,191}$/i', $invoiceRef);
}

$amountOk = $amount === null || preg_match('/^\d{1,30}$/', $amount);
$faceOk = $faceValue === null || preg_match('/^\d{1,30}$/', $faceValue);
$repayOk = $repaymentValue === null || preg_match('/^\d{1,30}$/', $repaymentValue);
$assetOk = (bool)preg_match('/^[a-zA-Z0-9._-]{1,64}$/', $assetUnit);

if (!$txHashOk || !$actionOk || !$addrOk || !$counterOk || !$invoiceOk || !$amountOk || !$faceOk || !$repayOk || !$assetOk) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid transaction payload.']);
    exit;
}

$actorHash = hash('sha256', strtolower($actorAddr));
$counterHash = $counterAddr ? hash('sha256', strtolower($counterAddr)) : null;

try {
    $pdo = db();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
      INSERT INTO invoice_transactions
        (tx_hash, action_type, invoice_ref, actor_wallet_address, actor_wallet_hash,
         counterparty_wallet_address, counterparty_wallet_hash,
         amount_lovelace, asset_unit, face_value_lovelace, repayment_lovelace, status)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
      ON DUPLICATE KEY UPDATE
        invoice_ref = VALUES(invoice_ref),
        counterparty_wallet_address = VALUES(counterparty_wallet_address),
        counterparty_wallet_hash = VALUES(counterparty_wallet_hash),
        amount_lovelace = VALUES(amount_lovelace),
        asset_unit = VALUES(asset_unit),
        face_value_lovelace = VALUES(face_value_lovelace),
        repayment_lovelace = VALUES(repayment_lovelace)
    ");

    $stmt->execute([
        $txHash,
        $actionType,
        $invoiceRef,
        $actorAddr,
        $actorHash,
        $counterAddr,
        $counterHash,
        $amount,
        $assetUnit,
        $faceValue,
        $repaymentValue
    ]);

    $userId = (int)$_SESSION['user_id'];

    if ($actionType === 'create_invoice') {
        if (!$invoiceRef || !$faceValue || !$repaymentValue || !$documentPath || !$documentUrl || !$documentMime || !$nftPolicyId || !$nftAssetName || !$fileHashHex) {
            throw new RuntimeException('Missing invoice creation fields.');
        }

        $stmt = $pdo->prepare("
          INSERT INTO invoices
            (invoice_ref, issuer_user_id, issuer_wallet_address, issuer_wallet_hash,
             nft_policy_id, nft_asset_name, nft_unit,
             face_value_lovelace, repayment_lovelace,
             document_path, document_url, document_mime, file_hash_hex,
             mint_tx_hash, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'minted')
          ON DUPLICATE KEY UPDATE
            issuer_user_id = VALUES(issuer_user_id),
            issuer_wallet_address = VALUES(issuer_wallet_address),
            issuer_wallet_hash = VALUES(issuer_wallet_hash),
            nft_policy_id = VALUES(nft_policy_id),
            nft_asset_name = VALUES(nft_asset_name),
            nft_unit = VALUES(nft_unit),
            face_value_lovelace = VALUES(face_value_lovelace),
            repayment_lovelace = VALUES(repayment_lovelace),
            document_path = VALUES(document_path),
            document_url = VALUES(document_url),
            document_mime = VALUES(document_mime),
            file_hash_hex = VALUES(file_hash_hex),
            mint_tx_hash = VALUES(mint_tx_hash),
            status = 'minted'
        ");

        $stmt->execute([
            $invoiceRef,
            $userId,
            $actorAddr,
            $actorHash,
            $nftPolicyId,
            $nftAssetName,
            $invoiceRef,
            $faceValue,
            $repaymentValue,
            $documentPath,
            $documentUrl,
            $documentMime,
            $fileHashHex,
            $txHash
        ]);
    } elseif ($actionType === 'fund_invoice') {
        if (!$invoiceRef) {
            throw new RuntimeException('Missing invoice ref for funding.');
        }

        $stmt = $pdo->prepare("
          UPDATE invoices
          SET
            status = 'funded',
            funded_by_wallet_address = ?,
            funded_by_wallet_hash = ?,
            fund_tx_hash = ?
          WHERE invoice_ref = ?
        ");
        $stmt->execute([
            $actorAddr,
            $actorHash,
            $txHash,
            $invoiceRef
        ]);
    } elseif ($actionType === 'repay_invoice') {
        if (!$invoiceRef) {
            throw new RuntimeException('Missing invoice ref for repayment.');
        }

        $stmt = $pdo->prepare("
          UPDATE invoices
          SET
            status = 'repaid',
            repay_tx_hash = ?
          WHERE invoice_ref = ?
        ");
        $stmt->execute([
            $txHash,
            $invoiceRef
        ]);
    }

    $pdo->commit();
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('log_tx error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error.']);
}