<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/../csrf.php';

require_admin();

$pdo = db();
$admin = current_admin();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) redirect('/admin/dashboard.php');

$stmt = $pdo->prepare("
  SELECT k.*, u.email
  FROM kyc_submissions k
  JOIN users u ON u.id = k.user_id
  WHERE k.id = ?
  LIMIT 1
");
$stmt->execute([$id]);
$k = $stmt->fetch();

if (!$k) redirect('/admin/dashboard.php');
?>
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Review KYC #<?= (int)$k['id'] ?></title>
  <style>
    body{font-family:Inter,system-ui;background:#f8fafc;color:#0f172a}
    .wrap{max-width:980px;margin:40px auto;padding:0 16px}
    .card{background:#fff;border-radius:12px;padding:18px;box-shadow:0 10px 30px rgba(15,23,42,.08)}
    .row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .kv{padding:10px 12px;background:#f8fafc;border-radius:10px}
    .k{font-size:12px;color:#64748b;font-weight:800}
    .v{margin-top:4px;font-size:14px}
    textarea{width:100%;min-height:90px;padding:10px;border-radius:10px;border:1px solid #cbd5e1}
    .actions{display:flex;gap:10px;margin-top:12px}
    button{padding:10px 14px;border:0;border-radius:10px;font-weight:900;cursor:pointer}
    .approve{background:#16a34a;color:#fff}
    .reject{background:#dc2626;color:#fff}
    a{color:#0f172a;font-weight:800;text-decoration:none}
    iframe{width:100%;height:520px;border:1px solid #e2e8f0;border-radius:12px;background:#fff}
  </style>
</head>
<body>
  <div class="wrap">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <a href="/admin/dashboard.php">← Back</a>
      <a href="/admin/logout.php">Logout</a>
    </div>

    <div class="card">
      <h2>KYC Review #<?= (int)$k['id'] ?></h2>
      <div style="color:#475569;font-size:13px;margin-bottom:14px;">User: <?= e($k['email']) ?> • Status: <strong><?= e($k['status']) ?></strong></div>

      <div class="row">
        <div class="kv"><div class="k">Full Name</div><div class="v"><?= e($k['full_name']) ?></div></div>
        <div class="kv"><div class="k">Phone</div><div class="v"><?= e($k['phone_number']) ?></div></div>
        <div class="kv"><div class="k">Country</div><div class="v"><?= e($k['country']) ?></div></div>
        <div class="kv"><div class="k">Business</div><div class="v"><?= e((string)($k['business_name'] ?? '')) ?></div></div>
      </div>

      <h3 style="margin-top:18px;">Uploaded Document</h3>
      <?php if (!empty($k['id_document_path'])): ?>
        <iframe src="/admin_document.php?kyc_id=<?= (int)$k['id'] ?>"></iframe>
      <?php else: ?>
        <div style="color:#64748b;">No document uploaded.</div>
      <?php endif; ?>

      <h3 style="margin-top:18px;">Decision</h3>
      <form method="post" action="/admin/kyc_action.php">
        <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
        <input type="hidden" name="kyc_id" value="<?= (int)$k['id'] ?>">

        <label style="font-weight:800;color:#334155;">Note (optional)</label>
        <textarea name="note" placeholder="Reason for approval/rejection (optional)"></textarea>

        <div class="actions">
          <button class="approve" type="submit" name="action" value="approve">Approve</button>
          <button class="reject" type="submit" name="action" value="reject">Reject</button>
        </div>
      </form>
    </div>
  </div>
</body>
</html>
