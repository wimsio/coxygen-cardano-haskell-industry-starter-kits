<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    if (!isset($_FILES['document'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing file']);
        exit;
    }

    $file = $_FILES['document'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Upload failed']);
        exit;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']) ?: 'application/octet-stream';

    $allowed = [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'application/pdf' => 'pdf',
        'image/webp' => 'webp'
    ];

    if (!isset($allowed[$mime])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid file type']);
        exit;
    }

    $raw = file_get_contents($file['tmp_name']);
    if ($raw === false) {
        throw new Exception("Failed to read file");
    }

    $fileHashHex = hash('sha256', $raw);
    $ext = $allowed[$mime];

    // ============================
    // FILE STORAGE (NEW)
    // ============================
    $uploadDir = __DIR__ . '/uploads/claim_documents';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $fileName = $fileHashHex . '.' . $ext;
    $filePath = $uploadDir . '/' . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        throw new Exception("Failed to store file");
    }

    // PUBLIC URL
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';

    $documentUrl = $scheme . '://' . $host . '/uploads/claim_documents/' . $fileName;

    // ============================
    // DATABASE INSERT (MATCHES YOUR SCHEMA)
    // ============================
    $pdo = db();

    $stmt = $pdo->prepare("
    INSERT INTO claim_documents (
        actor_wallet_address,
        file_hash_hex,
        original_name,
        mime_type,
        file_size,
        asset_unit,
        document_url
    ) VALUES (
        :actor_wallet_address,
        :file_hash_hex,
        :original_name,
        :mime_type,
        :file_size,
        :asset_unit,
        :document_url
    )
");

$stmt->execute([
    ':actor_wallet_address' => $_POST['actor_wallet_address'] ?? null,
    ':file_hash_hex' => $fileHashHex,
    ':original_name' => $file['name'],
    ':mime_type' => $mime,
    ':file_size' => $file['size'],
    ':asset_unit' => $_POST['asset_unit'] ?? null,
    ':document_url' => $documentUrl
]);
    echo json_encode([
        'ok' => true,
        'file_hash_hex' => $fileHashHex,
        'document_url' => $documentUrl,
        'document_mime' => $mime
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}