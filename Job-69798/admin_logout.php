<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_auth.php';

admin_start_session();

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'],
        $params['domain'],
        (bool)$params['secure'],
        (bool)$params['httponly']
    );
}

session_destroy();

header('Location: admin_login.html');
exit;