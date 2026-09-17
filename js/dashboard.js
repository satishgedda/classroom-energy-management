/* =========================================================
   ECS — Dashboard page
   ========================================================= */

let ecsChart = null;
const DEMO_ROOM_ID = 'A102'; // used by the automation simulation panel

function renderKPIs(){
  const rooms = ecsGetRooms();
  const totalEnergy = ecsTotalEnergyToday();
  const cost = ecsEstimatedCostToday();
  document.getElementById('kpiTotalClassrooms').textContent = rooms.length;
  document.getElementById('kpiOccupied').textContent = ecsOccupiedCount();
  document.getElementById('kpiEnergy').textContent = totalEnergy.toFixed(1) + ' kWh';
  document.getElementById('kpiCost').textContent = '₹' + Math.round(cost).toLocaleString('en-IN');
  document.getElementById('kpiSaved').textContent = '18.4%';
}

function roomCardTemplate(room){
  const statusBadge = room.occupied
    ? `<span class="badge badge-green"><span class="pulse-dot" style="background:#116430"></span>Occupied</span>`
    : `<span class="badge badge-gray">Empty</span>`;
  const isHot = room.temperature >= 30;
  return `
  <div class="room-card ${isHot ? 'alert-hot' : ''}" data-room="${room.id}">
    <div class="room-top">
      <div>
        <div class="room-name">${room.name}</div>
        <div class="room-sub">${room.dept}</div>
      </div>
      ${statusBadge}
    </div>
    <div class="room-metrics">
      <div class="room-metric"><label>Temperature</label><span class="${isHot ? 'hot' : ''}">${room.temperature.toFixed(1)}°C</span></div>
      <div class="room-metric"><label>Power</label><span>${room.power} W</span></div>
    </div>
    <div class="room-controls-row">
      <span class="ctrl"><i data-lucide="lightbulb"></i>Light <b class="${room.light?'on':'off'}">${room.light?'ON':'OFF'}</b></span>
      <span class="ctrl"><i data-lucide="fan"></i>Fan <b class="${room.fan?'on':'off'}">${room.fan?'ON':'OFF'}</b></span>
    </div>
    <a class="btn btn-ghost btn-block btn-sm" href="classroom-details.html?id=${room.id}">View Details</a>
  </div>`;
}

function renderRoomGrid(){
  const grid = document.getElementById('dashboardRoomGrid');
  if(!grid) return;
  const rooms = ecsGetRooms().slice(0, 8);
  grid.innerHTML = rooms.map(roomCardTemplate).join('');
  ecsInitIcons();
}

function sensorIconFor(icon){
  const map = { motion:'radar', sun:'sun', thermometer:'thermometer', droplet:'droplet', zap:'zap' };
  return map[icon] || 'activity';
}

function renderSensorFeed(){
  const wrap = document.getElementById('sensorFeed');
  if(!wrap) return;
  const room = ecsGetRoom('A101');
  const sensors = ecsSensorSnapshot(room);
  wrap.innerHTML = sensors.map(s => `
    <div class="sensor-card">
      <div class="sensor-top">
        <span class="sensor-name">${s.name}</span>
        <span class="sensor-ico"><i data-lucide="${sensorIconFor(s.icon)}"></i></span>
      </div>
      <div class="sensor-value">${s.value}</div>
      <div class="sensor-viz">${Array.from({length:12}).map((_,i)=>`<i style="height:${18+Math.random()*20}px;${i===11?'background:var(--cyan-500)':''}"></i>`).join('')}</div>
    </div>
  `).join('');
  ecsInitIcons();
}

/* ---------- Chart.js real-time energy consumption ---------- */
function genSeries(range){
  let labels, points, peakIdx;
  if(range === 'today'){
    labels = Array.from({length:12}, (_,i)=> (i*2)+':00');
    points = [2.1,1.8,1.6,3.4,5.2,6.8,7.9,7.2,6.1,5.4,4.8,3.2];
    peakIdx = 6;
  } else if(range === 'week'){
    labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    points = [42,46,51,48,55,38,31];
    peakIdx = 4;
  } else {
    labels = Array.from({length:30}, (_,i)=> i+1);
    points = labels.map((_,i)=> 38 + Math.sin(i/3)*9 + (i%7===0?12:0) + Math.random()*4);
    peakIdx = points.indexOf(Math.max(...points));
  }
  const avg = points.reduce((a,b)=>a+b,0)/points.length;
  return { labels, points, avgLine: labels.map(()=>avg), peak: points[peakIdx], avg };
}

