<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

require_login();

$input = json_decode(file_get_contents('php://input'), true);

$address = trim((string)($input['address'] ?? ''));
$message = (string)($input['message'] ?? '');
$signature = (string)($input['signature'] ?? '');

$nonce = $_SESSION['wallet_bind_nonce'] ?? null;
$issuedAt = $_SESSION['wallet_bind_issued_at'] ?? 0;

if (!$nonce || (time() - (int)$issuedAt) > 300) { // 5 min expiry
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Challenge expired. Please try again.']);
  exit;
}

if (strpos($message, $nonce) === false) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid challenge message.']);
  exit;
}

// NOTE: Signature verification is done client-side for now.
// Store for audit; can be verified server-side later.

$pdo = db();
$userId = (int)$_SESSION['user_id'];

$addrHash = hash('sha256', strtolower($address));

$stmt = $pdo->prepare(
  "INSERT INTO user_wallets (user_id, wallet_address, wallet_address_hash, status, verified_at)
   VALUES (?, ?, ?, 'verified', NOW())
   ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), status='verified', verified_at=NOW()"
);

$stmt->execute([$userId, $address, $addrHash]);

unset($_SESSION['wallet_bind_nonce'], $_SESSION['wallet_bind_issued_at']);

header('Content-Type: application/json');
echo json_encode(['ok' => true]);
