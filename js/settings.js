/* =========================================================
   ECS — Settings page
   ========================================================= */

function loadSettingsIntoForm(){
  const s = ecsGetSettings();
  document.getElementById('autoLight').checked = s.autoLight;
  document.getElementById('autoFan').checked = s.autoFan;
  document.getElementById('autoShutdown').checked = s.autoShutdown;
  document.getElementById('tempThreshold').value = s.tempThreshold;
  document.getElementById('lightThreshold').value = s.lightThreshold;
  document.getElementById('costPerUnit').value = s.costPerUnit;
  document.getElementById('alertHighEnergy').checked = s.alertHighEnergy;
  document.getElementById('alertTemp').checked = s.alertTemp;
  document.getElementById('simulationMode').checked = s.simulationMode;
}

function initSettingsNav(){
  const buttons = document.querySelectorAll('.settings-nav button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.settings-section').forEach(sec => sec.style.display = 'none');
      document.getElementById(btn.dataset.target).style.display = 'block';
    });
  });
}

function initSaveButton(){
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const s = {
      autoLight: document.getElementById('autoLight').checked,
      autoFan: document.getElementById('autoFan').checked,
      autoShutdown: document.getElementById('autoShutdown').checked,
      tempThreshold: parseFloat(document.getElementById('tempThreshold').value) || 30,
      lightThreshold: parseFloat(document.getElementById('lightThreshold').value) || 40,
      costPerUnit: parseFloat(document.getElementById('costPerUnit').value) || 8.5,
      alertHighEnergy: document.getElementById('alertHighEnergy').checked,
      alertTemp: document.getElementById('alertTemp').checked,
      simulationMode: document.getElementById('simulationMode').checked,
    };
    ecsSaveSettings(s);
    localStorage.setItem('ecs_costPerUnit', s.costPerUnit);
    ecsToast('Settings saved successfully', 'success');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if(!document.getElementById('saveSettingsBtn')) return;
  loadSettingsIntoForm();
  initSettingsNav();
  initSaveButton();
});
