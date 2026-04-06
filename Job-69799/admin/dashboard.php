<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_auth.php';
require_admin();

$pdo = db();
$admin = current_admin();

$stmt = $pdo->query("
  SELECT k.id, k.user_id, u.email, k.full_name, k.country, k.phone_number, k.status, k.submitted_at
  FROM kyc_submissions k
  JOIN users u ON u.id = k.user_id
  ORDER BY
    CASE k.status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END,
    k.id DESC
");
$rows = $stmt->fetchAll();
?>
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>KYC Admin</title>
  <style>
    body{font-family:Inter,system-ui;background:#f8fafc;color:#0f172a}
    .wrap{max-width:1100px;margin:40px auto;padding:0 16px}
    .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
    table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08)}
    th,td{padding:12px 14px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:14px}
    th{background:#f1f5f9;font-weight:800}
    a{color:#dc2626;text-decoration:none;font-weight:700}
    .pill{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;display:inline-block}
    .pending{background:#ffedd5;color:#9a3412}
    .approved{background:#dcfce7;color:#166534}
    .rejected{background:#fee2e2;color:#991b1b}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div>
        <h2>KYC Submissions</h2>
        <div style="color:#475569;font-size:13px;">Logged in as <?= e($admin['email'] ?? 'admin') ?></div>
      </div>
      <div>
        <a href="/admin/wallet_lookup.php">Wallet Lookup</a>
        &nbsp;|&nbsp;
        <a href="/admin/logout.php">Logout</a>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>User Email</th>
          <th>Full Name</th>
          <th>Country</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Submitted</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($rows as $r): ?>
          <tr>
            <td><?= (int)$r['id'] ?></td>
            <td><?= e($r['email']) ?></td>
            <td><?= e($r['full_name']) ?></td>
            <td><?= e($r['country']) ?></td>
            <td><?= e($r['phone_number']) ?></td>
            <td>
              <?php
                $cls = $r['status'] === 'approved' ? 'approved' : ($r['status'] === 'rejected' ? 'rejected' : 'pending');
              ?>
              <span class="pill <?= $cls ?>"><?= e($r['status']) ?></span>
            </td>
            <td><?= e($r['submitted_at']) ?></td>
            <td><a href="/admin/kyc_view.php?id=<?= (int)$r['id'] ?>">Review</a></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</body>
</html>
