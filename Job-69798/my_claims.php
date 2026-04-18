<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $address = trim((string)($_GET['address'] ?? ''));

    if ($address === '') {
        echo json_encode(['ok' => true, 'claims' => []]);
        exit;
    }

    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT 
            asset_unit,
            document_url,
            original_name,
            mime_type,
            file_size,
            created_at
        FROM claim_documents
        WHERE actor_wallet_address = :address
        ORDER BY created_at DESC
    ");

    $stmt->execute([':address' => $address]);

    $claims = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'ok' => true,
        'claims' => $claims
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}