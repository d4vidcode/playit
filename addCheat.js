const fs = require('fs');
const script = fs.readFileSync('C:/Users/osinf25/Downloads/ruleta-next/public/app.js','utf8');

// Añadir modal
const modal = `
  <div id="cheatModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.75);display:none;align-items:center;justify-content:center;z-index:3000;padding:16px">
    <div style="background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:18px;max-width:400px;width:100%;max-height:80vh;overflow-y:auto;backdrop-filter:blur(16px)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <h3 style="margin:0">Trucar ruleta</h3>
        <button id="cheatClose" class="link-btn">Cerrar</button>
      </div>
      <p style="color:var(--muted);font-size:0.875rem;margin:0 0 16px">Selecciona el premio que quieres que salga en el siguiente giro. Solo se aplica una vez.</p>
      <div id="cheatList" style="display:flex;flex-direction:column;gap:6px"></div>
    </div>
  </div>
`;
if (!script.includes('cheatModal')) {
  let s = script.replace('</body>', modal + '\n</body>');
  
  // añadir estado
  if (!s.includes('cheatIndex')) {
    s = s.replace('  const state = {\n    labels: [],', '  const state = {\n    labels: [],\n    cheatIndex: null,');
  }
  
  // clicks en título
  const initOld = `  function init() {\n    loadState();`;
  const initNew = `  let tclicks=0,ttimer=null;\n  const th=document.querySelector('.stage-head h1');\n  if(th){th.style.cursor='pointer';th.addEventListener('click',()=>{clearTimeout(ttimer);tclicks++;ttimer=setTimeout(()=>{tclicks=0},2000);if(tclicks>=5&&state.labels.length>=2){tclicks=0;openCheat();}});}\n  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='t'){e.preventDefault();if(state.labels.length>=2)openCheat();}});\n  function openCheat(){const m=document.getElementById('cheatModal');const l=document.getElementById('cheatList');l.innerHTML='';state.labels.forEach((x,i)=>{const b=document.createElement('button');b.className='btn btn-ghost';b.style.cssText='width:100%;justify-content:flex-start';b.textContent=x;b.onclick=()=>{state.cheatIndex=i;m.style.display='none';toast('Siguiente giro forzado: '+x);};l.appendChild(b);});m.style.display='flex';}\n  document.getElementById('cheatClose').onclick=()=>document.getElementById('cheatModal').style.display='none';\n  function init() {\n    loadState();`;
  s = s.replace(initOld, initNew);
  
  // usar en spin
  const spinOld = `    const n = state.labels.length;\n    const seg = 360 / n;\n    const winner = randomInt(n);`;
  const spinNew = `    const n = state.labels.length;\n    const seg = 360 / n;\n    let winner = randomInt(n);\n    if(state.cheatIndex!==null&&state.cheatIndex>=0&&state.cheatIndex<n){winner=state.cheatIndex;}`;
  s = s.replace(spinOld, spinNew);
  
  // limpiar
  const finOld = `    highlightWinner(index);\n    showResult(label, index);\n    addHistory(label, index);\n    \n    const chk = document.getElementById('removeWinnerChk');`;
  const finNew = `    highlightWinner(index);\n    showResult(label, index);\n    addHistory(label, index);\n    if(state.cheatIndex!==null) state.cheatIndex=null;\n    \n    const chk = document.getElementById('removeWinnerChk');`;
  s = s.replace(finOld, finNew);
  
  fs.writeFileSync('C:/Users/osinf25/Downloads/ruleta-next/public/app.js', s);
  console.log('done');
} else console.log('exists');
