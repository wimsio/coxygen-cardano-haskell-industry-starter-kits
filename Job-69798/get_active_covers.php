<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $wallet = trim((string)($_GET['wallet_address'] ?? ''));

    if ($wallet === '') {
        echo json_encode(['ok' => true, 'covers' => []]);
        exit;
    }

    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT
            id,
            protocol_name,
            coverage_amount_ada,
            premium_amount_ada,
            duration_days,
            start_date,
            end_date,
            status
        FROM cover_purchases
        WHERE wallet_address = :wallet_address
          AND status = 'active'
          AND end_date >= NOW()
        ORDER BY created_at DESC
    ");
    $stmt->execute([':wallet_address' => $wallet]);

    $covers = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['end_date_display'] = date('M j, Y', strtotime((string)$row['end_date']));
        $covers[] = $row;
    }

    echo json_encode([
        'ok' => true,
        'covers' => $covers
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}