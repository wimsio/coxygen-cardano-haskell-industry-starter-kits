<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

require_login();
header('Content-Type: application/json');

try {
    $pdo = db();

    $limit = (int)($_GET['limit'] ?? 10);
    if ($limit <= 0) $limit = 10;
    if ($limit > 50) $limit = 50;

    $stmt = $pdo->prepare("
      SELECT
        tx_hash,
        action_type,
        invoice_ref,
        amount_lovelace,
        asset_unit,
        status,
        created_at
      FROM invoice_transactions
      ORDER BY id DESC
      LIMIT ?
    ");
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode(['ok' => true, 'transactions' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    error_log('recent_transactions error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error.']);
}