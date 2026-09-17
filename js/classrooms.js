/* =========================================================
   ECS — Classrooms listing page
   ========================================================= */

let ecsFilterState = { query:'', filter:'all', sort:'power' };

function roomListCardTemplate(room){
  const statusBadge = room.occupied
    ? `<span class="badge badge-green"><span class="pulse-dot" style="background:#116430"></span>Occupied</span>`
    : `<span class="badge badge-gray">Empty</span>`;
  const isHot = room.temperature >= 30;
  const isHighEnergy = room.power >= 1500;
  return `
  <div class="room-card ${isHot ? 'alert-hot' : ''}">
    <div class="room-top">
      <div>
        <div class="room-name">${room.name}</div>
        <div class="room-sub">${room.dept} · ${room.building}</div>
      </div>
      ${statusBadge}
    </div>
    <div class="room-metrics">
      <div class="room-metric"><label>Temperature</label><span class="${isHot?'hot':''}">${room.temperature.toFixed(1)}°C</span></div>
      <div class="room-metric"><label>Power</label><span>${room.power} W ${isHighEnergy?'<span class="badge badge-amber" style="margin-left:4px">High</span>':''}</span></div>
    </div>
    <div class="room-controls-row">
      <span class="ctrl"><i data-lucide="lightbulb"></i>Light <b class="${room.light?'on':'off'}">${room.light?'ON':'OFF'}</b></span>
      <span class="ctrl"><i data-lucide="fan"></i>Fan <b class="${room.fan?'on':'off'}">${room.fan?'ON':'OFF'}</b></span>
    </div>
    <a class="btn btn-ghost btn-block btn-sm" href="classroom-details.html?id=${room.id}">View Details</a>
  </div>`;
}

function applyFilters(){
  let rooms = ecsGetRooms().slice();

  if(ecsFilterState.query){
    const q = ecsFilterState.query.toLowerCase();
    rooms = rooms.filter(r => r.name.toLowerCase().includes(q) || r.dept.toLowerCase().includes(q));
  }
  if(ecsFilterState.filter === 'occupied') rooms = rooms.filter(r => r.occupied);
  if(ecsFilterState.filter === 'empty') rooms = rooms.filter(r => !r.occupied);
  if(ecsFilterState.filter === 'high') rooms = rooms.filter(r => r.power >= 1500);

  if(ecsFilterState.sort === 'power') rooms.sort((a,b)=> b.power - a.power);
  if(ecsFilterState.sort === 'temp') rooms.sort((a,b)=> b.temperature - a.temperature);
  if(ecsFilterState.sort === 'energy') rooms.sort((a,b)=> b.energyToday - a.energyToday);

  return rooms;
}

function renderClassroomList(){
  const grid = document.getElementById('classroomListGrid');
  const empty = document.getElementById('classroomEmptyState');
  const rooms = applyFilters();
  document.getElementById('classroomResultCount').textContent = rooms.length;

  if(rooms.length === 0){
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = rooms.map(roomListCardTemplate).join('');
  ecsInitIcons();
}

function initClassroomControls(){
  const search = document.getElementById('classroomSearch');
  search.addEventListener('input', () => {
    ecsFilterState.query = search.value;
    renderClassroomList();
  });

  document.querySelectorAll('.pill-group [data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill-group [data-filter]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      ecsFilterState.filter = btn.dataset.filter;
      renderClassroomList();
    });
  });

  document.getElementById('classroomSort').addEventListener('change', (e) => {
    ecsFilterState.sort = e.target.value;
    renderClassroomList();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if(!document.getElementById('classroomListGrid')) return;
  initClassroomControls();
  renderClassroomList();
});
