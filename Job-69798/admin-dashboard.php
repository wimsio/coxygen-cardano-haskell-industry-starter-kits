<?php
declare(strict_types=1);
require_once __DIR__ . '/admin_auth.php';
require_admin_page();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CoxyInsure Admin Dashboard</title>
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

    .stats{
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
      min-height:140px;
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

    .badge-green{
      background:var(--green-soft);
      color:#047857;
    }

    .badge-blue{
      background:#E0F2FE;
      color:#0369A1;
    }

    .stat-value{
      font-size:18px;
      font-weight:700;
      color:var(--text);
      line-height:1.2;
    }

    .stat-value .big{
      font-size:18px;
    }

    .stat-value .huge{
      font-size:17px;
    }

    .stat-value .num{
      font-size:18px;
      letter-spacing:-.03em;
    }

    .stat-value .main-num{
      font-size:18px;
      font-weight:700;
    }

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
      font-size:18px;
      font-weight:800;
      letter-spacing:-.04em;
    }

    .stat-number .u{
      font-size:13px;
      color:#94A3B8;
      font-weight:700;
      margin-bottom:2px;
    }

    .mini-bars{
      height:38px;
      display:flex;
      align-items:flex-end;
      gap:4px;
      margin-top:10px;
    }

    .mini-bars span{
      width:36px;
      background:#D9DDEA;
      border-radius:0;
      display:block;
    }

    .mini-bars span:nth-child(1){height:18px}
    .mini-bars span:nth-child(2){height:28px;background:#B8BED4}
    .mini-bars span:nth-child(3){height:25px;background:#A8B0CC}
    .mini-bars span:nth-child(4){height:18px;background:#9EA8C8}
    .mini-bars span:nth-child(5){height:30px;background:#6978AD}
    .mini-bars span:nth-child(6){height:36px;background:#0F2C7D}

    .risk-graph{
      height:38px;
      margin-top:10px;
      display:flex;
      align-items:flex-end;
      gap:10px;
    }

    .risk-bars{
      display:flex;
      align-items:flex-end;
      gap:8px;
      height:100%;
    }

    .risk-bars span{
      width:6px;
      background:#0F766E;
      border-radius:0;
      display:block;
    }

    .risk-bars span:nth-child(1){height:36px}
    .risk-bars span:nth-child(2){height:36px;background:#14B8A6}
    .risk-bars span:nth-child(3){height:20px;background:#0F766E}
    .risk-bars span:nth-child(4){height:12px;background:#0F766E}

    .risk-line{
      position:relative;
      width:74px;
      height:38px;
      border-bottom:0;
    }

    .risk-line svg{
      width:100%;
      height:100%;
      overflow:visible;
    }

    .member-pill{
      display:flex;
      align-items:center;
      gap:8px;
      margin-top:10px;
      color:#94A3B8;
      font-size:12px;
      font-weight:700;
    }

    .avatars{
      display:flex;
      align-items:center;
    }

    .avatars span{
      width:24px;
      height:24px;
      border-radius:999px;
      border:2px solid #fff;
      margin-left:-6px;
      background:#111827;
      display:grid;
      place-items:center;
      color:#fff;
      font-size:11px;
    }

    .avatars span:first-child{margin-left:0}

    .ratio-wrap{
      margin-top:16px;
    }

    .ratio-top{
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:16px;
      color:#98A2B3;
      font-size:10px;
      font-weight:800;
      text-transform:uppercase;
    }

    .ratio-bar{
      height:6px;
      background:#EEF2F7;
      border-radius:999px;
      overflow:hidden;
    }

    .ratio-fill{
      height:100%;
      width:0%;
      background:#56D3C2;
      border-radius:999px;
      transition:width .3s ease;
    }

    .content-grid{
      display:grid;
      grid-template-columns:1.75fr .85fr;
      gap:22px;
      align-items:start;
    }

    .panel{
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
    }

    .search-box{
      height:36px;
      width:192px;
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

    .filter-btn{
      height:36px;
      padding:0 14px;
      border:none;
      background:#F8FAFC;
      border:1px solid var(--line);
      border-radius:8px;
      color:#667085;
      font-weight:700;
      font-size:13px;
      cursor:pointer;
    }

    table{
      width:100%;
      border-collapse:collapse;
    }

    thead th{
      text-align:left;
      background:#F8FAFC;
      padding:12px 18px;
      border-bottom:1px solid var(--line);
      color:#98A2B3;
      font-size:10px;
      font-weight:800;
      letter-spacing:.06em;
      text-transform:uppercase;
    }

    tbody td{
      padding:14px 18px;
      border-bottom:1px solid #EEF2F7;
      font-size:14px;
      color:var(--text);
      vertical-align:middle;
    }

    tbody tr:last-child td{
      border-bottom:none;
    }

    .policy-id{
      color:var(--primary);
      font-weight:700;
      line-height:1.15;
    }

    .protocol-cell{
      display:flex;
      align-items:center;
      gap:8px;
      white-space:nowrap;
    }

    .protocol-icon{
      width:20px;
      height:20px;
      border-radius:999px;
      background:#E2E8F0;
      color:#475467;
      display:grid;
      place-items:center;
      font-size:10px;
      font-weight:800;
      flex:0 0 20px;
    }

    .wallet-cell{
      display:flex;
      align-items:center;
      gap:8px;
      white-space:nowrap;
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

    .panel-footer-link{
      display:block;
      text-align:center;
      padding:14px 20px 18px;
      color:var(--primary);
      font-size:14px;
      font-weight:700;
    }

    .activity-head-dot{
      width:6px;
      height:6px;
      border-radius:999px;
      background:#7DD3FC;
    }

    .activity-list{
      display:flex;
      flex-direction:column;
    }

    .activity-item{
      padding:18px 18px 16px;
      border-bottom:1px solid #EEF2F7;
      display:flex;
      gap:12px;
      align-items:flex-start;
    }

    .activity-item:last-child{
      border-bottom:none;
    }

    .activity-icon{
      width:26px;
      height:26px;
      border-radius:999px;
      display:grid;
      place-items:center;
      font-size:12px;
      flex:0 0 26px;
      margin-top:2px;
    }

    .activity-icon.membership{background:var(--teal-soft); color:#0F766E;}
    .activity-icon.deposit{background:#EEF2FF; color:var(--primary);}
    .activity-icon.claim{background:#FEF3F2; color:#EF4444;}
    .activity-icon.execute{background:#D1FAE5; color:#047857;}
    .activity-icon.vote{background:#F3E8FF; color:#7C3AED;}
    .activity-icon.default{background:#EEF2F7; color:#475467;}

    .activity-body{
      min-width:0;
    }

    .activity-title{
      font-size:15px;
      font-weight:700;
      color:var(--text);
      line-height:1.35;
      margin-bottom:4px;
    }

    .activity-desc{
      font-size:13px;
      color:var(--muted);
      line-height:1.45;
      margin-bottom:6px;
    }

    .activity-time{
      font-size:11px;
      color:#98A2B3;
      font-weight:800;
      text-transform:uppercase;
    }

    .history-link{
      display:flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      height:52px;
      border-top:1px solid var(--line);
      color:#475467;
      font-size:14px;
      font-weight:700;
      background:#FCFCFD;
    }

    .empty{
      padding:22px 18px;
      color:var(--muted);
      font-size:14px;
    }

    @media (max-width:1200px){
      .stats{grid-template-columns:repeat(2,minmax(0,1fr))}
      .content-grid{grid-template-columns:1fr}
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
      .top-left,.top-right{
        width:100%;
        flex-wrap:wrap;
        justify-content:space-between;
      }
    }

    @media (max-width:640px){
      .stats{grid-template-columns:1fr}
      .heading{font-size:30px}
      .topnav{gap:18px;flex-wrap:wrap}
      .table-tools{display:none}
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="topbar">
      <div class="top-left">
        <div class="brand">VaultAdmin</div>

        <nav class="topnav">
          <a href="admin-dashboard.php" class="active">Dashboard</a>
          <a href="admin-covers.php">Active Covers</a>
          <a href="admin-claims.php">Claims</a>
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
        <a class="side-link active" href="admin-dashboard.php"><span class="side-icon">📊</span><span>Protocol Health</span></a>
        <a class="side-link" href="admin-covers.php"><span class="side-icon">🛡️</span><span>Risk Management</span></a>
<a class="side-link" href="admin-claims.php"><span class="side-icon">🧾</span><span>Claims Queue</span></a>
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
      <h1 class="heading">Protocol Dashboard</h1>

      <section class="stats">
        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Total Value Locked</div>
              <div class="stat-badge badge-green">+12.4%</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statTvl">--</span>
              <span class="u">ADA</span>
            </div>
          </div>
          <div class="mini-bars">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Total Active Risk</div>
              <div class="stat-badge badge-blue">-2.1%</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statRisk">--</span>
              <span class="u">ADA</span>
            </div>
          </div>
          <div class="risk-graph">
            <div class="risk-bars">
              <span></span><span></span><span></span><span></span>
            </div>
            <div class="risk-line">
              <svg viewBox="0 0 90 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4 L34 14 L55 24 L78 36" stroke="#0E7490" stroke-width="3" stroke-linecap="round"/>
                <circle cx="4" cy="4" r="5" fill="#0E7490"/>
                <circle cx="34" cy="14" r="5" fill="#0E7490"/>
                <circle cx="55" cy="24" r="5" fill="#0E7490"/>
                <circle cx="78" cy="36" r="5" fill="#0E7490"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Total Members</div>
              <div class="stat-badge badge-green">+402</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statMembers">--</span>
              <span class="u">NFTs</span>
            </div>
          </div>
          <div class="member-pill">
            <div class="avatars">
              <span>👤</span>
              <span>👤</span>
              <span>👤</span>
            </div>
            <span>Soulbound IDs</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="ratio-top">
            <span>Payout Ratio</span>
            <span>Optimal</span>
          </div>
          <div class="stat-number" style="margin-bottom:16px;">
            <span class="n" id="statRatio">--</span>
            <span class="u">%</span>
          </div>
          <div class="ratio-wrap">
            <div class="ratio-bar">
              <div class="ratio-fill" id="ratioFill"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="content-grid">
        <div class="panel">
          <div class="panel-head">
            <h2>Active Covers</h2>

            <div class="table-tools">
              <div class="search-box">🔎 <span>Search Policies...</span></div>
              <button class="filter-btn">☰ Filter</button>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Policy ID</th>
                <th>Protocol</th>
                <th>Premium</th>
                <th>Coverage</th>
                <th>Expiry</th>
                <th>Wallet</th>
              </tr>
            </thead>
            <tbody id="coversTbody">
              <tr><td colspan="6" class="empty">Loading active covers...</td></tr>
            </tbody>
          </table>

          <a href="#" class="panel-footer-link">View All Active Covers</a>
        </div>

        <div class="panel">
          <div class="panel-head">
            <h2>Recent Activity</h2>
            <span class="activity-head-dot"></span>
          </div>

          <div id="activityList" class="activity-list">
            <div class="empty">Loading recent activity...</div>
          </div>

          <a href="#" class="history-link">🧾 <span>View Complete History</span></a>
        </div>
      </section>
    </main>
  </div>

  <script>
    function formatAda(n) {
      return Number(n || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

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

    function protocolBadgeLetter(protocol) {
      const p = String(protocol || '').toLowerCase();
      if (p === 'minswap') return 'M';
      if (p === 'indigo') return 'I';
      if (p === 'liqwid') return 'L';
      return '?';
    }

    function activityIconClass(title = '') {
      const t = title.toLowerCase();
      if (t.includes('membership')) return 'membership';
      if (t.includes('deposited')) return 'deposit';
      if (t.includes('claim') && t.includes('submitted')) return 'claim';
      if (t.includes('payout')) return 'execute';
      if (t.includes('vote')) return 'vote';
      return 'default';
    }

    function activityIcon(title = '') {
      const t = title.toLowerCase();
      if (t.includes('membership')) return '👥';
      if (t.includes('deposited')) return '▤';
      if (t.includes('claim') && t.includes('submitted')) return '△';
      if (t.includes('payout')) return '●';
      if (t.includes('vote')) return '☷';
      return '•';
    }

    async function loadStats() {
      const res = await fetch('get_admin_stats.php', { credentials: 'include' });
      const data = await res.json();

      if (!data.ok) return;

      document.getElementById('statTvl').textContent = formatAda(data.stats.total_value_locked_ada);
      document.getElementById('statRisk').textContent = formatAda(data.stats.total_active_risk_ada);
      document.getElementById('statMembers').textContent = Number(data.stats.total_members || 0).toLocaleString();
      document.getElementById('statRatio').textContent = formatAda(data.stats.payout_ratio_percent);

      const ratio = Math.max(0, Math.min(Number(data.stats.payout_ratio_percent || 0), 100));
      document.getElementById('ratioFill').style.width = ratio + '%';
    }

    async function loadCovers() {
      const res = await fetch('get_admin_covers.php?limit=10', { credentials: 'include' });
      const data = await res.json();

      const tbody = document.getElementById('coversTbody');

      if (!data.ok || !Array.isArray(data.covers) || data.covers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No active covers found.</td></tr>';
        return;
      }

      tbody.innerHTML = data.covers.map(c => `
        <tr>
          <td class="policy-id">${c.policy_id.replace('-', '-<wbr>')}</td>
          <td>
            <div class="protocol-cell">
              <span class="protocol-icon">${protocolBadgeLetter(c.protocol)}</span>
              <span>${c.protocol}</span>
            </div>
          </td>
          <td>${formatAda(c.premium_ada)} ADA</td>
          <td>${formatAda(c.coverage_ada)} ADA</td>
          <td>${c.expiry}</td>
          <td>
            <div class="wallet-cell">
              <span title="${c.wallet_address}">${shortWallet(c.wallet_address)}</span>
              <button class="copy-btn" onclick="copyWallet('${String(c.wallet_address).replace(/'/g, "\\'")}')">Copy</button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    async function loadActivity() {
      const res = await fetch('get_admin_activity.php?limit=10', { credentials: 'include' });
      const data = await res.json();

      const list = document.getElementById('activityList');

      if (!data.ok || !Array.isArray(data.activity) || data.activity.length === 0) {
        list.innerHTML = '<div class="empty">No recent activity found.</div>';
        return;
      }

      list.innerHTML = data.activity.map(item => `
        <div class="activity-item">
          <div class="activity-icon ${activityIconClass(item.title)}">${activityIcon(item.title)}</div>
          <div class="activity-body">
            <div class="activity-title">${item.title}</div>
            <div class="activity-desc">${item.description}</div>
            <div class="activity-time">${item.created_at}</div>
          </div>
        </div>
      `).join('');
    }

    async function boot() {
      await Promise.all([
        loadStats(),
        loadCovers(),
        loadActivity()
      ]);
    }

    document.addEventListener('DOMContentLoaded', boot);
  </script>

  <script type="module" src="new-app.js"></script>
</body>
</html>