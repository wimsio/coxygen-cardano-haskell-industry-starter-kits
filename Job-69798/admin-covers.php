<?php
declare(strict_types=1);
require_once __DIR__ . '/admin_auth.php';
require_admin_page();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Admin Active Covers</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">

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
  background:#EEF2FF;
  color:#1D4ED8;
  border-radius:999px;
  height:26px;
  padding:0 12px;
  font-size:11px;
  font-weight:800;
  cursor:pointer;
  transition:all .2s ease;
}

.copy-btn:hover{
  background:#1D4ED8;
  color:#fff;
  transform:scale(1.05);
}

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
.blue-card{
  background:#1D4ED8;
  color:#fff;
  border-radius:18px;
  padding:24px;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.blue-card h2{
  margin:0;
  font-size:32px;
  font-weight:800;
}

.sub-stats{
  display:flex;
  gap:20px;
  margin-top:12px;
}

.sub-stat{
  background:rgba(255,255,255,0.15);
  padding:10px 14px;
  border-radius:10px;
  font-size:13px;
}

.filters{
  background:#fff;
  border:1px solid #E7EBF0;
  border-radius:18px;
  padding:16px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-top:20px;
}

.tabs button{
  border:none;
  padding:8px 14px;
  border-radius:10px;
  margin-right:6px;
  font-weight:700;
  cursor:pointer;
}

.tabs .active{
  background:#1D4ED8;
  color:#fff;
}

.status{
  padding:4px 10px;
  border-radius:999px;
  font-size:11px;
  font-weight:800;
}

.status.active{background:#D1FAE5;color:#047857;}
.status.expired{background:#E5E7EB;color:#374151;}
.status.claimed{background:#FEE2E2;color:#991B1B;}

.actions{
  cursor:pointer;
  font-size:18px;
}
</style>
</head>

<body>
<div class="app">

<!-- ===== TOPBAR (UNCHANGED) ===== -->
<header class="topbar">
  <div class="top-left">
    <div class="brand">VaultAdmin</div>

    <nav class="topnav">
      <a href="admin-dashboard.php">Dashboard</a>
      <a href="admin-covers.php" class="active">Active Covers</a>
      <a href="admin-claims.php">Claims</a>
      <a href="admin-governance.php">Governance</a>
      <a href="admin-membership.php">Membership</a>
    </nav>
  </div>

  <div class="top-actions">
    <button class="icon-btn">🔔</button>
    <button class="icon-btn">⚙️</button>
    <button class="wallet-btn" onclick="init()">Connect Wallet</button>
    <div class="avatar">🧑🏾</div>
  </div>
</header>

<!-- ===== SIDEBAR (UNCHANGED) ===== -->
<aside class="sidebar">
  <div class="side-brand">
    <div class="shield">🛡️</div>
    <div>
      <h3>CoxyInsure</h3>
      <p>Cardano Network</p>
    </div>
  </div>

  <div class="side-nav">
    <a class="side-link" href="admin-dashboard.php">📊 Protocol Health</a>
    <a class="side-link active" href="admin-covers.php">🛡️ Risk Management</a>
    <a class="side-link" href="admin-claims.php">🧾 Claims Queue</a>
    <a class="side-link" href="admin-membership.php">👥 Member Registry</a>
    <a class="side-link" href="admin-governance.php">🗳️ Voting Terminal</a>
  </div>
</aside>

<!-- ===== MAIN ===== -->
<main class="main">

<h1 class="heading">Active Covers</h1>

<!-- ===== TOP STATS ===== -->
<div style="display:grid;grid-template-columns:1fr 2fr;gap:16px">

  <div class="stat-card">
  <div class="stat-top">
    <div class="stat-label">Total Active Policies</div>
  </div>

  <div class="stat-number">
    <span class="n" id="totalPolicies">0</span>
    <span class="u">POLICIES</span>
  </div>
</div>

  <div class="blue-card">
    <div>
      <div style="font-size:12px;opacity:.8">TOTAL UNDERWRITTEN VALUE</div>
      <h2 id="totalCoverage">0 ADA</h2>

      <div class="sub-stats">
        <div class="sub-stat">Yield Earned: <span id="yield">0</span> ADA</div>
        <div class="sub-stat">Reserve Ratio: <span id="ratio">0%</span></div>
      </div>
    </div>
  </div>

</div>

<!-- ===== FILTERS ===== -->
<div class="filters">

  <div style="display:flex;align-items:center;gap:10px">
    <span style="font-size:12px;color:#98A2B3;font-weight:700">
      FILTER BY PROTOCOL
    </span>

    <select id="protocolFilter" style="padding:6px 10px;border-radius:8px">
      <option value="">All Protocols</option>
      <option>Minswap</option>
      <option>Indigo</option>
      <option>Liqwid</option>
    </select>
  </div>

  <div class="tabs">
    <button class="active" onclick="setStatus('active')">Active</button>
    <button onclick="setStatus('expired')">Expired</button>
    <button onclick="setStatus('claimed')">Claimed</button>
  </div>

  <input 
  id="walletSearch" 
  placeholder="Paste wallet address..." 
  style="
    padding:8px 12px;
    border-radius:10px;
    border:1px solid #E7EBF0;
    width:260px;
    font-weight:600;
  "
/>

  <button onclick="exportCSV()" style="
    display:flex;
    align-items:center;
    gap:6px;
    padding:8px 14px;
    border-radius:10px;
    border:1px solid #E7EBF0;
    background:#fff;
    font-weight:700;
  ">
    ⬇ Export CSV
  </button>

</div>

<!-- ===== TABLE ===== -->
<div class="panel" style="margin-top:20px">

<table>
<thead>
<tr>
<th>Policy ID</th>
<th>Protocol</th>
<th>Coverage</th>
<th>Premium</th>
<th>Duration</th>
<th>Status</th>
<th>Wallet</th>
<th></th>
</tr>
</thead>

<tbody id="tableBody">
<tr><td colspan="8">Loading...</td></tr>
</tbody>

</table>

</div>

</main>
</div>

<script>
let allData = [];
let currentStatus = "active";

/* ===== HELPERS ===== */
function shortWallet(w){
  if(!w) return '--';
  return w.slice(0,10)+"..."+w.slice(-6);
}

function formatADA(v){
  return Number(v || 0).toLocaleString(undefined,{minimumFractionDigits:2});
}

/* ===== LOAD DATA ===== */
async function loadData(){
  try{
    const res = await fetch("get_admin_covers.php?limit=100",{credentials:"include"});
    const data = await res.json();

    if(!data.ok){
      console.error(data);
      return;
    }

    allData = (data.covers || []).map(c => ({
      policy_id: c.policy_id || c.id,
      protocol: c.protocol || 'Unknown',
      coverage: Number(c.coverage_ada ?? c.coverage ?? 0),
      premium: Number(c.premium_ada ?? c.premium ?? 0),
      wallet: c.wallet_address ?? c.wallet ?? '',
      start: c.start_date ?? '',
      expiry: c.end_date ?? c.expiry ?? '',
      status: getStatus(c)
    }));

    render();
  }catch(e){
    console.error(e);
  }
}

/* ===== STATUS LOGIC ===== */
function getStatus(c){
  const now = new Date();

  if(c.claimed === 1 || c.status === "claimed") return "claimed";

  const end = new Date(c.end_date || c.expiry);
  if(end < now) return "expired";

  return "active";
}

/* ===== RENDER ===== */
function render(){

  let filtered = allData.filter(c => c.status === currentStatus);

  // 🔥 WALLET SEARCH FILTER
  const search = document.getElementById("walletSearch").value.trim().toLowerCase();

  if(search){
    filtered = filtered.filter(c => 
      (c.wallet || '').toLowerCase().includes(search)
    );
  }

  // ===== STATS =====
  document.getElementById("totalPolicies").innerText = filtered.length;

  const totalCoverage = filtered.reduce((a,b)=>a+b.coverage,0);
  document.getElementById("totalCoverage").innerText =
    formatADA(totalCoverage)+" ADA";

  // ===== TABLE =====
  const tbody = document.getElementById("tableBody");

  if(filtered.length === 0){
    tbody.innerHTML = `<tr><td colspan="8">No data found</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c=>`
    <tr>
      <td><b>#${c.policy_id}</b></td>
      <td>${c.protocol}</td>
      <td>${formatADA(c.coverage)} ADA</td>
      <td>${formatADA(c.premium)} ADA</td>
      <td>
        ${c.start}<br>
        <small style="color:#98A2B3">ENDS ${c.expiry}</small>
      </td>
      <td><span class="status ${c.status}">${c.status}</span></td>
      <td class="wallet-cell">
        ${shortWallet(c.wallet)}
        <button class="copy-btn" onclick="copyWallet('${c.wallet}')">Copy</button>
      </td>
      <td class="actions">⋮</td>
    </tr>
  `).join('');
}

/* ===== FILTER ===== */
function setStatus(s){
  currentStatus = s;

  document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));
  event.target.classList.add("active");

  render();
}

/* ===== COPY ===== */
async function copyWallet(w){
  await navigator.clipboard.writeText(w);
}

/* ===== SEARCH LISTENER ===== */
document.addEventListener("input", e=>{
  if(e.target.id === "walletSearch"){
    render();
  }
});

/* ===== CSV EXPORT ===== */
function exportCSV(){
  let rows = ["PolicyID,Protocol,Coverage,Premium,Wallet"];

  allData.forEach(c=>{
    rows.push(`${c.policy_id},${c.protocol},${c.coverage},${c.premium},${c.wallet}`);
  });

  let blob = new Blob([rows.join("\n")]);
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "covers.csv";
  a.click();
}

loadData();
</script>

<script type="module" src="new-app.js"></script>

</body>
</html>