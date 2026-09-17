/* =========================================================
   ECS — Alert Center
   ========================================================= */

let ecsActiveTab = 'all';

const SEV_ICON = { critical:'alert-octagon', warning:'alert-triangle', info:'info' };
const SEV_LABEL = { critical:'Critical', warning:'Warning', info:'Information' };

function alertTemplate(a){
  return `
  <div class="alert-item ${a.read ? 'is-read':''}" data-id="${a.id}">
    <div class="alert-sev ${a.sev}"><i data-lucide="${SEV_ICON[a.sev]}"></i></div>
    <div class="alert-content">
      <div class="alert-content-top">
        <div>
          <div class="alert-title">${a.title}</div>
          <div class="alert-desc">${a.desc}</div>
        </div>
        <span class="badge badge-${a.sev==='critical'?'red':a.sev==='warning'?'amber':'cyan'}">${SEV_LABEL[a.sev]}</span>
      </div>
      <div class="alert-meta-row">
        <span><i data-lucide="clock"></i>${a.time}</span>
        <span><i data-lucide="door-open"></i>${a.room}</span>
      </div>
    </div>
    <div class="alert-actions">
      ${!a.read ? `<button class="btn btn-ghost btn-sm" data-action="read" data-id="${a.id}" title="Mark as read"><i data-lucide="check"></i></button>` : ''}
      <button class="btn btn-ghost btn-sm" data-action="dismiss" data-id="${a.id}" title="Dismiss"><i data-lucide="x"></i></button>
    </div>
  </div>`;
}

function renderAlerts(){
  const list = ecsGetAlerts();
  const filtered = ecsActiveTab === 'all' ? list : list.filter(a => a.sev === ecsActiveTab);
  const wrap = document.getElementById('alertList');
  const empty = document.getElementById('alertEmptyState');

  document.getElementById('countAll').textContent = list.length;
  document.getElementById('countCritical').textContent = list.filter(a=>a.sev==='critical').length;
  document.getElementById('countWarning').textContent = list.filter(a=>a.sev==='warning').length;
  document.getElementById('countInfo').textContent = list.filter(a=>a.sev==='info').length;

  if(filtered.length === 0){
    wrap.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  wrap.innerHTML = filtered.map(alertTemplate).join('');
  ecsInitIcons();

  wrap.querySelectorAll('[data-action="read"]').forEach(btn => btn.addEventListener('click', () => {
    const list = ecsGetAlerts();
    const a = list.find(x=>x.id===btn.dataset.id);
    if(a) a.read = true;
    ecsSaveAlerts(list);
    renderAlerts();
    ecsToast('Alert marked as read', 'info');
  }));
  wrap.querySelectorAll('[data-action="dismiss"]').forEach(btn => btn.addEventListener('click', () => {
    const list = ecsGetAlerts().filter(x=>x.id!==btn.dataset.id);
    ecsSaveAlerts(list);
    renderAlerts();
    ecsToast('Alert dismissed', 'success');
  }));
}

function initAlertTabs(){
  document.querySelectorAll('.alert-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.alert-tabs button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      ecsActiveTab = btn.dataset.tab;
      renderAlerts();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if(!document.getElementById('alertList')) return;
  initAlertTabs();
  renderAlerts();
});
