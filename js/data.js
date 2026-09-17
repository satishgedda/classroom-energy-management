/* =========================================================
   ECS — Simulated data layer
   In production this module is swapped for REST/MQTT calls
   to the ESP32 gateway; every other file only talks to the
   functions below, never to raw arrays directly.
   ========================================================= */

const ECS_VOLTAGE = 230; // assumed line voltage for simulated power calc

const ROOM_SEED = [
  { id:'A101', name:'A-101', dept:'Computer Science', building:'Block A', floor:'Ground Floor', baseTemp:27.8, baseCurrent:1.82, occupied:true,  light:true,  fan:true,  projector:true,  ac:false },
  { id:'A102', name:'A-102', dept:'Computer Science', building:'Block A', floor:'Ground Floor', baseTemp:25.1, baseCurrent:0.12, occupied:false, light:false, fan:false, projector:false, ac:false },
  { id:'A103', name:'A-103', dept:'Electronics',      building:'Block A', floor:'First Floor',  baseTemp:29.4, baseCurrent:2.35, occupied:true,  light:true,  fan:true,  projector:false, ac:true  },
  { id:'A104', name:'A-104', dept:'Electronics',      building:'Block A', floor:'First Floor',  baseTemp:26.3, baseCurrent:0.08, occupied:false, light:true,  fan:false, projector:false, ac:false },
  { id:'B201', name:'B-201', dept:'Mechanical',       building:'Block B', floor:'Second Floor', baseTemp:28.6, baseCurrent:1.64, occupied:true,  light:true,  fan:true,  projector:true,  ac:false },
  { id:'B202', name:'B-202', dept:'Mechanical',       building:'Block B', floor:'Second Floor', baseTemp:24.9, baseCurrent:0.05, occupied:false, light:false, fan:false, projector:false, ac:false },
  { id:'B203', name:'B-203', dept:'Civil',            building:'Block B', floor:'Third Floor',  baseTemp:30.8, baseCurrent:2.61, occupied:true,  light:true,  fan:true,  projector:false, ac:true  },
  { id:'B204', name:'B-204', dept:'Civil',            building:'Block B', floor:'Third Floor',  baseTemp:27.2, baseCurrent:1.41, occupied:true,  light:true,  fan:true,  projector:false, ac:false },
  { id:'C301', name:'C-301', dept:'Design Studio',    building:'Block C', floor:'Ground Floor', baseTemp:26.5, baseCurrent:0.98, occupied:true,  light:true,  fan:true,  projector:true,  ac:false },
  { id:'C302', name:'C-302', dept:'Design Studio',    building:'Block C', floor:'Ground Floor', baseTemp:25.4, baseCurrent:0.10, occupied:false, light:false, fan:false, projector:false, ac:false },
  { id:'C303', name:'C-303', dept:'Applied Sciences', building:'Block C', floor:'First Floor',  baseTemp:29.9, baseCurrent:2.02, occupied:true,  light:true,  fan:true,  projector:false, ac:true  },
  { id:'C304', name:'C-304', dept:'Applied Sciences', building:'Block C', floor:'First Floor',  baseTemp:25.8, baseCurrent:0.07, occupied:false, light:false, fan:false, projector:false, ac:false },
];

function buildRoom(seed){
  const appliancePower = { light:120, fan:75, projector:220, ac:1100 };
  let power = ECS_VOLTAGE * seed.baseCurrent;
  return {
    ...seed,
    temperature: seed.baseTemp,
    humidity: 52 + Math.round(Math.random()*18),
    lightLevel: seed.occupied ? 30 + Math.round(Math.random()*20) : 8 + Math.round(Math.random()*10),
    current: seed.baseCurrent,
    power: Math.round(power),
    energyToday: +(power/1000 * (6 + Math.random()*3)).toFixed(2),
    appliancePower,
  };
}

const ECS_STATE = {
  rooms: ROOM_SEED.map(buildRoom),
  costPerUnit: parseFloat(localStorage.getItem('ecs_costPerUnit')) || 8.50,
};

function ecsGetRooms(){ return ECS_STATE.rooms; }
function ecsGetRoom(id){ return ECS_STATE.rooms.find(r => r.id === id); }

function ecsRoomStatusLabel(room){ return room.occupied ? 'Occupied' : 'Empty'; }

function ecsTotalEnergyToday(){
  return ECS_STATE.rooms.reduce((s,r)=> s + r.energyToday, 0);
}
function ecsTotalPowerNow(){
  return ECS_STATE.rooms.reduce((s,r)=> s + r.power, 0);
}
function ecsOccupiedCount(){
  return ECS_STATE.rooms.filter(r=>r.occupied).length;
}
function ecsEstimatedCostToday(){
  return ecsTotalEnergyToday() * ECS_STATE.costPerUnit;
}

