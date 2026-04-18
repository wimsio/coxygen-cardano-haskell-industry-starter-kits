<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

try {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    $hash = isset($_GET['hash']) ? trim((string) $_GET['hash']) : '';

    if ($id <= 0 && $hash === '') {
        http_response_code(400);
        echo 'Missing document id or hash';
        exit;
    }

    $pdo = db();

    if ($id > 0) {
        $stmt = $pdo->prepare("
            SELECT original_name, mime_type, file_size, file_blob
            FROM claim_documents
            WHERE id = :id
            LIMIT 1
        ");
        $stmt->execute(['id' => $id]);
    } else {
        $stmt = $pdo->prepare("
            SELECT original_name, mime_type, file_size, file_blob
            FROM claim_documents
            WHERE file_hash_hex = :hash
            LIMIT 1
        ");
        $stmt->execute(['hash' => $hash]);
    }

    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        http_response_code(404);
        echo 'Document not found';
        exit;
    }

    header('Content-Type: ' . $row['mime_type']);
    header('Content-Length: ' . (string) $row['file_size']);
    header('Content-Disposition: inline; filename="' . rawurlencode((string) $row['original_name']) . '"');
    header('X-Content-Type-Options: nosniff');

    echo $row['file_blob'];
} catch (Throwable $e) {
    http_response_code(500);
    echo 'Server error';
}