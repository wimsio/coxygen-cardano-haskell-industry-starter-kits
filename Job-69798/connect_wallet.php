<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

require_login();

header('Content-Type: application/json');

$userId = $_SESSION['user_id'];

$input = json_decode(file_get_contents('php://input'), true);

$walletAddress = trim((string)($input['wallet_address'] ?? ''));

if ($walletAddress === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing wallet address']);
    exit;
}

try {
    $pdo = db();

    $stmt = $pdo->prepare("
        INSERT INTO user_wallets (user_id, wallet_address, last_connected)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            wallet_address = VALUES(wallet_address),
            last_connected = NOW()
    ");

    $stmt->execute([$userId, $walletAddress]);

    echo json_encode(['ok' => true]);

} catch (Throwable $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false]);
}
