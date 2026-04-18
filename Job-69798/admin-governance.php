<?php
declare(strict_types=1);
require_once __DIR__ . '/admin_auth.php';
require_admin_page();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CoxyInsure Admin Governance</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#F5F7FA;
      --panel:#FFFFFF;
      --line:#E7EBF0;
      --text:#101828;
      --muted:#667085;
      --muted-2:#98A2B3;
      --primary:#1D4ED8;
      --primary-2:#1E40AF;
      --primary-soft:#EEF2FF;
      --navy:#0F2C7D;
      --danger:#DC2626;
      --green:#10B981;
      --green-soft:#D1FAE5;
      --teal:#14B8A6;
      --teal-soft:#CCFBF1;
      --blue-soft:#DBEAFE;
      --orange-soft:#FEE2E2;
      --orange:#F97316;
      --shadow:0 1px 2px rgba(16,24,40,.04),0 8px 24px rgba(16,24,40,.06);
      --radius:18px;
      --radius-sm:12px;
    }

    *{box-sizing:border-box}
    html,body{margin:0;padding:0}
    body{
      font-family:'Inter',sans-serif;
      background:linear-gradient(180deg,#F8FAFC 0,#F5F7FA 220px,#F5F7FA 100%);
      color:var(--text);
    }

    a{text-decoration:none;color:inherit}
    button,input{font:inherit}

    .app{
      min-height:100vh;
      display:grid;
      grid-template-columns:190px 1fr;
      grid-template-rows:72px 1fr;
      grid-template-areas:
        "topbar topbar"
        "sidebar main";
    }

    .topbar{
      grid-area:topbar;
      background:#F8FAFC;
      border-bottom:1px solid var(--line);
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:0 26px;
      position:sticky;
      top:0;
      z-index:20;
    }

    .top-left{
      display:flex;
      align-items:center;
      gap:40px;
    }

    .brand{
      font-size:16px;
      font-weight:800;
      color:var(--navy);
    }

    .topnav{
      display:flex;
      align-items:center;
      gap:28px;
      font-size:14px;
      font-weight:600;
      color:#64748B;
    }

    .topnav a{
      position:relative;
      padding:4px 0;
    }

    .topnav a.active{
      color:var(--primary);
    }

    .topnav a.active::after{
      content:"";
      position:absolute;
      left:0;
      right:0;
      bottom:-12px;
      height:2px;
      border-radius:999px;
      background:var(--primary);
    }

    .top-actions{
      display:flex;
      align-items:center;
      gap:18px;
    }

    .icon-btn{
      border:none;
      background:transparent;
      color:#475467;
      font-size:18px;
      width:24px;
      height:24px;
      display:grid;
      place-items:center;
      cursor:pointer;
    }

    .wallet-btn{
      border:none;
      background:var(--primary);
      color:#fff;
      height:36px;
      padding:0 20px;
      border-radius:999px;
      font-size:14px;
      font-weight:700;
      cursor:pointer;
      box-shadow:0 6px 18px rgba(29,78,216,.18);
    }

    .wallet-btn:hover{background:var(--primary-2)}

    .avatar{
      width:30px;
      height:30px;
      border-radius:999px;
      background:#1E293B;
      display:grid;
      place-items:center;
      color:#fff;
      font-size:14px;
    }

    .sidebar{
      grid-area:sidebar;
      background:#F1F5F9;
      border-right:1px solid var(--line);
      padding:22px 10px 18px;
      display:flex;
      flex-direction:column;
      gap:18px;
    }

    .side-brand{
      display:flex;
      align-items:center;
      gap:10px;
      padding:6px 10px 16px;
      border-bottom:1px solid var(--line);
    }

    .shield{
      width:30px;
      height:30px;
      border-radius:10px;
      background:#0F2C7D;
      display:grid;
      place-items:center;
      color:#fff;
      font-size:16px;
      flex:0 0 30px;
    }

    .side-brand h3{
      margin:0;
      font-size:13px;
      line-height:1.25;
      color:var(--navy);
      font-weight:800;
    }

    .side-brand p{
      margin:2px 0 0;
      font-size:10px;
      color:#98A2B3;
      text-transform:uppercase;
      letter-spacing:.04em;
      font-weight:700;
      line-height:1.3;
    }

    .side-nav{
      display:flex;
      flex-direction:column;
      gap:8px;
    }

    .side-link{
      height:36px;
      border-radius:12px;
      display:flex;
      align-items:center;
      gap:10px;
      padding:0 12px;
      font-size:14px;
      font-weight:500;
      color:#64748B;
    }

    .side-link.active{
      background:var(--primary-soft);
      color:var(--primary);
      font-weight:600;
    }

    .side-icon{
      width:18px;
      text-align:center;
      font-size:15px;
    }

    .sidebar-bottom{
      margin-top:auto;
      border-top:1px solid var(--line);
      padding-top:14px;
      display:flex;
      flex-direction:column;
      gap:8px;
    }

    .side-mini{
      display:flex;
      align-items:center;
      gap:10px;
      padding:0 12px;
      height:34px;
      border-radius:10px;
      color:#64748B;
      font-size:13px;
      font-weight:500;
    }

    .main{
      grid-area:main;
      padding:26px 24px 28px;
    }

    .eyebrow{
      font-size:13px;
      font-weight:700;
      text-transform:uppercase;
      letter-spacing:.05em;
      color:#64748B;
      margin-bottom:8px;
    }

    .heading{
      margin:0 0 26px;
      font-size:36px;
      line-height:1.1;
      letter-spacing:-.03em;
      color:var(--navy);
      font-weight:800;
    }

    .gov-stats{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:16px;
      margin-bottom:22px;
    }

    .stat-card{
      background:var(--panel);
      border:1px solid var(--line);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      padding:18px 18px 16px;
      min-height:132px;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
    }

    .stat-top{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:8px;
      margin-bottom:8px;
    }

    .stat-label{
      font-size:11px;
      text-transform:uppercase;
      letter-spacing:.06em;
      color:#98A2B3;
      font-weight:800;
    }

    .stat-badge{
      height:20px;
      min-width:42px;
      padding:0 8px;
      border-radius:999px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      font-size:10px;
      font-weight:800;
    }

    .badge-green{background:var(--green-soft);color:#047857}
    .badge-blue{background:#E0F2FE;color:#0369A1}
    .badge-red{background:var(--orange-soft);color:var(--danger)}

    .stat-number{
      display:flex;
      align-items:flex-end;
      gap:4px;
      color:#111827;
      line-height:1;
      white-space:nowrap;
      flex-wrap:nowrap;
    }

    .stat-number .n{
      font-size:30px;
      font-weight:800;
      letter-spacing:-.04em;
    }

    .stat-number .u{
      font-size:13px;
      color:#94A3B8;
      font-weight:700;
      margin-bottom:3px;
    }

    .mini-bars{
      height:38px;
      display:flex;
      align-items:flex-end;
      gap:4px;
      margin-top:10px;
    }

    .mini-bars span{
      width:100%;
      max-width:36px;
      background:#D9DDEA;
      display:block;
      border-radius:3px 3px 0 0;
    }

    .mini-bars span:nth-child(1){height:18px}
    .mini-bars span:nth-child(2){height:28px;background:#B8BED4}
    .mini-bars span:nth-child(3){height:25px;background:#A8B0CC}
    .mini-bars span:nth-child(4){height:18px;background:#9EA8C8}
    .mini-bars span:nth-child(5){height:30px;background:#6978AD}
    .mini-bars span:nth-child(6){height:36px;background:#0F2C7D}

    .governance-panel{
      background:var(--panel);
      border:1px solid var(--line);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      overflow:hidden;
    }

    .panel-head{
      padding:18px 20px;
      border-bottom:1px solid var(--line);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:14px;
      flex-wrap:wrap;
    }

    .panel-head h2{
      margin:0;
      font-size:16px;
      font-weight:800;
      color:var(--navy);
    }

    .panel-tools{
      display:flex;
      align-items:center;
      gap:10px;
      flex-wrap:wrap;
    }

    .helper-pill{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      height:34px;
      padding:0 12px;
      border-radius:999px;
      background:#EEF2FF;
      color:var(--primary);
      font-size:12px;
      font-weight:800;
    }

    .grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:18px;
      padding:20px;
    }

    .card{
      background:#fff;
      border-radius:18px;
      padding:20px;
      border:1px solid #E7EBF0;
      box-shadow:0 6px 20px rgba(0,0,0,0.04);
      transition:.2s;
    }

    .card:hover{
      transform:translateY(-2px);
    }

    .title{
      font-size:16px;
      font-weight:800;
      color:var(--text);
    }

    .meta{
      margin-top:10px;
      font-size:13px;
      color:var(--muted);
      display:grid;
      gap:8px;
    }

    .meta-row{
      display:flex;
      align-items:center;
      gap:8px;
      flex-wrap:wrap;
    }

    .meta-label{
      color:#475467;
      font-weight:700;
    }

    .asset-unit{
      font-size:12px;
      background:#F1F5F9;
      padding:8px 10px;
      border-radius:10px;
      word-break:break-all;
      overflow-wrap:anywhere;
      display:block;
      margin-top:6px;
      color:#475467;
    }

    .actions{
      display:flex;
      gap:10px;
      margin-top:16px;
      flex-wrap:wrap;
    }

    .btn{
      border-radius:999px;
      padding:10px 16px;
      font-weight:700;
      font-size:13px;
      border:none;
      cursor:pointer;
      transition:.2s;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:8px;
    }

    .btn-exec{
      background:#D1FAE5;
      color:#065F46;
    }

    .btn-reject{
      background:#FEE2E2;
      color:#991B1B;
    }

    .btn-view{
      background:#EEF2FF;
      color:#1D4ED8;
    }

    .btn-view:hover{
      background:#1D4ED8;
      color:#fff;
    }

    .empty{
      background:#fff;
      border:1px solid var(--line);
      border-radius:18px;
      padding:20px;
      color:var(--muted);
    }

    code{
      font-size:12px;
    }

    .copy-btn{
      margin-left:8px;
      font-size:11px;
      padding:4px 8px;
      border-radius:6px;
      background:#E0E7FF;
      border:none;
      cursor:pointer;
      color:#1D4ED8;
      font-weight:700;
    }

    .copy-btn:hover{
      background:#C7D2FE;
    }

    .panel-footer{
      display:flex;
      justify-content:center;
      padding:16px 20px 20px;
      border-top:1px solid var(--line);
      background:#FCFCFD;
    }

    .panel-footer-link{
      color:var(--primary);
      font-size:14px;
      font-weight:700;
    }

    @media (max-width:1200px){
      .gov-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
      .grid{grid-template-columns:1fr}
    }

    @media (max-width:900px){
      .app{
        grid-template-columns:1fr;
        grid-template-rows:auto auto 1fr;
        grid-template-areas:
          "topbar"
          "sidebar"
          "main";
      }
      .sidebar{border-right:none;border-bottom:1px solid var(--line)}
      .topbar{
        height:auto;
        padding:16px 20px;
        flex-direction:column;
        align-items:flex-start;
        gap:16px;
      }
      .top-left,.top-actions{
        width:100%;
        flex-wrap:wrap;
        justify-content:space-between;
      }
    }

    @media (max-width:640px){
      .gov-stats{grid-template-columns:1fr}
      .heading{font-size:30px}
      .topnav{gap:18px;flex-wrap:wrap}
      .grid{padding:14px}
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="topbar">
      <div class="top-left">
        <div class="brand">VaultAdmin</div>

        <nav class="topnav">
          <a href="admin-dashboard.php">Dashboard</a>
          <a href="admin-covers.php">Active Covers</a>
          <a href="admin-claims.php">Claims</a>
          <a href="admin-governance.php" class="active">Governance</a>
          <a href="admin-membership.php">Membership</a>
        </nav>
      </div>

      <div class="top-actions">
        <button class="icon-btn" title="Notifications">🔔</button>
        <button class="icon-btn" title="Settings">⚙️</button>
        <button class="wallet-btn" onclick="connectAndLoad()">Connect Wallet</button>
        <div class="avatar">🧑🏾</div>
      </div>
    </header>

    <aside class="sidebar">
      <div class="side-brand">
        <div class="shield">🛡️</div>
        <div>
          <h3>CoxyInsure</h3>
          <p>Cardano Network</p>
        </div>
      </div>

      <div class="side-nav">
        <a class="side-link" href="admin-dashboard.php"><span class="side-icon">📊</span><span>Protocol Health</span></a>
        <a class="side-link" href="admin-covers.php"><span class="side-icon">🛡️</span><span>Risk Management</span></a>
        <a class="side-link" href="admin-claims.php"><span class="side-icon">🧾</span><span>Claims Queue</span></a>
        <a class="side-link" href="admin-membership.php"><span class="side-icon">👥</span><span>Member Registry</span></a>
        <a class="side-link active" href="admin-governance.php"><span class="side-icon">🗳️</span><span>Voting Terminal</span></a>
      </div>

      <div class="sidebar-bottom">
        <a class="side-mini" href="#"><span class="side-icon">❔</span><span>Support</span></a>
        <a class="side-mini" href="#"><span class="side-icon">🧾</span><span>Logs</span></a>
      </div>
    </aside>

    <main class="main">
      <div class="eyebrow">Network: Mainnet-Beta</div>
      <h1 class="heading">Governance Queue</h1>

      <section class="gov-stats">
        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Executable Claims</div>
              <div class="stat-badge badge-green">Ready</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statExecutable">0</span>
              <span class="u">CLAIMS</span>
            </div>
          </div>
          <div class="mini-bars">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Rejected by Admin</div>
              <div class="stat-badge badge-red">Blocked</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statRejected">0</span>
              <span class="u">CLAIMS</span>
            </div>
          </div>
          <div class="mini-bars">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Executed by Admin</div>
              <div class="stat-badge badge-blue">Settled</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statExecuted">0</span>
              <span class="u">CLAIMS</span>
            </div>
          </div>
          <div class="mini-bars">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
      </section>

      <section class="governance-panel">
        <div class="panel-head">
          <h2>Executable Claim Queue</h2>
          <div class="panel-tools">
            <span class="helper-pill">Claims must pass threshold before execution</span>
          </div>
        </div>

        <div id="govGrid" class="grid">
          <div class="empty">Connect wallet to load executable claims.</div>
        </div>

        <div class="panel-footer">
          <span class="panel-footer-link">Governance execution is synced with live claim review state</span>
        </div>
      </section>
    </main>
  </div>

  <script>
let ADMIN_CSRF = '';
let REVIEW_MAP = {};
let CLAIM_WALLET_MAP = {};

// 🔥 NORMALIZER (CRITICAL FIX)
function normalizeUnit(v) {
  return String(v || '').trim().toLowerCase();
}

async function loadWalletMap() {
  try {
    const res = await fetch('get_admin_claims.php', { credentials: 'include' });
    const data = await res.json();

    CLAIM_WALLET_MAP = {};

    if (data.ok && data.claims) {
      data.claims.forEach(c => {
        CLAIM_WALLET_MAP[normalizeUnit(c.asset_unit)] = c.wallet_address;
      });
    }
  } catch (e) {
    console.error("Wallet map load failed", e);
  }
}

function shortWallet(addr) {
  if (!addr || addr.length < 18) return addr || '--';
  return addr.slice(0, 12) + '...' + addr.slice(-8);
}

async function getAdminSession() {
  const res = await fetch('admin_session_info.php', { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load admin session.');
  ADMIN_CSRF = data.admin.csrf_token || '';
  return data.admin;
}

async function loadReviewMap() {
  const res = await fetch('get_claim_review_statuses.php', { credentials: 'include' });
  const data = await res.json();

  REVIEW_MAP = {};

  if (data.ok && data.reviews) {
    Object.entries(data.reviews).forEach(([k, v]) => {
      REVIEW_MAP[normalizeUnit(k)] = v;
    });
  }
}

async function updateGovernanceStats(queue) {
  const reviews = Object.values(REVIEW_MAP || {});
  const rejected = reviews.filter(r => r.status === 'rejected').length;

  document.getElementById('statExecutable').textContent =
    Number(queue.length || 0).toLocaleString();

  document.getElementById('statRejected').textContent =
    Number(rejected || 0).toLocaleString();

  // 🔥 REAL EXECUTED COUNT FROM BACKEND
  try {
    const res = await fetch('get_executed_claims_count.php', { credentials: 'include' });
    const data = await res.json();

    if (data.ok) {
      document.getElementById('statExecuted').textContent =
        Number(data.total || 0).toLocaleString();
    }
  } catch (e) {
    console.error("Executed count fetch failed", e);
  }
}

async function connectAndLoad() {
  try {
    await getAdminSession();

    if (typeof window.init !== 'function') {
      throw new Error('Wallet initialization not available.');
    }

    await window.init();
    await loadReviewMap();
    await loadWalletMap();
    renderGovernanceQueue();
  } catch (e) {
    console.error(e);
    alert(e.message || 'Failed to load governance queue.');
  }
}

function renderGovernanceQueue() {
  const grid = document.getElementById('govGrid');
  const queue = Array.isArray(window.claimsForExecution) ? window.claimsForExecution : [];

  const renderable = queue
    .map((claim, originalIndex) => {
      const key = normalizeUnit(claim.docUnit);
      const review = REVIEW_MAP[key] || { status: 'pending' };
      return { claim, originalIndex, review, key };
    })
    .filter(item => item.review.status === 'pending');

  updateGovernanceStats(renderable);

  if (!renderable.length) {
    grid.innerHTML = '<div class="empty">No executable claims available.</div>';
    return;
  }

  grid.innerHTML = renderable.map(item => {
    const wallet = CLAIM_WALLET_MAP[item.key] || item.claim.claimer;
    const short = shortWallet(wallet);

    return `
      <div class="card">
        <div class="title">Executable Claim</div>

        <div class="meta">
          <div class="meta-row">
            <span class="meta-label">Amount:</span>
            <span>${Number(item.claim.amountAda || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} ADA</span>
          </div>

          <div class="meta-row">
            <span class="meta-label">Votes:</span>
            <span>${item.claim.votes}/${item.claim.threshold}</span>
          </div>

          <div class="meta-row">
            <span class="meta-label">Claimer:</span>
            <span>${short}</span>
            <button onclick="copyWallet('${String(wallet).replace(/'/g, "\\'")}')" class="copy-btn">Copy</button>
          </div>

          <div class="asset-unit">
            <strong>Asset Unit:</strong>
            <code>${item.claim.docUnit}</code>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-exec" onclick="executeClaim(${item.originalIndex}, '${item.claim.docUnit.replace(/'/g, "\\'")}')">
            Execute Payout
          </button>
          <button class="btn btn-reject" onclick="rejectClaim('${item.claim.docUnit.replace(/'/g, "\\'")}')">
            Reject
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function copyWallet(addr) {
  navigator.clipboard.writeText(addr);
  alert("Wallet copied!");
}

// 🔥 REJECT FIX
async function rejectClaim(assetUnit) {
  const reason = prompt('Enter rejection reason (optional):') || '';
  const key = normalizeUnit(assetUnit);

  try {
    const res = await fetch('reject_claim.php', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-CSRF': ADMIN_CSRF
      },
      body: JSON.stringify({ asset_unit: assetUnit, reason })
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error);

    // 🔥 UPDATE LOCAL STATE
    REVIEW_MAP[key] = { status: 'rejected' };

    window.claimsForExecution = window.claimsForExecution.filter(
      c => normalizeUnit(c.docUnit) !== key
    );

    renderGovernanceQueue();
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}

// 🔥 EXECUTE FIX
async function executeClaim(originalIndex, assetUnit) {
  const key = normalizeUnit(assetUnit);

  try {
    const result = await window.executeClaimByIndex(originalIndex);
    let txHash = typeof result === 'string' ? result : (result?.txHash || '');

    const res = await fetch('mark_claim_executed.php', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-CSRF': ADMIN_CSRF
      },
      body: JSON.stringify({ asset_unit: assetUnit, tx_hash: txHash })
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error);

    // 🔥 UPDATE LOCAL STATE
    REVIEW_MAP[key] = { status: 'executed' };

    window.claimsForExecution = window.claimsForExecution.filter(
      c => normalizeUnit(c.docUnit) !== key
    );

    renderGovernanceQueue();
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}
</script>

<script>
window.IS_ADMIN_PAGE = true;
</script>

  <script type="module" src="new-app.js"></script>
</body>
</html>