<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $assetUnit = trim((string)($_GET['asset_unit'] ?? ''));

    if ($assetUnit === '') {
        echo json_encode([
            'ok' => true,
            'document' => null
        ]);
        exit;
    }

    $pdo = db();

    // ✅ IMPORTANT: include document_url column
    $stmt = $pdo->prepare("
        SELECT 
            id,
            actor_wallet_address,
            file_hash_hex,
            original_name,
            mime_type,
            file_size,
            created_at,
            asset_unit,
            document_url
        FROM claim_documents
        WHERE asset_unit = :asset_unit
        LIMIT 1
    ");
    $stmt->execute([':asset_unit' => $assetUnit]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode([
            'ok' => true,
            'document' => null
        ]);
        exit;
    }

    // ✅ FALLBACK (for old records that don’t have document_url yet)
    $documentUrl = $row['document_url'] ?? null;

    if (!$documentUrl) {
        // fallback to old method if needed
        $documentUrl = 'download_claim_document.php?asset_unit=' . rawurlencode($row['asset_unit']);
    }

    echo json_encode([
        'ok' => true,
        'document' => [
            'id' => (int)$row['id'],
            'asset_unit' => $row['asset_unit'],
            'actor_wallet_address' => $row['actor_wallet_address'],
            'document_name' => $row['original_name'],
            'document_mime' => $row['mime_type'],
            'document_size' => (int)$row['file_size'],

            // 🔥 THIS IS THE FIX
            'document_url' => $documentUrl,

            'file_hash_hex' => $row['file_hash_hex'],
            'created_at' => $row['created_at'],
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ]);
}