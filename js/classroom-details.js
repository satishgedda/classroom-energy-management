/* =========================================================
   ECS — Classroom details page
   ========================================================= */

function getRoomIdFromUrl(){
  const params = new URLSearchParams(location.search);
  return params.get('id') || 'A101';
}

const APPLIANCES = [
  { key:'light', name:'Ceiling Lights', icon:'lightbulb' },
  { key:'fan', name:'Fan', icon:'fan' },
  { key:'projector', name:'Projector', icon:'projector' },
  { key:'ac', name:'AC', icon:'wind' },
];

function renderRoomHeader(room){
  document.getElementById('roomTitle').textContent = room.name;
  document.getElementById('roomSubtitle').textContent = `${room.dept} · ${room.building}, ${room.floor}`;
  const statusEl = document.getElementById('roomStatusBadge');
  statusEl.innerHTML = room.occupied
    ? `<span class="pulse-dot" style="background:#116430"></span>Occupied`
    : `<span class="dot" style="background:var(--ink-400)"></span>Empty`;
  statusEl.className = 'badge ' + (room.occupied ? 'badge-green' : 'badge-gray');
  document.title = room.name + ' · Classroom Energy Management System';
  document.querySelector('.breadcrumb').innerHTML = `ECS <span>/</span> Classrooms <span>/</span> ${room.name}`;
}

function renderMetricTiles(room){
  const cost = (room.energyToday * ecsGetSettings().costPerUnit);
  document.getElementById('metricTiles').innerHTML = `
    <div class="metric-tile"><label>Temperature</label><div class="v">${room.temperature.toFixed(1)}<small>°C</small></div></div>
    <div class="metric-tile"><label>Humidity</label><div class="v">${room.humidity}<small>%</small></div></div>
    <div class="metric-tile"><label>Light Intensity</label><div class="v">${room.lightLevel}<small>%</small></div></div>
    <div class="metric-tile"><label>Current</label><div class="v">${room.current.toFixed(2)}<small>A</small></div></div>
    <div class="metric-tile"><label>Power</label><div class="v">${room.power}<small>W</small></div></div>
    <div class="metric-tile"><label>Energy Today</label><div class="v">${room.energyToday.toFixed(2)}<small>kWh</small></div></div>
  `;
  document.getElementById('estCostVal').textContent = '₹' + Math.round(cost);
}

function renderAppliances(room){
  document.getElementById('applianceGrid').innerHTML = APPLIANCES.map(app => {
    const on = room[app.key];
    return `
    <div class="appliance-card ${on ? 'is-on':''}">
      <div class="appliance-top">
        <div class="appliance-name"><span class="ico"><i data-lucide="${app.icon}"></i></span>${app.name}</div>
        <label class="switch"><input type="checkbox" data-appliance="${app.key}" ${on?'checked':''}><span class="track"></span></label>
      </div>
      <div class="appliance-meta">
        <span class="badge ${on?'badge-green':'badge-gray'}">${on?'ON':'OFF'}</span>
        <span class="power">${on ? room.appliancePower[app.key] : 0} W</span>
      </div>
    </div>`;
  }).join('');
  ecsInitIcons();

  document.querySelectorAll('[data-appliance]').forEach(input => {
    input.addEventListener('change', () => {
      const key = input.dataset.appliance;
      const label = APPLIANCES.find(a=>a.key===key).name;
      const updated = ecsToggleAppliance(room.id, key);
      renderMetricTiles(updated);
      renderAppliances(updated);
      ecsToast(`${label} turned ${updated[key] ? 'ON' : 'OFF'}`, updated[key] ? 'success' : 'info');
    });
  });
}

function renderSensorPanel(room){
  const sensors = ecsSensorSnapshot(room);
  const iconMap = { pir:'radar', ldr:'sun', 'dht-t':'thermometer', 'dht-h':'droplet', current:'zap' };
  document.getElementById('detailSensorGrid').innerHTML = sensors.map(s => `
    <div class="sensor-card">
      <div class="sensor-top"><span class="sensor-name">${s.name}</span><span class="sensor-ico"><i data-lucide="${iconMap[s.key]}"></i></span></div>
      <div class="sensor-value">${s.value}</div>
      <div class="sensor-viz">${Array.from({length:10}).map((_,i)=>`<i style="height:${16+Math.random()*18}px;${i===9?'background:var(--cyan-500)':''}"></i>`).join('')}</div>
    </div>
  `).join('');
  ecsInitIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('applianceGrid');
  if(!grid) return;
  const room = ecsGetRoom(getRoomIdFromUrl());
  if(!room){
    document.getElementById('roomNotFound').style.display = 'flex';
    document.getElementById('roomContent').style.display = 'none';
    return;
  }
  renderRoomHeader(room);
  renderMetricTiles(room);
  renderAppliances(room);
  renderSensorPanel(room);

  setInterval(() => {
    if(room.occupied){
      room.temperature = +ecsDrift(room.temperature, 0.25, 22, 34).toFixed(1);
      room.humidity = Math.round(ecsDrift(room.humidity, 1.5, 40, 75));
      renderMetricTiles(room);
      renderSensorPanel(room);
    }
  }, 4000);
});
