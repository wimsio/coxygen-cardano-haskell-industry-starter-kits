<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function admin_start_session(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function admin_is_logged_in(): bool {
    admin_start_session();
    return !empty($_SESSION['admin_id']);
}

function require_admin(): void {
    admin_start_session();

    if (empty($_SESSION['admin_id'])) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'ok' => false,
            'error' => 'Admin authentication required.'
        ]);
        exit;
    }
}

function require_admin_page(): void {
    admin_start_session();

    if (empty($_SESSION['admin_id'])) {
        header('Location: admin_login.html');
        exit;
    }
}