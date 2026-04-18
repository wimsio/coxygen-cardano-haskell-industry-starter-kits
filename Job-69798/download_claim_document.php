<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

try {
    // 🔒 Prevent any accidental output before headers
    if (ob_get_length()) ob_end_clean();

    $assetUnit = trim((string)($_GET['asset_unit'] ?? ''));

    if ($assetUnit === '') {
        http_response_code(400);
        exit('Missing asset_unit');
    }

    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT original_name, mime_type, file_size, file_blob
        FROM claim_documents
        WHERE asset_unit = :asset_unit
        LIMIT 1
    ");
    $stmt->execute([':asset_unit' => $assetUnit]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        exit('Document not found');
    }

    // 🔥 Important headers for proper display
    header('Content-Type: ' . $row['mime_type']);
    header('Content-Length: ' . (string)$row['file_size']);
    header('Content-Disposition: inline; filename="' . basename($row['original_name']) . '"');
    header('Cache-Control: public, max-age=86400');
    header('X-Content-Type-Options: nosniff');

    // 🧠 Output binary safely
    echo $row['file_blob'];
    flush();
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo 'Server error: ' . $e->getMessage();
}