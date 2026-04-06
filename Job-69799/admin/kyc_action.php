<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/../csrf.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !validate_csrf($_POST['csrf_token'] ?? null)) {
    redirect('/admin/dashboard.php');
}

$action = (string)($_POST['action'] ?? '');
$kycId = (int)($_POST['kyc_id'] ?? 0);
$note = trim((string)($_POST['note'] ?? ''));

if ($kycId <= 0 || !in_array($action, ['approve','reject'], true)) {
    redirect('/admin/dashboard.php');
}

$status = $action === 'approve' ? 'approved' : 'rejected';

$pdo = db();
$admin = current_admin();
$adminId = (int)($admin['id'] ?? 0);

$stmt = $pdo->prepare("
  UPDATE kyc_submissions
  SET status = ?, reviewed_by_admin_id = ?, reviewed_at = NOW(), review_note = ?
  WHERE id = ?
");
$stmt->execute([$status, $adminId, ($note !== '' ? $note : null), $kycId]);

redirect('/admin/dashboard.php');
