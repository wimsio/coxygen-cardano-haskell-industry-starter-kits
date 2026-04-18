<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

$pdo = db();

$stmt = $pdo->query("
  SELECT tx_hash, action_type, reference_id, amount_lovelace, asset_unit, status, created_at
  FROM insurance_transactions
  ORDER BY id DESC
  LIMIT 10
");

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
  'ok' => true,
  'count' => count($rows),
  'transactions' => $rows
], JSON_UNESCAPED_SLASHES);