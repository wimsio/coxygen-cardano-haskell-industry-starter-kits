<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

try {
  $address = trim((string)($_GET['address'] ?? ''));
  if ($address === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing address']);
    exit;
  }

  // Normalize to reduce mismatch (depends on how you stored it)
  $normalized = strtolower($address);

  $pdo = db();
  $stmt = $pdo->prepare("
    SELECT tx_hash, action_type, reference_id, amount_lovelace, asset_unit, status, created_at
    FROM insurance_transactions
    WHERE LOWER(actor_wallet_address) = ? OR LOWER(counterparty_wallet_address) = ?
    ORDER BY id DESC
    LIMIT 200
  ");
  $stmt->execute([$normalized, $normalized]);

  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode([
    'ok' => true,
    'count' => count($rows),
    'transactions' => $rows
  ]);
} catch (Throwable $e) {
  error_log("tx_history.php error: " . $e->getMessage());
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Server error']);
}
