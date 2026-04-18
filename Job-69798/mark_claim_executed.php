<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/admin_security.php';

require_admin_role(['admin']);
require_admin_csrf();

header('Content-Type: application/json');

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);

    $assetUnit = trim((string)($data['asset_unit'] ?? ''));
    $txHash = strtolower(trim((string)($data['tx_hash'] ?? '')));

    if ($assetUnit === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'asset_unit is required.']);
        exit;
    }

    if ($txHash !== '' && !preg_match('/^[0-9a-f]{64}$/', $txHash)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid tx_hash.']);
        exit;
    }

    $pdo = db();

    $stmt = $pdo->prepare("
        INSERT INTO admin_claim_reviews (
            asset_unit, status, reason, tx_hash, acted_by_admin_id, acted_by_role, acted_at, created_at, updated_at
        ) VALUES (
            :asset_unit, 'executed', NULL, :tx_hash, :admin_id, :admin_role, NOW(), NOW(), NOW()
        )
        ON DUPLICATE KEY UPDATE
            status = 'executed',
            reason = NULL,
            tx_hash = VALUES(tx_hash),
            acted_by_admin_id = VALUES(acted_by_admin_id),
            acted_by_role = VALUES(acted_by_role),
            acted_at = NOW(),
            updated_at = NOW()
    ");

    $stmt->execute([
        ':asset_unit' => $assetUnit,
        ':tx_hash' => ($txHash !== '' ? $txHash : null),
        ':admin_id' => admin_current_id(),
        ':admin_role' => admin_current_role(),
    ]);

    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}