<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);

    $assetUnit = trim((string)($data['asset_unit'] ?? ''));
    $wallet = trim((string)($data['wallet_address'] ?? ''));
    $description = trim((string)($data['description'] ?? ''));

    if ($assetUnit === '' || $description === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing description payload.']);
        exit;
    }

    $pdo = db();

    $stmt = $pdo->prepare("
        INSERT INTO claim_descriptions (asset_unit, wallet_address, description)
        VALUES (:asset_unit, :wallet_address, :description)
        ON DUPLICATE KEY UPDATE
            wallet_address = VALUES(wallet_address),
            description = VALUES(description)
    ");
    $stmt->execute([
        ':asset_unit' => $assetUnit,
        ':wallet_address' => $wallet ?: null,
        ':description' => $description
    ]);

    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}