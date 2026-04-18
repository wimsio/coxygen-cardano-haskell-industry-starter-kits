<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

$pdo = db();

// total pool deposited
$stmt = $pdo->query("
  SELECT COALESCE(SUM(CAST(amount_lovelace AS SIGNED)), 0) AS v
  FROM insurance_transactions
  WHERE action_type = 'deposit_pool'
");
$totalPoolDeposited = (string)($stmt->fetch()['v'] ?? '0');

// total withdrawn
$stmt = $pdo->query("
  SELECT COALESCE(SUM(CAST(amount_lovelace AS SIGNED)), 0) AS v
  FROM insurance_transactions
  WHERE action_type = 'withdraw_shares'
");
$totalWithdrawn = (string)($stmt->fetch()['v'] ?? '0');

// claims submitted (active claims)
$stmt = $pdo->query("
  SELECT COALESCE(COUNT(*), 0) AS v
  FROM insurance_transactions
  WHERE action_type = 'submit_claim'
");
$totalClaimsSubmitted = (int)($stmt->fetch()['v'] ?? 0);

// claims executed
$stmt = $pdo->query("
  SELECT COALESCE(COUNT(*), 0) AS v
  FROM insurance_transactions
  WHERE action_type = 'execute_claim'
");
$totalClaimsExecuted = (int)($stmt->fetch()['v'] ?? 0);

echo json_encode([
  'ok' => true,
  'stats' => [
    'total_pool_deposited' => $totalPoolDeposited,
    'total_withdrawn' => $totalWithdrawn,
    'total_claims_submitted' => $totalClaimsSubmitted,
    'total_claims_executed' => $totalClaimsExecuted,
  ]
], JSON_UNESCAPED_SLASHES);