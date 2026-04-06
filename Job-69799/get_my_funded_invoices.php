<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

require_login();
header('Content-Type: application/json');

try {
    $pdo = db();
    $userId = (int)$_SESSION['user_id'];

    $stmt = $pdo->prepare("
      SELECT
        invoice_ref,
        issuer_user_id,
        issuer_wallet_address,
        nft_policy_id,
        nft_asset_name,
        nft_unit,
        face_value_lovelace,
        repayment_lovelace,
        document_url,
        document_mime,
        mint_tx_hash,
        fund_tx_hash,
        status,
        created_at,
        updated_at
      FROM invoices
      WHERE issuer_user_id = ? AND status = 'funded'
      ORDER BY updated_at DESC
    ");
    $stmt->execute([$userId]);

    echo json_encode([
        'ok' => true,
        'invoices' => $stmt->fetchAll()
    ]);
} catch (Throwable $e) {
    error_log('get_my_funded_invoices error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error.']);
}