<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/csrf.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

$errors = [];
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!validate_csrf($_POST['csrf_token'] ?? null)) {
        $errors[] = 'Invalid CSRF token. Please refresh the page and try again.';
    }

    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = (string)($_POST['password'] ?? '');

    if (!$errors) {
        $stmt = $pdo->prepare(
            "SELECT id, email, password_hash
             FROM users
             WHERE email = :email
             LIMIT 1"
        );

        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            $errors[] = 'Invalid email or password.';
        } else {
            session_regenerate_id(true);
            $_SESSION['user_id'] = (int)$user['id'];

            // ✅ After login, go straight to your dApp entry
            // Change this if your dApp entry is main.html
            redirect('/home.html'); // or: redirect('/main.html');
        }
    }
}

$registered = isset($_GET['registered']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Invoice Finance</title>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background: #f8fafc;
      color: #0f172a;
    }
    .container {
      max-width: 480px;
      margin: 60px auto;
      background: #fff;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    }
    h1 { margin-bottom: 12px; }
    label { display: block; margin-top: 16px; font-weight: 600; }
    input {
      width: 100%;
      padding: 12px;
      margin-top: 8px;
      border-radius: 8px;
      border: 1px solid #cbd5f5;
    }
    button {
      margin-top: 24px;
      width: 100%;
      padding: 12px;
      border: none;
      background: #16a34a;
      color: #fff;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
    }
    .error {
      background: #fee2e2;
      color: #991b1b;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
    }
    .success {
      background: #dcfce7;
      color: #166534;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
    }
    .link { margin-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome back</h1>
    <p>Sign in to access the dApp.</p>

    <?php if ($registered): ?>
      <div class="success">✅ Registration successful. Please login.</div>
    <?php endif; ?>

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

      <button type="submit">Login</button>
    </form>

    <div class="link">
      Need an account? <a href="/register.php">Register</a>
    </div>
  </div>
</body>
</html>