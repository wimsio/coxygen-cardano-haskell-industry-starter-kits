<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/csrf.php';
require_once __DIR__ . '/helpers.php';

start_secure_session();

$errors = [];
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!validate_csrf($_POST['csrf_token'] ?? null)) {
        $errors[] = 'Invalid CSRF token. Please refresh the page and try again.';
    }

    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    $confirmPassword = (string)($_POST['confirm_password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Please enter a valid email address.';
    }

    if (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters long.';
    }

    if ($password !== $confirmPassword) {
        $errors[] = 'Passwords do not match.';
    }

    if (!$errors) {
        try {
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            // ✅ Minimal insert. Do NOT depend on email_verified / email_verified_at existing.
            $stmt = $pdo->prepare(
                "INSERT INTO users (email, password_hash)
                 VALUES (:email, :password_hash)"
            );

            $stmt->execute([
                ':email' => $email,
                ':password_hash' => $passwordHash,
            ]);

            // ✅ Redirect to login page after successful registration
            redirect('/login.php?registered=1');

        } catch (PDOException $e) {
            if ((int)($e->errorInfo[1] ?? 0) === 1062) {
                $errors[] = 'An account with this email already exists.';
            } else {
                error_log('Register error: ' . $e->getMessage());
                $errors[] = 'Unable to create account. Please try again later.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Register - Invoice Finance</title>
  <style>
    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; }
    .container { max-width: 480px; margin: 60px auto; background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
    h1 { margin-bottom: 12px; }
    label { display: block; margin-top: 16px; font-weight: 600; }
    input { width: 100%; padding: 12px; margin-top: 8px; border-radius: 8px; border: 1px solid #cbd5f5; }
    button { margin-top: 24px; width: 100%; padding: 12px; border: none; background: #dc2626; color: #fff; font-weight: 700; border-radius: 8px; cursor: pointer; }
    .error { background: #fee2e2; color: #991b1b; padding: 12px; border-radius: 8px; margin-top: 16px; }
    .link { margin-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Create your account</h1>
    <p>Register to access the platform.</p>

    <?php if ($errors): ?>
      <div class="error">
        <ul>
          <?php foreach ($errors as $error): ?>
            <li><?= e($error) ?></li>
          <?php endforeach; ?>
        </ul>
      </div>
    <?php endif; ?>

    <form method="post" action="">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">

      <label for="email">Email</label>
      <input type="email" id="email" name="email" required>

      <label for="password">Password</label>
      <input type="password" id="password" name="password" required>

      <label for="confirm_password">Confirm Password</label>
      <input type="password" id="confirm_password" name="confirm_password" required>

      <button type="submit">Register</button>
    </form>

    <div class="link">
      Already have an account? <a href="/login.php">Login</a>
    </div>
  </div>
</body>
</html>