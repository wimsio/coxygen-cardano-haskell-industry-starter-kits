<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);

    $wallet = trim((string)($data['wallet_address'] ?? ''));
    $protocol = trim((string)($data['protocol_name'] ?? ''));
    $coverage = (float)($data['coverage_amount_ada'] ?? 0);
    $premium = (float)($data['premium_amount_ada'] ?? 0);
    $duration = (int)($data['duration_days'] ?? 90);

    if ($wallet === '' || $protocol === '' || $coverage <= 0 || $premium <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid purchase payload.']);
        exit;
    }

    $allowedDurations = [90, 180, 365];
    if (!in_array($duration, $allowedDurations, true)) {
        $duration = 90;
    }

    $startDate = new DateTimeImmutable('now');
    $endDate = $startDate->modify("+{$duration} days");

    $pdo = db();

    $stmt = $pdo->prepare("
        INSERT INTO cover_purchases (
            wallet_address,
            protocol_name,
            coverage_amount_ada,
            premium_amount_ada,
            duration_days,
            start_date,
            end_date,
            status
        ) VALUES (
            :wallet_address,
            :protocol_name,
            :coverage_amount_ada,
            :premium_amount_ada,
            :duration_days,
            :start_date,
            :end_date,
            'active'
        )
    ");

    $stmt->execute([
        ':wallet_address' => $wallet,
        ':protocol_name' => $protocol,
        ':coverage_amount_ada' => $coverage,
        ':premium_amount_ada' => $premium,
        ':duration_days' => $duration,
        ':start_date' => $startDate->format('Y-m-d H:i:s'),
        ':end_date' => $endDate->format('Y-m-d H:i:s'),
    ]);

    echo json_encode([
        'ok' => true,
        'id' => (int)$pdo->lastInsertId()
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}