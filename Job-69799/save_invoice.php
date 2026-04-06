<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

require_login();
header('Content-Type: application/json');

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing file upload.']);
    exit;
}

$file = $_FILES['file'];

if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Upload failed.']);
    exit;
}

$maxBytes = 10 * 1024 * 1024;
if (($file['size'] ?? 0) <= 0 || ($file['size'] ?? 0) > $maxBytes) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid file size.']);
    exit;
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']) ?: 'application/octet-stream';

$allowed = [
    'application/pdf' => 'pdf',
    'image/png' => 'png',
    'image/jpeg' => 'jpg',
    'image/webp' => 'webp'
];

if (!isset($allowed[$mime])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Unsupported file type.']);
    exit;
}

$raw = file_get_contents($file['tmp_name']);
if ($raw === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not read uploaded file.']);
    exit;
}

$fileHashHex = hash('sha256', $raw);
$ext = $allowed[$mime];

$uploadDir = __DIR__ . '/storage/invoices';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not create upload directory.']);
    exit;
}

$storedName = $fileHashHex . '.' . $ext;
$storedPath = $uploadDir . '/' . $storedName;

if (!move_uploaded_file($file['tmp_name'], $storedPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not store uploaded file.']);
    exit;
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$documentUrl = $scheme . '://' . $host . '/storage/invoices/' . rawurlencode($storedName);

echo json_encode([
    'ok' => true,
    'file_hash_hex' => $fileHashHex,
    'document_path' => 'storage/invoices/' . $storedName,
    'document_url' => $documentUrl,
    'document_mime' => $mime
]);