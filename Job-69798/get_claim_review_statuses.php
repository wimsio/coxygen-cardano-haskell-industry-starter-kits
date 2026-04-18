<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/admin_security.php';

//require_admin();
header('Content-Type: application/json');

try {
    $pdo = db();

    $stmt = $pdo->query("
        SELECT asset_unit, status, reason, tx_hash, acted_by_admin_id, acted_by_role, acted_at
        FROM admin_claim_reviews
        ORDER BY updated_at DESC
    ");

    $map = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $map[$row['asset_unit']] = [
            'status' => $row['status'],
            'reason' => $row['reason'],
            'tx_hash' => $row['tx_hash'],
            'acted_by_admin_id' => $row['acted_by_admin_id'],
            'acted_by_role' => $row['acted_by_role'],
            'acted_at' => $row['acted_at'],
        ];
    }

    echo json_encode(['ok' => true, 'reviews' => $map]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}