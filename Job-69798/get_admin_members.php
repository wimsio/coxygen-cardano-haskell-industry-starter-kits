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
            wallet_address,
            COUNT(*) AS covers,
            MAX(end_date) AS expiry
        FROM cover_purchases
        GROUP BY wallet_address
        ORDER BY covers DESC, expiry DESC
    ");

    $members = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $members[] = [
            'wallet' => $row['wallet_address'],
            'covers' => (int)$row['covers'],
            'expiry' => $row['expiry'],
        ];
    }

    echo json_encode(['ok' => true, 'members' => $members]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}