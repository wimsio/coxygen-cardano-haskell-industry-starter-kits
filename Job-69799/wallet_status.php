<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

require_login();
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$address = trim((string)($input['address'] ?? ''));

if ($address === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing address']);
    exit;
}

$pdo = db();
$userId = (int)$_SESSION['user_id'];
$addrHash = hash('sha256', strtolower($address));

$stmt = $pdo->prepare("
  SELECT COUNT(*)
  FROM user_wallets
  WHERE user_id = ? AND status = 'verified'
");
$stmt->execute([$userId]);
$hasVerifiedWallet = ((int)$stmt->fetchColumn()) > 0;

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

$allowed = $hasVerifiedWallet ? $isThisWalletVerified : true;

echo json_encode([
    'ok' => true,
    'allowed' => $allowed,
    'hasVerifiedWallet' => $hasVerifiedWallet,
    'isThisWalletVerified' => $isThisWalletVerified
]);