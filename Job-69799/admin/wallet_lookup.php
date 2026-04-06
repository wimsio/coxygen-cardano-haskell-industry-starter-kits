<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

require_admin();

$pdo = db();
$admin = current_admin();

$address = trim((string)($_GET['address'] ?? ''));
$result = null;
$error = null;

if ($address !== '') {
    // Basic sanity check (optional, keeps junk out)
    if (strlen($address) < 20) {
        $error = 'Address looks too short. Please paste a full wallet address.';
    } else {
        $addrHash = hash('sha256', strtolower($address));

        // Find bound user for this wallet
        $stmt = $pdo->prepare("
          SELECT uw.user_id, uw.wallet_address, uw.status AS wallet_status, uw.verified_at,
                 u.email
          FROM user_wallets uw
          JOIN users u ON u.id = uw.user_id
          WHERE uw.wallet_address_hash = ?
          LIMIT 1
        ");
        $stmt->execute([$addrHash]);
        $user = $stmt->fetch();

        if (!$user) {
            $result = [
                'found' => false,
                'message' => 'No platform account is linked to this wallet address.',
            ];
        } else {
            // Latest KYC submission for this user
            $stmt = $pdo->prepare("
              SELECT id, full_name, phone_number, country, business_name, status, submitted_at, reviewed_at, review_note
              FROM kyc_submissions
              WHERE user_id = ?
              ORDER BY id DESC
              LIMIT 1
            ");
            $stmt->execute([(int)$user['user_id']]);
            $kyc = $stmt->fetch();

            $result = [
                'found' => true,
                'user' => $user,
                'kyc' => $kyc ?: null,
            ];
        }
    }
}
?>
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Admin • Wallet Lookup</title>
  <style>
    body{font-family:Inter,system-ui;background:#f8fafc;color:#0f172a}
    .wrap{max-width:980px;margin:40px auto;padding:0 16px}
    .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
    a{color:#0f172a;font-weight:800;text-decoration:none}
    .card{background:#fff;border-radius:12px;padding:18px;box-shadow:0 10px 30px rgba(15,23,42,.08)}
    label{display:block;margin-top:10px;font-weight:800;color:#334155}
    input{width:100%;padding:12px;margin-top:8px;border-radius:10px;border:1px solid #cbd5e1}
    button{margin-top:12px;padding:12px 14px;border:0;border-radius:10px;background:#0f172a;color:#fff;font-weight:900;cursor:pointer}
    .err{background:#fee2e2;color:#991b1b;padding:12px;border-radius:10px;margin-top:12px}
    .ok{background:#dcfce7;color:#166534;padding:12px;border-radius:10px;margin-top:12px}
    .kv{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .box{background:#f8fafc;border-radius:10px;padding:10px 12px}
    .k{font-size:12px;color:#64748b;font-weight:900}
    .v{margin-top:4px;font-size:14px;color:#0f172a}
    code{display:block;margin-top:6px;padding:8px 10px;background:#f1f5f9;border-radius:8px;word-break:break-all;overflow-wrap:anywhere;white-space:normal}
    .pill{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:900;display:inline-block}
    .pending{background:#ffedd5;color:#9a3412}
    .approved{background:#dcfce7;color:#166534}
    .rejected{background:#fee2e2;color:#991b1b}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div>
        <a href="/admin/dashboard.php">← Back to KYC Dashboard</a>
        <div style="color:#475569;font-size:13px;margin-top:6px;">
          Logged in as <?= e($admin['email'] ?? 'admin') ?>
        </div>
      </div>
      <div><a href="/admin/logout.php">Logout</a></div>
    </div>

    <div class="card">
      <h2>Wallet Lookup</h2>
      <p style="color:#475569;margin-top:-6px;">
        Paste a wallet address to locate the linked platform account and KYC contact details (admin-only).
      </p>

      <form method="get" action="">
        <label for="address">Wallet Address</label>
        <input id="address" name="address" placeholder="addr1..." value="<?= e($address) ?>" />
        <button type="submit">Search</button>
      </form>

      <?php if ($error): ?>
        <div class="err"><?= e($error) ?></div>
      <?php endif; ?>

      <?php if (is_array($result)): ?>
        <?php if (!$result['found']): ?>
          <div class="err"><?= e($result['message']) ?></div>
        <?php else: ?>
          <div class="ok">Linked account found ✅</div>

          <h3 style="margin-top:16px;">Account</h3>
          <div class="kv">
            <div class="box"><div class="k">User ID</div><div class="v"><?= (int)$result['user']['user_id'] ?></div></div>
            <div class="box"><div class="k">Email</div><div class="v"><?= e($result['user']['email']) ?></div></div>
            <div class="box">
              <div class="k">Wallet Status</div>
              <div class="v">
                <?php
                  $ws = (string)$result['user']['wallet_status'];
                  $cls = $ws === 'verified' ? 'approved' : ($ws === 'revoked' ? 'rejected' : 'pending');
                ?>
                <span class="pill <?= e($cls) ?>"><?= e($ws) ?></span>
              </div>
            </div>
            <div class="box"><div class="k">Verified At</div><div class="v"><?= e((string)($result['user']['verified_at'] ?? '')) ?></div></div>
          </div>

          <div class="box" style="margin-top:12px;">
            <div class="k">Wallet Address (matched)</div>
            <code><?= e($result['user']['wallet_address']) ?></code>
          </div>

          <h3 style="margin-top:16px;">KYC (latest)</h3>
          <?php if (!$result['kyc']): ?>
            <div class="err">No KYC submission found for this user.</div>
          <?php else: ?>
            <?php
              $ks = (string)$result['kyc']['status'];
              $kcls = $ks === 'approved' ? 'approved' : ($ks === 'rejected' ? 'rejected' : 'pending');
            ?>
            <div class="kv">
              <div class="box"><div class="k">Full Name</div><div class="v"><?= e($result['kyc']['full_name']) ?></div></div>
              <div class="box"><div class="k">Phone</div><div class="v"><?= e($result['kyc']['phone_number']) ?></div></div>
              <div class="box"><div class="k">Country</div><div class="v"><?= e($result['kyc']['country']) ?></div></div>
              <div class="box"><div class="k">Business</div><div class="v"><?= e((string)($result['kyc']['business_name'] ?? '')) ?></div></div>
              <div class="box">
                <div class="k">KYC Status</div>
                <div class="v"><span class="pill <?= e($kcls) ?>"><?= e($ks) ?></span></div>
              </div>
              <div class="box"><div class="k">Submitted At</div><div class="v"><?= e($result['kyc']['submitted_at']) ?></div></div>
              <div class="box"><div class="k">Reviewed At</div><div class="v"><?= e((string)($result['kyc']['reviewed_at'] ?? '')) ?></div></div>
              <div class="box"><div class="k">Review Note</div><div class="v"><?= e((string)($result['kyc']['review_note'] ?? '')) ?></div></div>
            </div>

            <div style="margin-top:12px;">
              <a href="/admin/kyc_view.php?id=<?= (int)$result['kyc']['id'] ?>">Open KYC submission →</a>
            </div>
          <?php endif; ?>

        <?php endif; ?>
      <?php endif; ?>

    </div>
  </div>
</body>
</html>
