<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $wallet = trim((string)($_GET['wallet_address'] ?? ''));

    if ($wallet === '') {
        echo json_encode(['ok' => true, 'has_active_cover' => false]);
        exit;
    }

    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT 1
        FROM cover_purchases
        WHERE wallet_address = :wallet
          AND status = 'active'
          AND end_date >= NOW()
        LIMIT 1
    ");

    $stmt->execute([':wallet' => $wallet]);

    $hasActive = (bool)$stmt->fetch();

    echo json_encode([
        'ok' => true,
        'has_active_cover' => $hasActive
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}