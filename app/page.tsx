"use client";

import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/app.js";
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      try { document.body.removeChild(script); } catch {}
    };
  }, []);

  return (
    <>
      <div className="bg-orbs" aria-hidden="true"><span></span><span></span><span></span></div>

      <main className="app">
        <section className="stage" aria-label="Ruleta">
          <header className="stage-head">
            <h1>Ruleta de la <span>Fortuna</span></h1>
            <p className="sub">Edita los premios, gira y deja que el destino decida.</p>
          </header>

          <div className="wheel-wrap">
            <svg id="wheel" className="wheel" viewBox="0 0 520 520" role="img" aria-label="Ruleta de premios">
              <defs>
                <radialGradient id="plateGrad" cx="50%" cy="40%" r="65%"><stop offset="0%" stopColor="#1b2440" /><stop offset="100%" stopColor="#0a0f1e" /></radialGradient>
                <radialGradient id="glossGrad" cx="36%" cy="26%" r="72%"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" /><stop offset="55%" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
                <linearGradient id="rimGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe9a3" /><stop offset="0.42" stopColor="#f0b429" /><stop offset="1" stopColor="#8a5a10" /></linearGradient>
                <linearGradient id="hubGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff4c9" /><stop offset="0.5" stopColor="#ffca3a" /><stop offset="1" stopColor="#d98b1a" /></linearGradient>
                <filter id="wheelShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="20" stdDeviation="24" floodColor="#000" floodOpacity="0.55" /></filter>
                <filter id="pointerShadow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" /></filter>
              </defs>
              <circle className="rim-outer" cx="260" cy="260" r="250" fill="url(#rimGrad)" filter="url(#wheelShadow)" />
              <circle className="rim-lip" cx="260" cy="260" r="243" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="9" />
              <circle className="plate" cx="260" cy="260" r="228" fill="url(#plateGrad)" />
              <g id="bulbs" className="bulbs" aria-hidden="true"></g>
              <circle className="plate-ring" cx="260" cy="260" r="224" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
              <g id="rotor" className="rotor"></g>
              <circle className="gloss" cx="260" cy="260" r="222" fill="url(#glossGrad)" pointerEvents="none" />
              <g id="hub" className="hub" role="button" tabIndex={0} aria-label="Girar la ruleta">
                <circle cx="260" cy="260" r="68" fill="rgba(0,0,0,0.5)" />
                <circle className="hub-ring" cx="260" cy="260" r="62" fill="url(#hubGrad)" />
                <circle className="hub-core" cx="260" cy="260" r="52" fill="#0b1122" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
                <text className="hub-text" x="260" y="260" textAnchor="middle" dominantBaseline="central">GIRAR</text>
              </g>
              <g className="pointer" aria-hidden="true"><path d="M260 48 L238 12 L282 12 Z" /></g>
            </svg>
          </div>

          <div className="controls">
            <button id="spinBtn" className="btn btn-primary btn-lg" type="button">Girar ruleta</button>
            <button id="stopBtn" className="btn btn-ghost btn-lg" type="button" hidden>Detener</button>
          </div>
          <p className="hint">Pulsa <kbd>Espacio</kbd> para girar o detener</p>
        </section>

        <aside className="panel" aria-label="Controles y resultados">
          <section id="resultCard" className="card result-card idle" aria-live="polite">
            <h2 className="card-title">Resultado</h2>
            <p id="resultLabel" className="result-label">¿Quién ganará?</p>
            <p id="resultMeta" className="result-meta">Gira para empezar</p>
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Premios</h2>
              <span id="sectorCount" className="badge">8</span>
            </div>
            <label className="sr-only" htmlFor="labelsInput">Premios, uno por línea</label>
            <textarea id="labelsInput" rows={8} spellCheck={false} placeholder="Un premio por línea..."></textarea>
            <div className="row">
              <button id="applyBtn" className="btn btn-primary btn-sm" type="button">Aplicar</button>
              <button id="resetBtn" className="btn btn-ghost btn-sm" type="button">Restablecer</button>
            </div>
            <p className="field-hint">Un premio por línea (2–24). <span className="kbd-hint"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> para aplicar</span></p>
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Historial</h2>
              <button id="clearHistory" className="link-btn" type="button">Limpiar</button>
            </div>
            <ol id="historyList" className="history"></ol>
          </section>

          <section className="card">
            <div className="card-head"><h2 className="card-title">Ajustes</h2></div>
            <div className="settings-row">
              <button id="soundBtn" className="toggle" type="button" aria-pressed="true"><span className="toggle-ico">🔊</span> Sonido</button>
              <button id="themeBtn" className="toggle" type="button" aria-pressed="false"><span className="toggle-ico">🌙</span> Tema</button>
              <button id="fullscreenBtn" className="toggle" type="button" aria-pressed="false"><span className="toggle-ico">⛶</span> Pantalla</button>
            </div>
          </section>
        </aside>
      </main>

      <div id="toast" className="toast" role="status" aria-live="polite"></div>
      <noscript><p className="noscript">Activa JavaScript para poder usar la ruleta.</p></noscript>
    </>
  );
}
