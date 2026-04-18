<?php
declare(strict_types=1);
require_once __DIR__ . '/admin_auth.php';
require_admin_page();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CoxyInsure Admin Claims</title>
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
      --amber-soft:#FEF3C7;
      --amber:#92400E;
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
    button,input,select{font:inherit}

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

    .claim-stats{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
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
    .badge-amber{background:var(--amber-soft);color:var(--amber)}
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

    .claims-panel{
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

    .table-tools{
      display:flex;
      align-items:center;
      gap:10px;
      flex-wrap:wrap;
    }

    .search-box{
      height:36px;
      min-width:240px;
      border:1px solid var(--line);
      background:#F8FAFC;
      border-radius:8px;
      display:flex;
      align-items:center;
      gap:8px;
      padding:0 12px;
      color:#98A2B3;
      font-size:13px;
    }

    .search-box input{
      border:none;
      outline:none;
      background:transparent;
      width:100%;
      color:#475467;
      font-size:13px;
    }

    .filter-select{
      height:36px;
      border:1px solid var(--line);
      background:#F8FAFC;
      border-radius:8px;
      padding:0 12px;
      color:#667085;
      font-weight:700;
      font-size:13px;
      cursor:pointer;
    }

    .claims-grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:18px;
      padding:20px;
    }

    .claim-card{
      background:#fff;
      border:1px solid var(--line);
      border-radius:18px;
      box-shadow:0 6px 20px rgba(0,0,0,0.04);
      padding:20px;
      transition:transform .2s ease, box-shadow .2s ease;
    }

    .claim-card:hover{
      transform:translateY(-2px);
      box-shadow:0 10px 24px rgba(16,24,40,.08);
    }

    .claim-card-top{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px;
      margin-bottom:10px;
    }

    .claim-title{
      font-size:16px;
      font-weight:800;
      line-height:1.35;
      color:var(--text);
      margin-bottom:4px;
    }

    .claim-desc{
      font-size:13px;
      color:var(--muted);
      line-height:1.45;
    }

    .status-badge{
      height:26px;
      padding:0 10px;
      border-radius:999px;
      display:inline-flex;
      align-items:center;
      font-size:11px;
      font-weight:800;
      text-transform:uppercase;
      flex-shrink:0;
    }

    .pending{background:#FEF3C7;color:#92400E}
    .executed{background:#D1FAE5;color:#065F46}
    .rejected{background:#FEE2E2;color:#991B1B}

    .claim-meta{
      display:grid;
      gap:8px;
      margin-top:12px;
      color:var(--muted);
      font-size:13px;
    }

    .meta-row{
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      align-items:center;
    }

    .meta-label{
      font-weight:700;
      color:#475467;
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

    .claim-actions{
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

    .btn-view{
      background:#EEF2FF;
      color:#1D4ED8;
    }

    .btn-view:hover{
      background:#1D4ED8;
      color:#fff;
    }

    .copy-btn{
      border:none;
      background:var(--primary-soft);
      color:var(--primary);
      border-radius:999px;
      height:24px;
      padding:0 10px;
      font-size:11px;
      font-weight:800;
      cursor:pointer;
    }

    .copy-btn:hover{background:#dfe8ff}

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

    .empty{
      padding:22px 18px;
      color:var(--muted);
      font-size:14px;
    }

    @media (max-width:1200px){
      .claim-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
      .claims-grid{grid-template-columns:1fr}
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
      .claim-stats{grid-template-columns:1fr}
      .heading{font-size:30px}
      .topnav{gap:18px;flex-wrap:wrap}
      .search-box{min-width:100%}
      .claims-grid{padding:14px}
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
          <a href="admin-claims.php" class="active">Claims</a>
          <a href="admin-governance.php">Governance</a>
          <a href="admin-membership.php">Membership</a>
        </nav>
      </div>

      <div class="top-actions">
        <button class="icon-btn" title="Notifications">🔔</button>
        <button class="icon-btn" title="Settings">⚙️</button>
        <button class="wallet-btn" onclick="init()">Connect Wallet</button>
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
        <a class="side-link active" href="admin-claims.php"><span class="side-icon">🧾</span><span>Claims Queue</span></a>
        <a class="side-link" href="admin-membership.php"><span class="side-icon">👥</span><span>Member Registry</span></a>
        <a class="side-link" href="admin-governance.php"><span class="side-icon">🗳️</span><span>Voting Terminal</span></a>
      </div>

      <div class="sidebar-bottom">
        <a class="side-mini" href="#"><span class="side-icon">❔</span><span>Support</span></a>
        <a class="side-mini" href="#"><span class="side-icon">🧾</span><span>Logs</span></a>
      </div>
    </aside>

    <main class="main">
      <div class="eyebrow">Network: Mainnet-Beta</div>
      <h1 class="heading">Claims Queue</h1>

      <section class="claim-stats">
        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Total Claims</div>
              <div class="stat-badge badge-blue">Live</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statTotalClaims">0</span>
              <span class="u">ITEMS</span>
            </div>
          </div>
          <div class="mini-bars">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Pending Review</div>
              <div class="stat-badge badge-amber">Queue</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statPendingClaims">0</span>
              <span class="u">PENDING</span>
            </div>
          </div>
          <div class="mini-bars">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Executed Claims</div>
              <div class="stat-badge badge-green">Settled</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statExecutedClaims">0</span>
              <span class="u">EXECUTED</span>
            </div>
          </div>
          <div class="mini-bars">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Rejected Claims</div>
              <div class="stat-badge badge-red">Closed</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statRejectedClaims">0</span>
              <span class="u">REJECTED</span>
            </div>
          </div>
          <div class="mini-bars">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
      </section>

      <section class="claims-panel">
        <div class="panel-head">
          <h2>All Claims</h2>

          <div class="table-tools">
            <div class="search-box">
              🔎
              <input id="claimSearch" type="text" placeholder="Search claims, wallets, asset units..." />
            </div>

            <select id="claimStatusFilter" class="filter-select">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="executed">Executed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div id="claimsGrid" class="claims-grid">
          <div class="empty">Loading claims...</div>
        </div>

        <div class="panel-footer">
          <span class="panel-footer-link">Claims loaded from live backend records</span>
        </div>
      </section>
    </main>
  </div>

  <script>
    let ALL_CLAIMS = [];

    function shortWallet(addr) {
      if (!addr || addr.length < 18) return addr || '--';
      return addr.slice(0, 12) + '...' + addr.slice(-8);
    }

    async function copyWallet(addr) {
      try {
        await navigator.clipboard.writeText(addr);
      } catch (e) {
        console.error(e);
      }
    }

    async function updateStats(claims) {
  const total = claims.length;
  const pending = claims.filter(c => c.status === 'pending').length;
  const rejected = claims.filter(c => c.status === 'rejected').length;

  document.getElementById('statTotalClaims').textContent = total.toLocaleString();
  document.getElementById('statPendingClaims').textContent = pending.toLocaleString();
  document.getElementById('statRejectedClaims').textContent = rejected.toLocaleString();

  // 🔥 FETCH REAL EXECUTED COUNT
  try {
    const res = await fetch('get_executed_claims_count.php', { credentials: 'include' });
    const data = await res.json();

    if (data.ok) {
      document.getElementById('statExecutedClaims').textContent =
        Number(data.total || 0).toLocaleString();
    }
  } catch (e) {
    console.error("Failed to load executed count", e);
  }
}

    function renderClaims() {
      const grid = document.getElementById('claimsGrid');
      const search = (document.getElementById('claimSearch').value || '').toLowerCase().trim();
      const status = document.getElementById('claimStatusFilter').value;

      const filtered = ALL_CLAIMS.filter(c => {
        const statusMatch = status === 'all' ? true : c.status === status;
        const searchMatch = search === '' ? true : (
          (c.document_name || '').toLowerCase().includes(search) ||
          (c.description || '').toLowerCase().includes(search) ||
          (c.wallet_address || '').toLowerCase().includes(search) ||
          (c.asset_unit || '').toLowerCase().includes(search)
        );
        return statusMatch && searchMatch;
      });

      updateStats(ALL_CLAIMS);

      if (!filtered.length) {
        grid.innerHTML = '<div class="empty">No claims found for the current filter.</div>';
        return;
      }

      grid.innerHTML = filtered.map(c => `
        <div class="claim-card">
          <div class="claim-card-top">
            <div>
              <div class="claim-title">${c.document_name || 'Claim Document'}</div>
              <div class="claim-desc">${c.description || 'No description provided.'}</div>
            </div>
            <span class="status-badge ${c.status}">${c.status}</span>
          </div>

          <div class="claim-meta">
            <div class="meta-row">
              <span class="meta-label">Claim Amount:</span>
              <span>${Number(c.amount_ada || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} ADA</span>
            </div>

            <div class="meta-row">
              <span class="meta-label">Wallet:</span>
              <span>${shortWallet(c.wallet_address)}</span>
              <button class="copy-btn" onclick="copyWallet('${String(c.wallet_address || '').replace(/'/g, "\\'")}')">Copy</button>
            </div>

            <div class="meta-row">
              <span class="meta-label">Submitted:</span>
              <span>${c.created_at || '--'}</span>
            </div>

            <div class="asset-unit">${c.asset_unit || '--'}</div>

            ${c.reason ? `<div class="meta-row"><span class="meta-label">Reason:</span><span>${c.reason}</span></div>` : ''}
            ${c.tx_hash ? `<div class="meta-row"><span class="meta-label">Execution TX:</span><span>${c.tx_hash}</span></div>` : ''}
          </div>

          <div class="claim-actions">
            <a class="btn btn-view" href="${c.document_url}" target="_blank">View Document</a>
          </div>
        </div>
      `).join('');
    }

    async function loadClaims() {
      try {
        const res = await fetch('get_admin_claims.php?limit=100', { credentials: 'include' });
        const data = await res.json();

        if (!data.ok || !Array.isArray(data.claims)) {
          document.getElementById('claimsGrid').innerHTML = '<div class="empty">No claims found.</div>';
          return;
        }

        ALL_CLAIMS = data.claims;
        renderClaims();
      } catch (e) {
        console.error(e);
        document.getElementById('claimsGrid').innerHTML = '<div class="empty">Failed to load claims.</div>';
      }
    }

    document.getElementById('claimSearch').addEventListener('input', renderClaims);
    document.getElementById('claimStatusFilter').addEventListener('change', renderClaims);
    document.addEventListener('DOMContentLoaded', loadClaims);
  </script>

  <script type="module" src="new-app.js"></script>
</body>
</html>