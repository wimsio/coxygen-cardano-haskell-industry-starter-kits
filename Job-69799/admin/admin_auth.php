<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

function require_admin(): void
{
    if (empty($_SESSION['admin_id'])) {
        redirect('/admin/login.php');
    }
}

function current_admin(): ?array
{
    if (empty($_SESSION['admin_id'])) return null;

    $pdo = db();
    $stmt = $pdo->prepare("SELECT id, email, role FROM admins WHERE id = ? LIMIT 1");
    $stmt->execute([(int)$_SESSION['admin_id']]);
    $a = $stmt->fetch();
    return $a ?: null;
}