/* Recalculate a room's power draw from its current appliance states */
function ecsRecalcRoom(room){
  let watts = 0;
  if(room.light) watts += room.appliancePower.light;
  if(room.fan) watts += room.appliancePower.fan;
  if(room.projector) watts += room.appliancePower.projector;
  if(room.ac) watts += room.appliancePower.ac;
  // small baseline draw for standby electronics
  watts += room.occupied ? 18 : 4;
  room.power = watts;
  room.current = +(watts / ECS_VOLTAGE).toFixed(2);
  return room;
}

function ecsSetOccupancy(roomId, occupied){
  const room = ecsGetRoom(roomId);
  if(!room) return;
  room.occupied = occupied;
  if(occupied){
    room.light = true; room.fan = true;
    room.lightLevel = 32 + Math.round(Math.random()*15);
  } else {
    room.light = false; room.fan = false;
    room.lightLevel = 6 + Math.round(Math.random()*8);
  }
  ecsRecalcRoom(room);
}

function ecsToggleAppliance(roomId, key){
  const room = ecsGetRoom(roomId);
  if(!room) return null;
  room[key] = !room[key];
  ecsRecalcRoom(room);
  return room;
}

/* Sensor snapshot for a given room, used on dashboard + details page */
function ecsSensorSnapshot(room){
  return [
    { key:'pir', name:'PIR Motion Sensor', value: room.occupied ? 'Motion Detected' : 'No Motion', status: room.occupied ? 'Active' : 'Idle', icon:'motion' },
    { key:'ldr', name:'LDR Light Sensor', value: room.lightLevel + '%', status:'Reading', icon:'sun' },
    { key:'dht-t', name:'DHT11 Temperature', value: room.temperature.toFixed(1) + '°C', status:'Reading', icon:'thermometer' },
    { key:'dht-h', name:'Humidity', value: room.humidity + '%', status:'Reading', icon:'droplet' },
    { key:'current', name:'Current Sensor (ACS712)', value: room.current.toFixed(2) + ' A', status:'Reading', icon:'zap' },
  ];
}

/* Small believable drift used by the live-update ticker */
function ecsDrift(value, magnitude, min, max){
  let next = value + (Math.random()-0.5) * magnitude;
  if(min !== undefined) next = Math.max(min, next);
  if(max !== undefined) next = Math.min(max, next);
  return next;
}

/* ---------- Alerts (persisted to localStorage so state survives navigation) ---------- */
const ECS_ALERT_SEED = [
  { id:'al1', sev:'critical', title:'High Temperature', room:'A-103', desc:'A-103 reached 32°C, above the configured 30°C threshold.', time:'8 min ago', read:false },
  { id:'al2', sev:'warning',  title:'High Energy Usage', room:'B-204', desc:'B-204 consumed 24% more energy than its hourly average.', time:'26 min ago', read:false },
  { id:'al3', sev:'warning',  title:'Light Left On', room:'C-302', desc:'C-302 has been drawing lighting power despite low occupancy for 40 minutes.', time:'1 hr ago', read:false },
  { id:'al4', sev:'info',     title:'System Information', room:'System', desc:'Energy optimization rule executed successfully across Block B.', time:'2 hr ago', read:true },
  { id:'al5', sev:'critical', title:'High Temperature', room:'C-303', desc:'C-303 reached 31.5°C during peak occupancy hours.', time:'3 hr ago', read:true },
  { id:'al6', sev:'info',     title:'System Information', room:'System', desc:'Scheduled auto-shutdown completed for 6 empty classrooms overnight.', time:'Yesterday', read:true },
];

function ecsGetAlerts(){
  const raw = localStorage.getItem('ecs_alerts');
  if(raw) return JSON.parse(raw);
  localStorage.setItem('ecs_alerts', JSON.stringify(ECS_ALERT_SEED));
  return ECS_ALERT_SEED;
}
function ecsSaveAlerts(list){ localStorage.setItem('ecs_alerts', JSON.stringify(list)); }

/* ---------- Settings ---------- */
const ECS_SETTINGS_DEFAULT = {
  autoLight:true, autoFan:true, autoShutdown:true,
  tempThreshold:30, lightThreshold:40,
  costPerUnit:8.50,
  alertHighEnergy:true, alertTemp:true,
  simulationMode:true,
};
function ecsGetSettings(){
  const raw = localStorage.getItem('ecs_settings');
  return raw ? { ...ECS_SETTINGS_DEFAULT, ...JSON.parse(raw) } : { ...ECS_SETTINGS_DEFAULT };
}
function ecsSaveSettings(s){ localStorage.setItem('ecs_settings', JSON.stringify(s)); }
