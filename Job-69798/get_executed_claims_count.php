<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/admin_security.php';

require_admin();
header('Content-Type: application/json');

try {
    $pdo = db();

    $stmt = $pdo->query("
        SELECT COUNT(*) AS total
        FROM insurance_transactions
        WHERE action_type = 'execute_claim'
    ");

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'ok' => true,
        'total' => (int)$row['total']
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}