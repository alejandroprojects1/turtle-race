// Turtle Race — parte 2: pista, controle do kart e motor.
const Game = (() => {
  const $ = (id) => document.getElementById(id);
  const screen = $('game-screen');
  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d');
  const hud = {
    lap: $('hud-lap'), bar: $('hud-bar-fill'), kart: $('hud-bar-kart'),
    count: $('countdown'), banner: $('banner'), hint: $('hint'), pause: $('pause-overlay'),
  };

  const sprite = new Image();
  sprite.src = 'assets/turtle-kart.png';
  const SPRITE_RATIO = 498 / 720;

  // ---------- Configuração (em "unidades de pista") ----------
  const LANES = 3;
  const LAP_LEN = 6000;          // comprimento de uma volta
  const BASE_SPEED = 380;        // velocidade da 1ª volta (unidades/s)
  const SPEED_PER_LAP = 0.08;    // cada volta fica 8% mais rápida
  const MAX_SPEED = 760;

  // ---------- Medidas da tela ----------
  let W = 0, H = 0, dpr = 1, s = 1, L = 80, portrait = false;
  let roadTop = 0, roadBottom = 0, horizon = 0, kartW = 0, kartH = 0, kartX = 0;

  // ---------- Estado ----------
  const st = {
    mode: 'idle',               // idle | countdown | running | paused
    prevMode: 'running',
    dist: 0, speed: 0, lap: 1,
    lane: 1, laneF: 1,
    t: 0, countT: 0, countN: 3,
    particles: [], streaks: [],
  };
  let raf = 0, last = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    portrait = H > W;
    s = portrait ? W / 800 : Math.min(W / 800, H / 450);
    L = portrait ? 115 : 80;
    roadBottom = portrait ? H * 0.86 : H - 24 * s;
    roadTop = roadBottom - LANES * L * s;
    horizon = roadTop - 30 * s;
    kartW = 2.0 * L * s;
    kartH = kartW * SPRITE_RATIO;
    kartX = Math.max(14, W * 0.045);
    if (st.mode !== 'idle') draw();
  }

  // Número pseudoaleatório fixo para cada índice (cenário sempre igual)
  function rnd(i, salt = 0) {
    const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  const laneBase = (lf) => roadTop + (lf + 1) * L * s - 0.14 * L * s;   // linha das rodas
  const laneScale = (lf) => 0.88 + 0.06 * lf;                           // faixa de cima = mais longe

  // ---------- Cenário: praia ao pôr do sol ----------
  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, '#1a0b3d');
    g.addColorStop(0.45, '#6a1b6e');
    g.addColorStop(0.8, '#ff5e7e');
    g.addColorStop(1, '#ffb36b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizon);

    // estrelas
    for (let i = 0; i < 40; i++) {
      const x = rnd(i, 1) * W, y = rnd(i, 2) * horizon * 0.55;
      const a = 0.25 + 0.5 * Math.abs(Math.sin(st.t * (0.6 + rnd(i, 3)) + i));
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x, y, 1.6, 1.6);
    }

    // sol listrado
    const seaTop = horizon - 26 * s;
    const r = 62 * s, cx = W * 0.7, cy = seaTop - r * 0.25;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, seaTop); ctx.clip();
    const sg = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    sg.addColorStop(0, '#fff3a6'); sg.addColorStop(0.5, '#ffb347'); sg.addColorStop(1, '#ff4d7a');
    ctx.shadowColor = 'rgba(255,150,90,.9)'; ctx.shadowBlur = 40 * s;
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#b8366f';
    for (let i = 0; i < 5; i++) {
      const y = cy + r * (0.12 + i * 0.17), h = (1.5 + i * 1.1) * s;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(cx - r, y, r * 2, h);
    }
    ctx.restore();

    // ilhas ao longe
    const off = st.dist * s * 0.04;
    ctx.fillStyle = '#4a1a5e';
    ctx.beginPath(); ctx.moveTo(0, seaTop);
    for (let x = 0; x <= W; x += 8) {
      const wx = (x + off) / s;
      const y = Math.max(0, Math.sin(wx * 0.011) * 14 + Math.sin(wx * 0.027 + 2) * 7 - 4);
      ctx.lineTo(x, seaTop - y * s);
    }
    ctx.lineTo(W, seaTop); ctx.closePath(); ctx.fill();

    // mar
    const mg = ctx.createLinearGradient(0, seaTop, 0, horizon);
    mg.addColorStop(0, '#ff7a8a'); mg.addColorStop(1, '#3b1d7a');
    ctx.fillStyle = mg; ctx.fillRect(0, seaTop, W, horizon - seaTop);
    ctx.fillStyle = 'rgba(255,230,170,.7)';
    for (let i = 0; i < 6; i++) {
      const y = seaTop + (i + 0.5) * (horizon - seaTop) / 6;
      const w = (20 + i * 22) * s * (0.8 + 0.2 * Math.sin(st.t * 2 + i));
      ctx.fillRect(cx - w / 2, y, w, 1.5 * s);
    }
  }

  function drawPalm(x, base, h, lean) {
    ctx.strokeStyle = '#1b0b2e'; ctx.fillStyle = '#1b0b2e';
    ctx.lineCap = 'round';
    const tx = x + lean * h * 0.25, ty = base - h;
    ctx.lineWidth = Math.max(2, h * 0.055);
    ctx.beginPath(); ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x + lean * h * 0.05, base - h * 0.55, tx, ty); ctx.stroke();
    const sway = Math.sin(st.t * 1.5 + x * 0.01) * 0.06;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI + (i / 6) * Math.PI + sway;
      const len = h * (0.42 + 0.08 * Math.sin(i * 2.1));
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + len * 0.3;
      const mx = tx + Math.cos(a) * len * 0.55, my = ty + Math.sin(a) * len * 0.6 - len * 0.12;
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.quadraticCurveTo(mx, my + len * 0.2, tx, ty);
      ctx.fill();
    }
  }

  function drawShore() {
    // areia
    const g = ctx.createLinearGradient(0, horizon, 0, roadTop);
    g.addColorStop(0, '#7a3b6a'); g.addColorStop(1, '#3d1f4f');
    ctx.fillStyle = g; ctx.fillRect(0, horizon, W, roadTop - horizon);

    // coqueiros (duas camadas de profundidade)
    [[0.22, 300, 0.75, 5], [0.45, 420, 1, 9]].forEach(([par, spacing, size, salt]) => {
      const off = st.dist * s * par, sp = spacing * s;
      const first = Math.floor(off / sp) - 1, n = Math.ceil(W / sp) + 3;
      for (let k = 0; k < n; k++) {
        const i = first + k;
        if (rnd(i, salt) < 0.25) continue;
        const x = i * sp - off + rnd(i, salt + 1) * sp * 0.6;
        const h = (95 + rnd(i, salt + 2) * 45) * s * size;
        drawPalm(x, horizon + (8 + 10 * size) * s, h, rnd(i, salt + 3) - 0.5);
      }
    });
  }

  function drawKerb(y, h) {
    const blk = 44 * s, off = (st.dist * s) % (blk * 2);
    for (let x = -off; x < W; x += blk * 2) {
      ctx.fillStyle = '#ff3b4a'; ctx.fillRect(x, y, blk, h);
      ctx.fillStyle = '#f4f6ff'; ctx.fillRect(x + blk, y, blk, h);
    }
  }

  function drawRoad() {
    const g = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
    g.addColorStop(0, '#2a2342'); g.addColorStop(1, '#1b172e');
    ctx.fillStyle = g; ctx.fillRect(0, roadTop, W, roadBottom - roadTop);

    const kh = 9 * s;
    drawKerb(roadTop - kh, kh);
    drawKerb(roadBottom, kh);

    // faixas tracejadas
    const dash = 54 * s, gap = 42 * s, off = (st.dist * s) % (dash + gap);
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    for (let i = 1; i < LANES; i++) {
      const y = roadTop + i * L * s - 2 * s;
      for (let x = -off; x < W; x += dash + gap) ctx.fillRect(x, y, dash, 4 * s);
    }

    // riscos de velocidade no asfalto
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    st.streaks.forEach((k) => ctx.fillRect(k.x, roadTop + k.y * (roadBottom - roadTop), k.len * s, 2 * s));

    // linha de chegada / largada a cada volta
    const lineW = 46 * s;
    const frontX = kartX + kartW;
    for (let k = Math.floor(st.dist / LAP_LEN); k <= Math.floor(st.dist / LAP_LEN) + 1; k++) {
      const x = frontX + (k * LAP_LEN - st.dist) * s;
      if (x < -lineW || x > W) continue;
      const sq = lineW / 3, rows = Math.ceil((roadBottom - roadTop) / sq);
      for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) {
        ctx.fillStyle = (r + c) % 2 ? '#15172a' : '#f4f6ff';
        ctx.fillRect(x + c * sq, roadTop + r * sq, sq + 0.5, Math.min(sq + 0.5, roadBottom - roadTop - r * sq));
      }
    }
  }

  function drawForeground() {
    const top = roadBottom + 9 * s;
    if (top >= H) return;
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, '#2b1640'); g.addColorStop(1, '#0d0818');
    ctx.fillStyle = g; ctx.fillRect(0, top, W, H - top);
    // luzes rápidas na beira da pista
    const sp = 260 * s, off = (st.dist * s * 1.35) % sp;
    for (let x = -off; x < W + sp; x += sp) {
      const lg = ctx.createLinearGradient(x, 0, x + 90 * s, 0);
      lg.addColorStop(0, 'rgba(76,201,255,0)'); lg.addColorStop(0.5, 'rgba(76,201,255,.55)'); lg.addColorStop(1, 'rgba(76,201,255,0)');
      ctx.fillStyle = lg; ctx.fillRect(x, top + 8 * s, 90 * s, 3 * s);
    }
  }

  // ---------- Kart ----------
  function drawKart() {
    const sc = laneScale(st.laneF);
    const w = kartW * sc, h = kartH * sc;
    const frac = Math.min(1, st.speed / BASE_SPEED);
    const bounce = Math.sin(st.t * 34) * 1.3 * s * frac;
    const base = laneBase(st.laneF);
    const tilt = Math.max(-0.14, Math.min(0.14, (st.lane - st.laneF) * 0.16));

    // sombra
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath(); ctx.ellipse(kartX + w * 0.5, base, w * 0.46, h * 0.07, 0, 0, Math.PI * 2); ctx.fill();

    // poeira
    st.particles.forEach((p) => {
      ctx.fillStyle = `rgba(255,220,200,${p.a * 0.5})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });

    ctx.save();
    ctx.translate(kartX + w * 0.5, base + bounce);
    ctx.rotate(tilt);
    // fogo do escapamento
    if (frac > 0.3) {
      const fl = (14 + Math.random() * 16) * s * sc * frac;
      const fx = -w * 0.37, fy = -h * 0.40;
      const fg = ctx.createLinearGradient(fx, 0, fx - fl, 0);
      fg.addColorStop(0, 'rgba(255,240,180,.95)'); fg.addColorStop(0.5, 'rgba(255,140,60,.7)'); fg.addColorStop(1, 'rgba(255,60,60,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.ellipse(fx - fl / 2, fy, fl / 2, 4 * s * sc, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (sprite.complete && sprite.naturalWidth) ctx.drawImage(sprite, -w * 0.5, -h * 0.97, w, h);
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawSky();
    drawShore();
    drawRoad();
    drawForeground();
    drawKart();
  }

  // ---------- Atualização ----------
  function update(dt) {
    st.t += dt;
    const target = st.mode === 'running'
      ? Math.min(MAX_SPEED, BASE_SPEED * (1 + SPEED_PER_LAP * (st.lap - 1)))
      : 0;
    st.speed += (target - st.speed) * Math.min(1, dt * 1.6);

    if (st.mode === 'countdown') {
      st.countT -= dt;
      if (st.countT <= 0) {
        st.countN--;
        if (st.countN > 0) { showCount(String(st.countN)); Sound.beep(false); st.countT = 0.75; }
        else if (st.countN === 0) { showCount('JÁ!'); Sound.beep(true); st.countT = 0.6; st.mode = 'running'; }
      }
    } else if (st.mode === 'running' && hud.count.classList.contains('show')) {
      st.countT -= dt;
      if (st.countT <= 0) hud.count.classList.remove('show');
    }

    st.dist += st.speed * dt;
    st.laneF += (st.lane - st.laneF) * Math.min(1, dt * 16);

    // volta completa
    const lap = Math.floor(st.dist / LAP_LEN) + 1;
    if (lap !== st.lap) {
      st.lap = lap;
      hud.lap.textContent = lap;
      showBanner(`Volta ${lap}!`);
      Sound.fanfare();
    }
    const prog = (st.dist % LAP_LEN) / LAP_LEN;
    hud.bar.style.width = (prog * 100) + '%';
    hud.kart.style.left = (prog * 100) + '%';

    // partículas e riscos
    const pxSpeed = st.speed * s;
    if (st.speed > 60 && Math.random() < dt * 28) {
      const sc = laneScale(st.laneF);
      st.particles.push({ x: kartX + kartW * sc * 0.12, y: laneBase(st.laneF) - 4 * s, r: (3 + Math.random() * 5) * s, a: 1 });
    }
    st.particles.forEach((p) => { p.x -= pxSpeed * dt * 0.6; p.y -= 12 * s * dt; p.r += 10 * s * dt; p.a -= dt * 2.2; });
    st.particles = st.particles.filter((p) => p.a > 0 && p.x > -20);
    if (st.streaks.length < 10 && Math.random() < dt * 8) st.streaks.push({ x: W + 10, y: Math.random(), len: 40 + Math.random() * 90 });
    st.streaks.forEach((k) => { k.x -= pxSpeed * dt * 1.5; });
    st.streaks = st.streaks.filter((k) => k.x > -200);

    Sound.engineSet(st.speed / MAX_SPEED, st.mode === 'countdown');
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (st.mode === 'paused' || st.mode === 'idle') return;
    update(dt);
    draw();
  }

  // ---------- Avisos na tela ----------
  function showCount(txt) {
    hud.count.textContent = txt;
    hud.count.classList.remove('show'); void hud.count.offsetWidth; hud.count.classList.add('show');
  }
  let bannerTimer = 0;
  function showBanner(txt) {
    hud.banner.textContent = txt;
    hud.banner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => hud.banner.classList.remove('show'), 1600);
  }

  // ---------- Controles ----------
  function move(dir) {
    if (st.mode !== 'running' && st.mode !== 'countdown') return;
    const n = Math.max(0, Math.min(LANES - 1, st.lane + dir));
    if (n === st.lane) return;
    st.lane = n;
    Sound.swish(dir);
    hud.hint.classList.remove('show');
  }

  let touch = null;
  canvas.addEventListener('pointerdown', (e) => {
    touch = { y: e.clientY, done: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!touch || touch.done) return;
    const dy = e.clientY - touch.y;
    if (Math.abs(dy) > 22) { move(dy < 0 ? -1 : 1); touch.done = true; }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (touch && !touch.done) {
      // toque simples: acima do kart sobe, abaixo desce
      const mid = laneBase(st.laneF) - kartH * 0.45;
      move(e.clientY < mid ? -1 : 1);
    }
    touch = null;
  });
  canvas.addEventListener('pointercancel', () => { touch = null; });

  window.addEventListener('keydown', (e) => {
    if (!screen.classList.contains('active')) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') { move(-1); e.preventDefault(); }
    else if (k === 'arrowdown' || k === 's') { move(1); e.preventDefault(); }
    else if (k === 'escape' || k === 'p') { st.mode === 'paused' ? resume() : pause(); }
  });

  // ---------- Fluxo ----------
  function start() {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    screen.classList.add('active');
    Object.assign(st, {
      mode: 'countdown', dist: 0, speed: 0, lap: 1, lane: 1, laneF: 1,
      t: 0, countN: 3, countT: 0.75, particles: [], streaks: [],
    });
    hud.lap.textContent = '1';
    hud.pause.classList.remove('show');
    hud.banner.classList.remove('show');
    hud.hint.classList.add('show');
    setTimeout(() => hud.hint.classList.remove('show'), 6000);
    resize();
    showCount('3'); Sound.beep(false);
    Sound.engineStart();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function pause() {
    if (st.mode !== 'running' && st.mode !== 'countdown') return;
    st.prevMode = st.mode;
    st.mode = 'paused';
    hud.pause.classList.add('show');
    Sound.engineStop();
  }
  function resume() {
    if (st.mode !== 'paused') return;
    st.mode = st.prevMode;
    hud.pause.classList.remove('show');
    last = performance.now();
    Sound.engineStart();
  }
  function exit() {
    st.mode = 'idle';
    cancelAnimationFrame(raf);
    Sound.engineStop();
    screen.classList.remove('active');
    document.getElementById('title-screen').classList.add('active');
  }

  $('btn-pause').addEventListener('click', () => { Sound.click(); pause(); });
  $('btn-resume').addEventListener('click', () => { Sound.click(); resume(); });
  $('btn-exit').addEventListener('click', () => { Sound.click(); exit(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('resize', () => { if (screen.classList.contains('active')) resize(); });

  return { start, pause, resume, exit, move, get state() { return st; } };
})();
