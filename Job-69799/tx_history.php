<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

require_login();
header('Content-Type: application/json');

$address = trim((string)($_GET['address'] ?? ''));
if ($address === '' || !preg_match('/^(addr|addr_test)1[0-9a-z]{20,}$/', strtolower($address))) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid address.']);
    exit;
}

$userId = (int)$_SESSION['user_id'];
$addrHash = hash('sha256', strtolower($address));

$pdo = db();

$check = $pdo->prepare("
  SELECT 1
  FROM user_wallets
  WHERE user_id = ? AND wallet_address_hash = ? AND status = 'verified'
  LIMIT 1
");
$check->execute([$userId, $addrHash]);

if (!$check->fetchColumn()) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Address is not registered to your account.']);
    exit;
}

$stmt = $pdo->prepare("
  SELECT tx_hash, action_type, invoice_ref, amount_lovelace, asset_unit, status, created_at
  FROM invoice_transactions
  WHERE actor_wallet_hash = ? OR counterparty_wallet_hash = ?
  ORDER BY id DESC
  LIMIT 200
");
$stmt->execute([$addrHash, $addrHash]);

echo json_encode(['ok' => true, 'transactions' => $stmt->fetchAll()]);