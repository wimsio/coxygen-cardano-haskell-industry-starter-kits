<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_security.php';

require_admin();
header('Content-Type: application/json');

echo json_encode([
    'ok' => true,
    'admin' => [
        'id' => admin_current_id(),
        'role' => admin_current_role(),
        'csrf_token' => admin_csrf_token(),
    ]
]);