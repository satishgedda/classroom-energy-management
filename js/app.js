/* =========================================================
   ECS — App shell: sidebar, topbar, auth guard, toasts
   ========================================================= */

(function authGuard(){
  const page = location.pathname.split('/').pop() || 'login.html';
  const loggedIn = localStorage.getItem('ecs_auth') === 'true';
  const isAuthPage = page === 'login.html' || page === 'signup.html';
  if(!isAuthPage && !loggedIn){
    location.href = 'login.html';
  }
})();

function ecsLogout(){
  localStorage.removeItem('ecs_auth');
  localStorage.removeItem('ecs_user_name');
  localStorage.removeItem('ecs_user_email');
  if(typeof firebase !== 'undefined' && firebase.auth){
    try { firebase.auth().signOut(); } catch(e){}
  }
  location.href = 'login.html';
}

function ecsInitIcons(){
  if(window.lucide) lucide.createIcons();
}

/* ---------- Sidebar collapse (desktop) ---------- */
function ecsInitSidebar(){
  const shell = document.querySelector('.app-shell');
  const collapseBtn = document.getElementById('sidebarCollapseBtn');
  if(!shell) return;

  if(localStorage.getItem('ecs_sidebar_collapsed') === 'true'){
    shell.classList.add('collapsed');
  }
  if(collapseBtn){
    collapseBtn.addEventListener('click', () => {
      shell.classList.toggle('collapsed');
      localStorage.setItem('ecs_sidebar_collapsed', shell.classList.contains('collapsed'));
    });
  }

  // Mobile drawer
  const hamburger = document.getElementById('hamburgerBtn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('drawerOverlay');
  function closeDrawer(){ sidebar.classList.remove('drawer-open'); overlay.classList.remove('open'); }
  function openDrawer(){ sidebar.classList.add('drawer-open'); overlay.classList.add('open'); }
  if(hamburger){
    hamburger.addEventListener('click', openDrawer);
    overlay.addEventListener('click', closeDrawer);
    sidebar.querySelectorAll('.nav-item').forEach(el => el.addEventListener('click', closeDrawer));
  }

  // Active nav item
  const page = location.pathname.split('/').pop() || 'index.html';
  sidebar.querySelectorAll('.nav-item').forEach(item => {
    if(item.dataset.page === page) item.classList.add('active');
  });
}

/* ---------- Notification dropdown ---------- */
function ecsInitNotifications(){
  const btn = document.getElementById('notifBtn');
  const panel = document.getElementById('notifPanel');
  if(!btn || !panel) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if(!panel.contains(e.target)) panel.classList.remove('open');
  });
}

/* ---------- Live clock ---------- */
function ecsInitClock(){
  const el = document.getElementById('liveClock');
  const upd = document.getElementById('lastUpdated');
  if(!el && !upd) return;
  function tick(){
    const now = new Date();
    const opts = { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' };
    if(el) el.textContent = now.toLocaleString('en-IN', opts);
    if(upd) upd.textContent = 'Last updated ' + now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }
  tick();
  setInterval(tick, 1000);
}

/* ---------- Toast notifications ---------- */
function ecsToast(message, type = 'success'){
  let wrap = document.querySelector('.toast-wrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const icons = {
    success: '<i data-lucide="check"></i>',
    warn: '<i data-lucide="alert-triangle"></i>',
    info: '<i data-lucide="info"></i>',
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-ico">${icons[type] || icons.success}</span><span>${message}</span>`;
  wrap.appendChild(toast);
  ecsInitIcons();
  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

/* ---------- User initials avatar ---------- */
function ecsSetUserMeta(){
  const name = localStorage.getItem('ecs_user_name') || 'Admin';
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  document.querySelectorAll('[data-user-avatar]').forEach(el => el.textContent = initials || 'AD');
  document.querySelectorAll('.topbar-user-meta .name, .sidebar-footer .user-name').forEach(el => el.textContent = name);
}

document.addEventListener('DOMContentLoaded', () => {
  ecsInitIcons();
  ecsInitSidebar();
  ecsInitNotifications();
  ecsInitClock();
  ecsSetUserMeta();
});
