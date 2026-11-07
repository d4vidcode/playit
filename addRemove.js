const fs = require('fs');
const script = fs.readFileSync('C:/Users/osinf25/Downloads/ruleta-next/public/app.js','utf8');

// Añadir checkbox en ajustes
const old = `<section class="card">
        <div class="card-head">
          <h2 class="card-title">Ajustes</h2>
        </div>
        <div class="settings-row">
          <button id="soundBtn" class="toggle" type="button" aria-pressed="true">
            <span class="toggle-ico">🔊</span> Sonido
          </button>
          <button id="themeBtn" class="toggle" type="button" aria-pressed="false">
            <span class="toggle-ico">🌙</span> Tema
          </button>
          <button id="fullscreenBtn" class="toggle" type="button" aria-pressed="false">
            <span class="toggle-ico">⛶</span> Pantalla
          </button>
        </div>
      </section>`;
const neu = `<section class="card">
        <div class="card-head">
          <h2 class="card-title">Ajustes</h2>
        </div>
        <div class="settings-row">
          <button id="soundBtn" class="toggle" type="button" aria-pressed="true">
            <span class="toggle-ico">🔊</span> Sonido
          </button>
          <button id="themeBtn" class="toggle" type="button" aria-pressed="false">
            <span class="toggle-ico">🌙</span> Tema
          </button>
          <button id="fullscreenBtn" class="toggle" type="button" aria-pressed="false">
            <span class="toggle-ico">⛶</span> Pantalla
          </button>
        </div>
        <div style="margin-top:12px">
          <label style="display:flex;align-items:center;gap:8px;font-size:0.875rem;cursor:pointer">
            <input type="checkbox" id="removeWinnerChk"> Eliminar ganador tras giro
          </label>
        </div>
      </section>`;
let s = script.replace(old, neu);

// Añadir lógica en finishSpin
const oldf = `  function finishSpin() {
    state.spinning = false;
    state.stopRequested = false;
    state.lastTickSector = null;

    const index = sectorAtPointer();
    const label = state.labels[index] ?? '—';

    highlightWinner(index);
    showResult(label, index);
    addHistory(label, index);
    updateControls();
    celebrate();
  }`;
const newf = `  function finishSpin() {
    state.spinning = false;
    state.stopRequested = false;
    state.lastTickSector = null;

    const index = sectorAtPointer();
    const label = state.labels[index] ?? '—';

    highlightWinner(index);
    showResult(label, index);
    addHistory(label, index);
    
    const chk = document.getElementById('removeWinnerChk');
    if (chk && chk.checked && state.labels.length > 2) {
      state.labels.splice(index, 1);
      try { localStorage.setItem('ruleta.labels.v2', JSON.stringify(state.labels)); } catch(e){}
      if (document.getElementById('labelsInput')) document.getElementById('labelsInput').value = state.labels.join('\\n');
      highlightWinner(-1);
      buildWheel();
      const res = document.getElementById('resultLabel');
      const met = document.getElementById('resultMeta');
      if (res) res.textContent = '¿Quién ganará?';
      if (met) met.textContent = state.labels.length + ' premios listos';
      if (document.getElementById('resultCard')) document.getElementById('resultCard').classList.add('idle');
      const cnt = document.getElementById('sectorCount');
      if (cnt) { cnt.textContent = state.labels.length; cnt.classList.toggle('invalid', state.labels.length < 2 || state.labels.length > 24); }
      if (state.labels.length <= 1) { chk.checked = false; chk.disabled = true; }
      const t = document.getElementById('toast');
      if (t) { t.textContent = 'Ganador eliminado'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
    }
    
    updateControls();
    celebrate();
  }`;
s = s.replace(oldf, newf);
fs.writeFileSync('C:/Users/osinf25/Downloads/ruleta-next/public/app.js', s);
console.log('done');
