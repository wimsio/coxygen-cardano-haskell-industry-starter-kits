
window.COXY_MANUAL_NAV = [
  [
    "1.",
    "Welcome to the CoxyInsure User Manual",
    "index.html",
    "👋"
  ],
  [
    "2.",
    "Get Started",
    "getting-started.html",
    "🚀"
  ],
  [
    "3.",
    "Connect Wallet and Verify Access",
    "connect-wallet.html",
    "🔗"
  ],
  [
    "4.",
    "Membership and Identity",
    "membership.html",
    "🛡️"
  ],
  [
    "5.",
    "Capital Pools and Deposits",
    "pools.html",
    "🪙"
  ],
  [
    "6.",
    "Buy Cover and Active Cover Tracking",
    "buy-cover.html",
    "💳"
  ],
  [
    "7.",
    "Submit and Track Claims",
    "claims.html",
    "🧾"
  ],
  [
    "8.",
    "Governance and Voting",
    "governance.html",
    "🗳️"
  ],
  [
    "9.",
    "History and Audit",
    "history.html",
    "📊"
  ],
  [
    "10.",
    "Admin Portal Overview",
    "admin-portal.html",
    "👑"
  ],
  [
    "11.",
    "Help, Safety, and FAQ",
    "help-faq.html",
    "❓"
  ]
];

function renderNav(){
  const navHost = document.getElementById('navList');
  if(!navHost || !window.COXY_MANUAL_NAV) return;
  const current = window.location.pathname.split('/').pop() || 'index.html';
  navHost.innerHTML = window.COXY_MANUAL_NAV.map(([num,title,url,icon]) => {
    const active = current === url ? ' active' : '';
    return `<a class="nav-link${active}" href="${url}"><span class="nav-num">${num}</span><span class="nav-text">${icon} ${title}</span></a>`;
  }).join('');
}
