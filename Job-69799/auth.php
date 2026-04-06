<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

/**
 * Returns currently logged-in user (or null).
 */
function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $stmt = db()->prepare('SELECT id, email FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([ (int)$_SESSION['user_id'] ]);
    $user = $stmt->fetch();

    return $user ?: null;
}

/**
 * Enforce login.
 */
function require_login(): void
{
    if (empty($_SESSION['user_id'])) {
        redirect('/login.php');
    }
}

/**
 * Logout helper (optional).
 */
function logout(): void
{
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
    redirect('/login.php');
}