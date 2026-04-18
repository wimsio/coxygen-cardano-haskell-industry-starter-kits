<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

require_login();

$input = json_decode(file_get_contents('php://input'), true);
$address = trim((string)($input['address'] ?? ''));

if ($address === '') {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => 'Missing address']);
    exit;
}

$pdo = db();
$userId = (int)$_SESSION['user_id'];
$addrHash = hash('sha256', strtolower($address));

// 1) Does user already have ANY verified wallet?
$stmt = $pdo->prepare("
  SELECT COUNT(*) 
  FROM user_wallets 
  WHERE user_id = ? AND status = 'verified'
");
$stmt->execute([$userId]);
$hasVerifiedWallet = ((int)$stmt->fetchColumn()) > 0;

// 2) Is THIS address one of the verified wallets?
$stmt = $pdo->prepare("
  SELECT 1
  FROM user_wallets
  WHERE user_id = ?
    AND wallet_address_hash = ?
    AND status = 'verified'
  LIMIT 1
");
$stmt->execute([$userId, $addrHash]);
$isThisWalletVerified = (bool)$stmt->fetchColumn();

// Logic:
// - If user has no verified wallet yet, we allow this wallet so it can be bound now.
// - If user already has verified wallet(s), then only allow if this wallet matches.
$allowed = $hasVerifiedWallet ? $isThisWalletVerified : true;

header('Content-Type: application/json');
echo json_encode([
  'ok' => true,
  'allowed' => $allowed,
  'hasVerifiedWallet' => $hasVerifiedWallet,
  'isThisWalletVerified' => $isThisWalletVerified
]);
