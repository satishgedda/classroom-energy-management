/* =========================================================
   ECS — Energy Analytics page
   ========================================================= */

function renderAnalyticsKPIs(){
  document.getElementById('anaToday').textContent = ecsTotalEnergyToday().toFixed(1) + ' kWh';
  document.getElementById('anaWeek').textContent = '324.8 kWh';
  document.getElementById('anaMonth').textContent = '1,284 kWh';
  document.getElementById('anaSaved').textContent = '18.4%';
}

function chartDefaults(color){
  return {
    borderColor:color, borderWidth:2.5, tension:.4, pointRadius:0, pointHoverRadius:5,
    backgroundColor:(c)=>{
      const g = c.chart.ctx.createLinearGradient(0,0,0,220);
      g.addColorStop(0, color+'33'); g.addColorStop(1, color+'00');
      return g;
    }, fill:true,
  };
}

function baseOptions(unit){
  return {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#0d1a2e', padding:10, cornerRadius:8, displayColors:false,
      callbacks:{ label:(c)=> `${c.parsed.y.toFixed(1)} ${unit}` } } },
    scales:{ x:{ grid:{display:false}, ticks:{color:'#8b96a8', font:{size:10.5}} },
      y:{ grid:{color:'#eef1f6'}, ticks:{color:'#8b96a8', font:{size:10.5}} } }
  };
}

function renderAnalyticsCharts(){
  new Chart(document.getElementById('dailyChart'), {
    type:'bar',
    data:{ labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets:[{ data:[42,46,51,48,55,38,31], backgroundColor:'#0ea5e9', borderRadius:6, maxBarThickness:34 }] },
    options: baseOptions('kWh')
  });

  new Chart(document.getElementById('weeklyChart'), {
    type:'line',
    data:{ labels:['W1','W2','W3','W4'],
      datasets:[{ data:[298,312,289,324.8], ...chartDefaults('#0d1a2e') }] },
    options: baseOptions('kWh')
  });

  new Chart(document.getElementById('classroomChart'), {
    type:'bar',
    data:{ labels: ecsGetRooms().map(r=>r.name),
      datasets:[{ data: ecsGetRooms().map(r=>r.energyToday), backgroundColor:'#22d3ee', borderRadius:5, maxBarThickness:22 }] },
    options:{ ...baseOptions('kWh'), indexAxis:'y' }
  });

  new Chart(document.getElementById('applianceChart'), {
    type:'doughnut',
    data:{ labels:['Lights','Fans','Projectors','AC'],
      datasets:[{ data:[22,14,10,54], backgroundColor:['#0ea5e9','#16a34a','#d97706','#122544'], borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%',
      plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, font:{size:11.5} } } } }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if(!document.getElementById('dailyChart')) return;
  renderAnalyticsKPIs();
  renderAnalyticsCharts();
});
