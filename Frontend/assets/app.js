/* ============================================================
   EduCredentials — Shared Frontend JS
   ============================================================ */

const API_BASE = 'http://localhost:3000/api';  // same-origin in production

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------
const Auth = {
  setToken(token) { localStorage.setItem('ec_token', token); },
  getToken()      { return localStorage.getItem('ec_token'); },
  setUser(user)   { localStorage.setItem('ec_user', JSON.stringify(user)); },
  getUser()       { try { return JSON.parse(localStorage.getItem('ec_user')); } catch { return null; } },
  clear()         { localStorage.removeItem('ec_token'); localStorage.removeItem('ec_user'); },
  isLoggedIn()    { return !!this.getToken(); },
};

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------
async function apiRequest(path, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    Auth.clear();
    window.location.href = '/index.html?session=expired';
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

const api = {
  get:    (path)         => apiRequest(path, { method: 'GET' }),
  post:   (path, body)   => apiRequest(path, { method: 'POST', body }),
  patch:  (path, body)   => apiRequest(path, { method: 'PATCH', body }),
  delete: (path)         => apiRequest(path, { method: 'DELETE' }),
};

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
function toast(message, type = 'info') {
  const existing = document.querySelector('.toast-container');
  let container = existing;
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }

  const t = document.createElement('div');
  const colors = { success: '#1a7a4a', error: '#c0392b', info: '#1a3055', warning: '#b87a1a' };
  t.style.cssText = `background:${colors[type]||colors.info};color:#fff;padding:12px 20px;border-radius:8px;
    font-size:.88rem;max-width:340px;box-shadow:0 4px 20px rgba(0,0,0,.2);
    animation:slideIn .2s ease;font-family:'DM Sans',sans-serif;`;
  t.textContent = message;
  container.appendChild(t);

  const style = document.getElementById('toast-style');
  if (!style) {
    const s = document.createElement('style');
    s.id = 'toast-style';
    s.textContent = '@keyframes slideIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}';
    document.head.appendChild(s);
  }

  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 4000);
}

function showAlert(el, message, type) {
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = message;
  el.style.display = 'block';
}

function hideAlert(el) {
  if (el) el.style.display = 'none';
}

function setLoading(btn, loading, originalText) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Loading...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText || btn.dataset.original || 'Submit';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatType(type) {
  return { diploma: 'Diploma', certificate: 'Certificate', micro_credential: 'Micro-credential' }[type] || type;
}

function statusBadge(status) {
  const map = {
    issued:  ['badge-success', '●', 'Issued'],
    revoked: ['badge-danger',  '●', 'Revoked'],
    draft:   ['badge-warning', '●', 'Draft'],
  };
  const [cls, dot, label] = map[status] || ['badge-info', '●', status];
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

// ---------------------------------------------------------------------------
// Navbar initialise
// ---------------------------------------------------------------------------
function initNavbar(role) {
  const userEl = document.getElementById('navbar-user');
  const user   = Auth.getUser();
  if (userEl && user) userEl.textContent = user.email || '';

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.clear();
      window.location.href = '/index.html';
    });
  }
}

// Active nav link
function setActiveNav(href) {
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === href ||
      window.location.pathname.endsWith(a.getAttribute('href')));
  });
}

// Modal helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// Expose globals
window.api     = api;
window.Auth    = Auth;
window.toast   = toast;
window.showAlert  = showAlert;
window.hideAlert  = hideAlert;
window.setLoading = setLoading;
window.formatDate = formatDate;
window.formatType = formatType;
window.statusBadge = statusBadge;
window.escapeHtml  = escapeHtml;
window.initNavbar  = initNavbar;
window.setActiveNav = setActiveNav;
window.openModal   = openModal;
window.closeModal  = closeModal;