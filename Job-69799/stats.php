<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

$pdo = db();

// 1) Total funded (lovelace)
$stmt = $pdo->query("
  SELECT COALESCE(SUM(CAST(amount_lovelace AS SIGNED)), 0) AS total_funded
  FROM invoice_transactions
  WHERE action_type = 'fund_invoice'
");
$totalFunded = (string)($stmt->fetch()['total_funded'] ?? '0');

// 2) Minted invoices (unique invoice_ref)
$stmt = $pdo->query("
  SELECT COUNT(DISTINCT invoice_ref) AS minted_invoices
  FROM invoice_transactions
  WHERE action_type = 'create_invoice' AND invoice_ref IS NOT NULL AND invoice_ref <> ''
");
$mintedInvoices = (int)($stmt->fetch()['minted_invoices'] ?? 0);

// 3) Current APY (simple placeholder until you add yield fields)
// Average Yield = avg((repayment - face_value) / face_value) * 100
$stmt = $pdo->query("
  SELECT
    AVG((repayment_lovelace - face_value_lovelace) / face_value_lovelace) * 100 AS avg_yield
  FROM invoice_transactions
  WHERE action_type='create_invoice'
    AND face_value_lovelace IS NOT NULL
    AND repayment_lovelace IS NOT NULL
    AND face_value_lovelace > 0
");
$row = $stmt->fetch();
$currentApy = $row && $row['avg_yield'] !== null ? round((float)$row['avg_yield'], 2) : null;

echo json_encode([
  'ok' => true,
  'total_funded_lovelace' => $totalFunded,
  'minted_invoices' => $mintedInvoices,
  'current_apy_percent' => $currentApy
]);
