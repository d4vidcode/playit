(() => {
  'use strict';

  /* ============================================================
     Constantes
     ============================================================ */

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CX = 260;
  const CY = 260;
  const R_SECTOR = 222;
  const R_TANGENTIAL = 150;
  const R_RADIAL = 141;
  const R_BULB = 239;
  const MIN_LABELS = 2;
  const MAX_LABELS = 24;
  const HISTORY_LIMIT = 20;

  const DEFAULT_LABELS = [
    'Pizza 🍕',
    'Cine 🎬',
    'Café ☕',
    'Sorpresa 🎁',
    'Nada 😅',
    'Helado 🍦',
    'Bonus ⭐',
    'Doble 🎉'
  ];

  const PALETTE = [
    '#ef476f', '#118ab2', '#ffd166', '#06d6a0',
    '#9b5de5', '#f4a261', '#00bbf9', '#e63946',
    '#2a9d8f', '#f15bb5', '#457b9d', '#ffb703'
  ];

  const KEYS = {
    labels: 'ruleta.labels.v2',
    history: 'ruleta.history.v2',
    prefs: 'ruleta.prefs.v2'
  };

  /* ============================================================
     Utilidades
     ============================================================ */

  const $ = (id) => document.getElementById(id);
  const mod = (n, m) => ((n % m) + m) % m;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const prefersReduced = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* almacenamiento no disponible: continuar sin persistir */
    }
  }

  function randomInt(n) {
    if (window.crypto && window.crypto.getRandomValues) {
      const limit = Math.floor(0xffffffff / n) * n;
      const buf = new Uint32Array(1);
      do {
        window.crypto.getRandomValues(buf);
      } while (buf[0] >= limit);
      return buf[0] % n;
    }
    return Math.floor(Math.random() * n);
  }

  function truncate(text, max) {
    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
  }

  /* ============================================================
     Referencias al DOM
     ============================================================ */

  const els = {
    wheel: $('wheel'),
    rotor: $('rotor'),
    bulbs: $('bulbs'),
    hub: $('hub'),
    spinBtn: $('spinBtn'),
    stopBtn: $('stopBtn'),
    applyBtn: $('applyBtn'),
    resetBtn: $('resetBtn'),
    labelsInput: $('labelsInput'),
    sectorCount: $('sectorCount'),
    resultCard: $('resultCard'),
    resultLabel: $('resultLabel'),
    resultMeta: $('resultMeta'),
    historyList: $('historyList'),
    clearHistory: $('clearHistory'),
    soundBtn: $('soundBtn'),
    themeBtn: $('themeBtn'),
    fullscreenBtn: $('fullscreenBtn'),
    toast: $('toast')
  };

  /* ============================================================
     Estado
     ============================================================ */

  const state = {
    labels: [],
    rotation: 0,
    spinning: false,
    stopRequested: false,
    winnerIndex: -1,
    soundOn: true,
    history: [],
    lastTickSector: null,
    lastTickAt: 0
  };

  let activeAnim = null;
  let rafId = 0;
  let audioCtx = null;
  let toastTimer = 0;
  let sectorEls = [];

  /* ============================================================
     Geometría y construcción de la ruleta
     ============================================================ */

  function polar(radius, angleDeg) {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)];
  }

  function sectorPath(start, end) {
    const [x1, y1] = polar(R_SECTOR, start);
    const [x2, y2] = polar(R_SECTOR, end);
    const largeArc = end - start > 180 ? 1 : 0;
    return [
      `M ${CX} ${CY}`,
      `L ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A ${R_SECTOR} ${R_SECTOR} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      'Z'
    ].join(' ');
  }

  function createLabel(text, mid, useRadial) {
    const group = document.createElementNS(SVG_NS, 'g');
    const node = document.createElementNS(SVG_NS, 'text');
    const flipped = mid > 90 && mid < 270;

    node.setAttribute('class', 'sector-label');
    node.setAttribute('text-anchor', 'middle');
    node.setAttribute('dominant-baseline', 'central');

    if (useRadial) {
      const display = truncate(text, 18);
      const fontSize = clamp(10, 17, 140 / Math.max(3, display.length * 0.58));
      node.textContent = display;
      group.setAttribute('transform', `rotate(${mid - 90} ${CX} ${CY})`);
      node.setAttribute('x', CX + R_RADIAL);
      node.setAttribute('y', CY);
      node.setAttribute('font-size', fontSize.toFixed(1));
      if (flipped) {
        node.setAttribute('transform', `rotate(180 ${CX + R_RADIAL} ${CY})`);
      }
    } else {
      const segRad = (360 / state.labels.length) * (Math.PI / 180);
      const chord = 2 * R_TANGENTIAL * Math.sin(segRad / 2);
      const maxChars = Math.max(3, Math.floor(chord / (9 * 0.8)));
      const display = truncate(text, Math.min(18, maxChars));
      const fontSize = clamp(9, 20, chord / Math.max(3, display.length * 0.8));
      node.textContent = display;
      group.setAttribute('transform', `rotate(${mid} ${CX} ${CY})`);
      node.setAttribute('x', CX);
      node.setAttribute('y', CY - R_TANGENTIAL);
      node.setAttribute('font-size', fontSize.toFixed(1));
      if (flipped) {
        node.setAttribute('transform', `rotate(180 ${CX} ${CY - R_TANGENTIAL})`);
      }
    }

    group.appendChild(node);
    return group;
  }

  function buildWheel() {
    const n = state.labels.length;
    const seg = 360 / n;
    const chord = 2 * R_TANGENTIAL * Math.sin((seg * Math.PI) / 360);
    const useRadial = n > 10 || chord < 76;

    els.rotor.replaceChildren();
    els.bulbs.replaceChildren();
    sectorEls = [];

    for (let i = 0; i < n; i += 1) {
      const start = i * seg;
      const mid = start + seg / 2;

      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', 'sector');
      path.setAttribute('d', sectorPath(start, start + seg));
      path.setAttribute('fill', PALETTE[i % PALETTE.length]);
      path.dataset.index = String(i);

      els.rotor.appendChild(path);
      sectorEls.push(path);
      els.rotor.appendChild(createLabel(state.labels[i], mid, useRadial));
    }

    for (let i = 0; i < n; i += 1) {
      const [x, y] = polar(R_BULB, i * seg + seg / 2);
      const bulb = document.createElementNS(SVG_NS, 'circle');
      bulb.setAttribute('class', 'bulb');
      bulb.setAttribute('cx', x.toFixed(2));
      bulb.setAttribute('cy', y.toFixed(2));
      bulb.setAttribute('r', '5.5');
      bulb.setAttribute('fill', i % 2 === 0 ? '#fff6d6' : '#ffca3a');
      bulb.style.animationDelay = `${((i % 7) * 0.17).toFixed(2)}s`;
      els.bulbs.appendChild(bulb);
    }

    renderRotation();
    updateCountBadge(n);
    updateControls();
  }

  function renderRotation() {
    els.rotor.setAttribute(
      'transform',
      `rotate(${state.rotation.toFixed(3)} ${CX} ${CY})`
    );
  }

  function sectorAtPointer() {
    const n = state.labels.length || 1;
    const seg = 360 / n;
    const local = mod(-state.rotation, 360);
    return Math.min(n - 1, Math.floor(local / seg));
  }

  function highlightWinner(index) {
    state.winnerIndex = index;
    sectorEls.forEach((el, i) => {
      el.classList.toggle('winner', i === index);
    });
  }

  /* ============================================================
     Animación
     ============================================================ */

  const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function animateTo(to, duration, ease, onEnd) {
    cancelAnimationFrame(rafId);
    activeAnim = {
      from: state.rotation,
      to,
      start: performance.now(),
      duration: Math.max(1, duration),
      ease,
      onEnd
    };
    rafId = requestAnimationFrame(step);
    return activeAnim;
  }

  function step(now) {
    if (!activeAnim) return;

    const { from, to, start, duration, ease, onEnd } = activeAnim;
    const t = clamp((now - start) / duration, 0, 1);

    state.rotation = from + (to - from) * ease(t);
    renderRotation();
    handleTick(now);

    if (t < 1) {
      rafId = requestAnimationFrame(step);
      return;
    }

    activeAnim = null;
    if (onEnd) onEnd();
  }

  function handleTick(now) {
    const index = sectorAtPointer();
    if (index === state.lastTickSector) return;
    state.lastTickSector = index;

    if (state.spinning && now - state.lastTickAt > 28) {
      state.lastTickAt = now;
      playTick();
    }
  }

  /* ============================================================
     Girar / detener
     ============================================================ */

  function spin() {
    if (state.spinning || state.labels.length < MIN_LABELS) return;

    state.spinning = true;
    state.stopRequested = false;
    state.lastTickSector = null;
    highlightWinner(-1);
    updateControls();

    if (state.soundOn) getAudioContext();

    const n = state.labels.length;
    const seg = 360 / n;
    const winner = randomInt(n);
    const jitter = (Math.random() - 0.5) * seg * 0.6;

    const targetMod = mod(360 - (winner + 0.5) * seg + jitter, 360);
    const currentMod = mod(state.rotation, 360);
    let delta = targetMod - currentMod;
    if (delta <= 0) delta += 360;

    const turns = 5 + randomInt(3);
    const to = state.rotation + turns * 360 + delta;
    const duration = prefersReduced() ? 800 : 5000;

    animateTo(to, duration, easeOutQuint, finishSpin);
  }

  function stop() {
    if (!state.spinning || state.stopRequested || !activeAnim) return;

    state.stopRequested = true;
    updateControls();

    const n = state.labels.length;
    const seg = 360 / n;
    const offset = 0.5 * seg;

    let target = state.rotation + 60 + Math.random() * seg * 1.4;
    const k = Math.round((target - offset) / seg);
    target = k * seg + offset;
    if (target < state.rotation + 10) target += seg;

    animateTo(
      target,
      650 + Math.random() * 250,
      easeOutCubic,
      finishSpin
    );
  }

  function finishSpin() {
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
      if (document.getElementById('labelsInput')) document.getElementById('labelsInput').value = state.labels.join('\n');
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
  }

  function updateControls() {
    const n = state.labels.length;
    const canSpin = n >= MIN_LABELS;

    els.spinBtn.hidden = state.spinning;
    els.stopBtn.hidden = !state.spinning;
    els.spinBtn.disabled = !canSpin;
    els.stopBtn.disabled = state.stopRequested;
    els.applyBtn.disabled = state.spinning;
    els.resetBtn.disabled = state.spinning;
    els.hub.setAttribute('aria-disabled', String(state.spinning));
    els.wheel.classList.toggle('is-spinning', state.spinning);
  }

  /* ============================================================
     Resultado e historial
     ============================================================ */

  function showResult(label, index) {
    els.resultLabel.textContent = label;
    els.resultMeta.textContent = `Sector ${index + 1} de ${state.labels.length} · ${(
      100 / state.labels.length
    ).toFixed(1).replace('.0', '')}% de probabilidad`;

    els.resultCard.classList.remove('idle');
    els.resultCard.classList.remove('pop');
    void els.resultCard.offsetWidth;
    els.resultCard.classList.add('pop');
  }

  function resetResult(message = 'Gira para empezar') {
    els.resultLabel.textContent = '¿Quién ganará?';
    els.resultMeta.textContent = message;
    els.resultCard.classList.add('idle');
  }

  function addHistory(label, index) {
    state.history.unshift({ label, index, t: Date.now() });
    state.history = state.history.slice(0, HISTORY_LIMIT);
    writeJSON(KEYS.history, state.history);
    renderHistory();
  }

  function renderHistory() {
    els.historyList.replaceChildren();

    if (!state.history.length) {
      const empty = document.createElement('li');
      empty.className = 'history-empty';
      empty.textContent = 'Todavía no hay giros. ¡Lanza la ruleta!';
      els.historyList.appendChild(empty);
      return;
    }

    for (const item of state.history) {
      const li = document.createElement('li');
      li.className = 'history-item';

      const num = document.createElement('span');
      num.className = 'hist-num';
      num.textContent = String(item.index + 1);
      num.style.background = PALETTE[item.index % PALETTE.length];

      const label = document.createElement('span');
      label.className = 'hist-label';
      label.textContent = item.label;

      const time = document.createElement('time');
      time.className = 'hist-time';
      const date = new Date(item.t);
      time.dateTime = date.toISOString();
      time.textContent = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      li.append(num, label, time);
      els.historyList.appendChild(li);
    }
  }

  /* ============================================================
     Editor de premios
     ============================================================ */

  function countPreview() {
    return els.labelsInput.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean).length;
  }

  function updateCountBadge(count = countPreview()) {
    els.sectorCount.textContent = String(count);
    els.sectorCount.classList.toggle(
      'invalid',
      count < MIN_LABELS || count > MAX_LABELS
    );
  }

  function applyLabels() {
    const labels = els.labelsInput.value
      .split('\n')
      .map((line) => line.trim().replace(/\s+/g, ' '))
      .filter(Boolean);

    if (labels.length < MIN_LABELS) {
      rejectLabels('Escribe al menos 2 premios');
      return;
    }

    if (labels.length > MAX_LABELS) {
      rejectLabels(`Máximo ${MAX_LABELS} premios`);
      return;
    }

    if (state.spinning) {
      toast('Espera a que la ruleta se detenga');
      return;
    }

    state.labels = labels;
    writeJSON(KEYS.labels, labels);

    els.labelsInput.value = labels.join('\n');
    highlightWinner(-1);
    buildWheel();
    resetResult(`${labels.length} premios listos`);
    toast('Ruleta actualizada');
  }

  function rejectLabels(message) {
    updateCountBadge();
    toast(message);

    els.labelsInput.classList.remove('shake');
    void els.labelsInput.offsetWidth;
    els.labelsInput.classList.add('shake');
    els.labelsInput.focus();
  }

  function resetLabels() {
    if (state.spinning) {
      toast('Espera a que la ruleta se detenga');
      return;
    }

    state.labels = DEFAULT_LABELS.slice();
    els.labelsInput.value = state.labels.join('\n');
    writeJSON(KEYS.labels, state.labels);
    highlightWinner(-1);
    buildWheel();
    resetResult(`${state.labels.length} premios listos`);
    toast('Premios restablecidos');
  }

  /* ============================================================
     Sonido (Web Audio API, sin archivos externos)
     ============================================================ */

  function getAudioContext() {
    if (!state.soundOn) return null;

    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch {
      return null;
    }
  }

  function playTick() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1150 + Math.random() * 260, t);
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  function playWin() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.085, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.44);
    });
  }

  function celebrate() {
    playWin();
    if (!prefersReduced()) confetti();
  }

  function confetti() {
    const count = 72;

    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement('i');
      piece.className = 'confetti';

      const sizeW = 6 + Math.random() * 7;
      const sizeH = 8 + Math.random() * 10;

      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.width = `${sizeW}px`;
      piece.style.height = `${sizeH}px`;
      piece.style.background = PALETTE[randomInt(PALETTE.length)];
      if (Math.random() > 0.7) piece.style.borderRadius = '50%';

      document.body.appendChild(piece);

      const drift = (Math.random() - 0.5) * 260;
      const spin = (Math.random() - 0.5) * 1080;
      const duration = 1700 + Math.random() * 1900;
      const delay = Math.random() * 250;

      const animation = piece.animate(
        [
          { transform: 'translate3d(0, -24px, 0) rotate(0deg)', opacity: 1 },
          {
            transform: `translate3d(${drift}px, 106vh, 0) rotate(${spin}deg)`,
            opacity: 0.85
          }
        ],
        {
          duration,
          delay,
          easing: 'cubic-bezier(0.18, 0.62, 0.35, 1)',
          fill: 'forwards'
        }
      );

      animation.onfinish = () => piece.remove();
    }
  }

  /* ============================================================
     Tema, sonido y pantalla completa
     ============================================================ */

  function savePrefs() {
    writeJSON(KEYS.prefs, {
      sound: state.soundOn,
      theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
    });
  }

  function setTheme(theme, persist = true) {
    const value = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = value;

    const icon = els.themeBtn.querySelector('.toggle-ico');
    if (icon) icon.textContent = value === 'dark' ? '🌙' : '☀️';
    els.themeBtn.setAttribute('aria-pressed', String(value === 'light'));
    els.themeBtn.setAttribute(
      'aria-label',
      value === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
    );

    if (persist) savePrefs();
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme;
    setTheme(current === 'light' ? 'dark' : 'light');
  }

  function updateSoundButton() {
    const icon = els.soundBtn.querySelector('.toggle-ico');
    if (icon) icon.textContent = state.soundOn ? '🔊' : '🔇';
    els.soundBtn.setAttribute('aria-pressed', String(state.soundOn));
    els.soundBtn.setAttribute(
      'aria-label',
      state.soundOn ? 'Silenciar sonido' : 'Activar sonido'
    );
  }

  function toggleSound() {
    state.soundOn = !state.soundOn;
    updateSoundButton();
    savePrefs();
    if (state.soundOn) playTick();
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast('Pantalla completa no disponible');
    }
  }

  /* ============================================================
     Toast
     ============================================================ */

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove('show');
    }, 2200);
  }

  /* ============================================================
     Eventos
     ============================================================ */

  els.spinBtn.addEventListener('click', spin);
  els.stopBtn.addEventListener('click', stop);
  els.applyBtn.addEventListener('click', applyLabels);
  els.resetBtn.addEventListener('click', resetLabels);
  els.clearHistory.addEventListener('click', () => {
    state.history = [];
    writeJSON(KEYS.history, state.history);
    renderHistory();
    toast('Historial borrado');
  });

  els.soundBtn.addEventListener('click', toggleSound);
  els.themeBtn.addEventListener('click', toggleTheme);
  els.fullscreenBtn.addEventListener('click', toggleFullscreen);

  els.labelsInput.addEventListener('input', () => updateCountBadge());
  els.labelsInput.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      applyLabels();
    }
  });

  els.hub.addEventListener('click', () => {
    if (state.spinning) stop();
    else spin();
  });

  els.hub.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (state.spinning) stop();
      else spin();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;

    const target = event.target;
    const tag = target && target.tagName ? target.tagName.toUpperCase() : '';
    if (
      ['TEXTAREA', 'INPUT', 'SELECT', 'BUTTON', 'A'].includes(tag) ||
      (target && target.isContentEditable)
    ) {
      return;
    }

    event.preventDefault();
    if (state.spinning) stop();
    else spin();
  });

  document.addEventListener('fullscreenchange', () => {
    const isFull = Boolean(document.fullscreenElement);
    els.fullscreenBtn.setAttribute('aria-pressed', String(isFull));
    const icon = els.fullscreenBtn.querySelector('.toggle-ico');
    if (icon) icon.textContent = isFull ? '⤢' : '⛶';
  });

  /* ============================================================
     Inicialización
     ============================================================ */

  function loadState() {
    const savedLabels = readJSON(KEYS.labels, null);
    if (
      Array.isArray(savedLabels) &&
      savedLabels.length >= MIN_LABELS &&
      savedLabels.length <= MAX_LABELS &&
      savedLabels.every((l) => typeof l === 'string' && l.trim())
    ) {
      state.labels = savedLabels.map((l) => l.trim());
    } else {
      state.labels = DEFAULT_LABELS.slice();
    }

    const savedHistory = readJSON(KEYS.history, null);
    if (Array.isArray(savedHistory)) {
      state.history = savedHistory
        .filter(
          (item) =>
            item &&
            typeof item.label === 'string' &&
            Number.isInteger(item.index) &&
            typeof item.t === 'number'
        )
        .slice(0, HISTORY_LIMIT);
    }

    const prefs = readJSON(KEYS.prefs, null);
    if (prefs && typeof prefs === 'object') {
      state.soundOn = prefs.sound !== false;
      setTheme(prefs.theme === 'light' ? 'light' : 'dark', false);
    } else {
      setTheme(
        window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark',
        false
      );
    }
  }

  function init() {
    loadState();

    els.labelsInput.value = state.labels.join('\n');
    updateSoundButton();
    updateCountBadge(state.labels.length);

    buildWheel();
    renderHistory();
    resetResult();
  }

  init();
})();
