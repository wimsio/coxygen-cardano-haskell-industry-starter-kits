<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/admin_auth.php';

admin_start_session();
header('Content-Type: application/json');

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);

    $email = trim((string)($data['email'] ?? ''));
    $password = (string)($data['password'] ?? '');

    if ($email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Email and password are required.']);
        exit;
    }

    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT id, email, password_hash, role
        FROM admins
        WHERE email = :email
        LIMIT 1
    ");
    $stmt->execute([':email' => $email]);

    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Invalid credentials.']);
        exit;
    }

    $_SESSION['admin_id'] = (int)$admin['id'];
    $_SESSION['admin_email'] = $admin['email'];
    $_SESSION['admin_role'] = $admin['role'];

    echo json_encode([
        'ok' => true,
        'admin' => [
            'id' => (int)$admin['id'],
            'email' => $admin['email'],
            'role' => $admin['role'],
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}