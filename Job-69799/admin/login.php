<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../csrf.php';

$errors = [];

if (!empty($_SESSION['admin_id'])) {
    redirect('/admin/dashboard.php');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validate_csrf($_POST['csrf_token'] ?? null)) {
        $errors[] = 'Invalid CSRF token.';
    }

    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = (string)($_POST['password'] ?? '');

    if (!$errors) {
        $pdo = db();
        $stmt = $pdo->prepare("SELECT id, password_hash FROM admins WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $admin = $stmt->fetch();

        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            $errors[] = 'Invalid admin credentials.';
        } else {
            session_regenerate_id(true);
            $_SESSION['admin_id'] = (int)$admin['id'];
            redirect('/admin/dashboard.php');
        }
    }
}
?>
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Admin Login</title>
  <style>
    body{font-family:Inter,system-ui;background:#f8fafc;color:#0f172a}
    .c{max-width:420px;margin:70px auto;background:#fff;padding:24px;border-radius:12px;box-shadow:0 10px 30px rgba(15,23,42,.08)}
    label{display:block;margin-top:14px;font-weight:600}
    input{width:100%;padding:12px;margin-top:6px;border-radius:10px;border:1px solid #cbd5e1}
    button{margin-top:18px;width:100%;padding:12px;border:0;border-radius:10px;background:#0f172a;color:#fff;font-weight:800;cursor:pointer}
    .err{background:#fee2e2;color:#991b1b;padding:12px;border-radius:10px;margin-top:12px}
  </style>
</head>
<body>
  <div class="c">
    <h2>Admin Login</h2>

    <?php if ($errors): ?>
      <div class="err">
        <ul>
          <?php foreach ($errors as $e): ?>
            <li><?= e($e) ?></li>
          <?php endforeach; ?>
        </ul>
      </div>
    <?php endif; ?>

    <form method="post" action="">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <label>Email</label>
      <input name="email" type="email" required>
      <label>Password</label>
      <input name="password" type="password" required>
      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>
