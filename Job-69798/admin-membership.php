<?php
declare(strict_types=1);
require_once __DIR__ . '/admin_auth.php';
require_admin_page();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CoxyInsure Admin Membership</title>
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

    .member-stats{
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

    .members-panel{
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

    .cover-badge{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:4px 10px;
      border-radius:999px;
      font-size:11px;
      font-weight:800;
      background:#EEF2FF;
      color:#1D4ED8;
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

    .empty{
      padding:22px 18px;
      color:var(--muted);
      font-size:14px;
    }

    @media (max-width:1200px){
      .member-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
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
      .member-stats{grid-template-columns:1fr}
      .heading{font-size:30px}
      .topnav{gap:18px;flex-wrap:wrap}
      .search-box{min-width:100%}
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
          <a href="admin-governance.php">Governance</a>
          <a href="admin-membership.php" class="active">Membership</a>
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
        <a class="side-link" href="admin-claims.php"><span class="side-icon">🧾</span><span>Claims Queue</span></a>
        <a class="side-link active" href="admin-membership.php"><span class="side-icon">👥</span><span>Member Registry</span></a>
        <a class="side-link" href="admin-governance.php"><span class="side-icon">🗳️</span><span>Voting Terminal</span></a>
      </div>

      <div class="sidebar-bottom">
        <a class="side-mini" href="#"><span class="side-icon">❔</span><span>Support</span></a>
        <a class="side-mini" href="#"><span class="side-icon">🧾</span><span>Logs</span></a>
      </div>
    </aside>

    <main class="main">
      <div class="eyebrow">Network: Mainnet-Beta</div>
      <h1 class="heading">Member Registry</h1>

      <section class="member-stats">
        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Total Registered Users</div>
              <div class="stat-badge badge-blue">Live</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statTotalMembers">0</span>
              <span class="u">USERS</span>
            </div>
          </div>
          <div class="mini-bars">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Members With Covers</div>
              <div class="stat-badge badge-green">Protected</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statCoveredMembers">0</span>
              <span class="u">WALLETS</span>
            </div>
          </div>
          <div class="mini-bars">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-top">
              <div class="stat-label">Total Purchased Covers</div>
              <div class="stat-badge badge-blue">Active</div>
            </div>
            <div class="stat-number">
              <span class="n" id="statTotalCovers">0</span>
              <span class="u">COVERS</span>
            </div>
          </div>
          <div class="mini-bars">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
      </section>

      <section class="members-panel">
        <div class="panel-head">
          <h2>All Members</h2>

          <div class="table-tools">
            <div class="search-box">
              🔎
              <input id="memberSearch" type="text" placeholder="Search wallet address..." />
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Wallet</th>
              <th>Purchased Covers</th>
              <th>Latest Cover Deadline</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="membersBody">
            <tr><td colspan="4" class="empty">Loading members...</td></tr>
          </tbody>
        </table>

        <div class="panel-footer">
          <span class="panel-footer-link">Membership data is loaded from registered users and linked covers</span>
        </div>
      </section>
    </main>
  </div>

  <script>
    let ALL_MEMBERS = [];

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

    function updateStats(members) {
      const totalMembers = members.length;
      const coveredMembers = members.filter(m => Number(m.covers || 0) > 0).length;
      const totalCovers = members.reduce((sum, m) => sum + Number(m.covers || 0), 0);

      document.getElementById('statTotalMembers').textContent = totalMembers.toLocaleString();
      document.getElementById('statCoveredMembers').textContent = coveredMembers.toLocaleString();
      document.getElementById('statTotalCovers').textContent = totalCovers.toLocaleString();
    }

    function renderMembers() {
      const body = document.getElementById('membersBody');
      const search = (document.getElementById('memberSearch').value || '').toLowerCase().trim();

      const filtered = ALL_MEMBERS.filter(m => {
        return search === '' ? true : (m.wallet || '').toLowerCase().includes(search);
      });

      if (!filtered.length) {
        body.innerHTML = '<tr><td colspan="4" class="empty">No members found.</td></tr>';
        return;
      }

      body.innerHTML = filtered.map(m => `
        <tr>
          <td>
            <div class="wallet-cell">
              <span title="${m.wallet}">${shortWallet(m.wallet)}</span>
              <button class="copy-btn" onclick="copyWallet('${String(m.wallet).replace(/'/g, "\\'")}')">Copy</button>
            </div>
          </td>
          <td>
            <span class="cover-badge">${Number(m.covers || 0)}</span>
          </td>
          <td>${m.expiry || '--'}</td>
          <td></td>
        </tr>
      `).join('');
    }

    async function loadMembers() {
      try {
        const res = await fetch('get_admin_members.php', { credentials: 'include' });
        const data = await res.json();

        if (!data.ok || !Array.isArray(data.members)) {
          document.getElementById('membersBody').innerHTML = '<tr><td colspan="4" class="empty">No members found.</td></tr>';
          return;
        }

        ALL_MEMBERS = data.members;
        updateStats(ALL_MEMBERS);
        renderMembers();
      } catch (e) {
        console.error(e);
        document.getElementById('membersBody').innerHTML = '<tr><td colspan="4" class="empty">Failed to load members.</td></tr>';
      }
    }

    document.getElementById('memberSearch').addEventListener('input', renderMembers);
    document.addEventListener('DOMContentLoaded', loadMembers);
  </script>

  <script type="module" src="new-app.js"></script>
</body>
</html>