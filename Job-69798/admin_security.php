<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_auth.php';

function admin_current_id(): int {
    admin_start_session();
    return (int)($_SESSION['admin_id'] ?? 0);
}

function admin_current_role(): string {
    admin_start_session();
    return (string)($_SESSION['admin_role'] ?? '');
}

function require_admin_role(array $allowedRoles): void {
    require_admin();
    $role = admin_current_role();

    if (!in_array($role, $allowedRoles, true)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'ok' => false,
            'error' => 'Insufficient admin privileges.'
        ]);
        exit;
    }
}

function admin_csrf_token(): string {
    admin_start_session();

    if (empty($_SESSION['admin_csrf_token'])) {
        $_SESSION['admin_csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['admin_csrf_token'];
}

function require_admin_csrf(): void {
    admin_start_session();

    $sessionToken = (string)($_SESSION['admin_csrf_token'] ?? '');
    $headerToken = (string)($_SERVER['HTTP_X_ADMIN_CSRF'] ?? '');

    if ($sessionToken === '' || $headerToken === '' || !hash_equals($sessionToken, $headerToken)) {
        http_response_code(419);
        header('Content-Type: application/json');
        echo json_encode([
            'ok' => false,
            'error' => 'Invalid CSRF token.'
        ]);
        exit;
    }
}