function renderChart(range = 'today'){
  const ctx = document.getElementById('energyChart');
  if(!ctx) return;
  const { labels, points, avgLine, peak, avg } = genSeries(range);
  document.getElementById('chartPeakVal').textContent = peak.toFixed(1) + ' kWh';
  document.getElementById('chartAvgVal').textContent = avg.toFixed(1) + ' kWh';

  if(ecsChart) ecsChart.destroy();
  ecsChart = new Chart(ctx, {
    type:'line',
    data:{
      labels,
      datasets:[
        {
          label:'Consumption',
          data:points,
          borderColor:'#0ea5e9',
          backgroundColor:(c)=>{
            const g = c.chart.ctx.createLinearGradient(0,0,0,260);
            g.addColorStop(0,'rgba(14,165,233,.28)');
            g.addColorStop(1,'rgba(14,165,233,0)');
            return g;
          },
          borderWidth:2.5, tension:.4, fill:true, pointRadius:0, pointHoverRadius:5,
          pointHoverBackgroundColor:'#0ea5e9', pointHoverBorderColor:'#fff', pointHoverBorderWidth:2,
        },
        {
          label:'Average',
          data:avgLine,
          borderColor:'#c7ceda', borderWidth:1.5, borderDash:[5,5],
          pointRadius:0, fill:false, tension:0,
        }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{ legend:{ display:false },
        tooltip:{
          backgroundColor:'#0d1a2e', titleFont:{family:'Plus Jakarta Sans',weight:'700'},
          bodyFont:{family:'JetBrains Mono'}, padding:10, cornerRadius:8, displayColors:false,
          callbacks:{ label:(c)=> `${c.dataset.label}: ${c.parsed.y.toFixed(1)} kWh` }
        }
      },
      scales:{
        x:{ grid:{ display:false }, ticks:{ color:'#8b96a8', font:{size:11} } },
        y:{ grid:{ color:'#eef1f6' }, ticks:{ color:'#8b96a8', font:{size:11}, callback:(v)=>v+' kWh' } }
      }
    }
  });
}

function initChartControls(){
  document.querySelectorAll('.chart-controls button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-controls button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderChart(btn.dataset.range);
    });
  });
}

/* ---------- Automation simulation demo ---------- */
function renderSimState(){
  const room = ecsGetRoom(DEMO_ROOM_ID);
  const badge = document.getElementById('simStatusBadge');
  badge.innerHTML = room.occupied
    ? `<span class="pulse-dot" style="background:#5eead4"></span> Occupied`
    : `<span class="dot" style="background:#8fa0bc"></span> Empty`;
  document.getElementById('simLight').innerHTML = room.light ? '<span class="val on"><i data-lucide="lightbulb"></i>ON</span>' : '<span class="val off"><i data-lucide="lightbulb"></i>OFF</span>';
  document.getElementById('simFan').innerHTML = room.fan ? '<span class="val on"><i data-lucide="fan"></i>ON</span>' : '<span class="val off"><i data-lucide="fan"></i>OFF</span>';
  document.getElementById('occBtn').classList.toggle('active', room.occupied);
  document.getElementById('emptyBtn').classList.toggle('active', !room.occupied);
  ecsInitIcons();
}

function initAutomationDemo(){
  const occBtn = document.getElementById('occBtn');
  const emptyBtn = document.getElementById('emptyBtn');
  const execMsg = document.getElementById('execMsg');
  if(!occBtn) return;

  function fireRule(occupied){
    ecsSetOccupancy(DEMO_ROOM_ID, occupied);
    renderSimState();
    renderKPIs();
    renderRoomGrid();
    execMsg.classList.add('show');
    clearTimeout(execMsg._t);
    execMsg._t = setTimeout(()=> execMsg.classList.remove('show'), 2600);
    ecsToast('Automation rule executed successfully', 'success');
  }
  occBtn.addEventListener('click', () => fireRule(true));
  emptyBtn.addEventListener('click', () => fireRule(false));
  renderSimState();
}

/* ---------- Live believable drift every few seconds ---------- */
function startLiveTicker(){
  setInterval(() => {
    ecsGetRooms().forEach(room => {
      if(room.occupied){
        room.temperature = +ecsDrift(room.temperature, 0.3, 22, 34).toFixed(1);
        room.energyToday = +(room.energyToday + room.power/1000/600).toFixed(2);
      }
    });
    renderKPIs();
    renderRoomGrid();
    renderSensorFeed();
  }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  if(!document.getElementById('dashboardRoomGrid')) return;
  renderKPIs();
  renderRoomGrid();
  renderSensorFeed();
  renderChart('today');
  initChartControls();
  initAutomationDemo();
  startLiveTicker();
});
