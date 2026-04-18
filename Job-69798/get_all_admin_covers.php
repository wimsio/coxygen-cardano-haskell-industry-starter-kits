<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/admin_security.php';

require_admin();
header('Content-Type: application/json');

try {
    $pdo = db();

    $stmt = $pdo->query("
        SELECT
            id,
            protocol_name,
            premium_amount_ada,
            coverage_amount_ada,
            end_date,
            wallet_address
        FROM cover_purchases
        WHERE protocol_name <> 'Sundaeswap'
        ORDER BY created_at DESC
        LIMIT 250
    ");

    $covers = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $covers[] = [
            'policy_id' => 'POL-' . str_pad((string)$row['id'], 5, '0', STR_PAD_LEFT),
            'protocol' => $row['protocol_name'],
            'premium_ada' => (float)$row['premium_amount_ada'],
            'coverage_ada' => (float)$row['coverage_amount_ada'],
            'expiry' => date('M d, Y', strtotime((string)$row['end_date'])),
            'wallet_address' => $row['wallet_address'],
        ];
    }

    echo json_encode(['ok' => true, 'covers' => $covers]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}