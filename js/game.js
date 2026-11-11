// Turtle Race — corrida em 3D (visão por trás do kart).
const Game = (() => {
  const $ = (id) => document.getElementById(id);
  const screen = $('game-screen');
  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d');
  const hud = {
    lap: $('hud-lap'), bar: $('hud-bar-fill'), kart: $('hud-bar-kart'),
    count: $('countdown'), banner: $('banner'), hint: $('hint'), pause: $('pause-overlay'),
  };

  // ---------- Configuração ----------
  // Distâncias em "unidades de pista": 1 = metade da largura da pista.
  const LANES = 3;
  const LANE_W = 2 / LANES;
  const Z_KART = 1.4;            // distância do kart até a câmera
  const Z_FAR = 42;              // até onde a pista é desenhada
  const SEG = 0.5;               // tamanho de cada faixa pintada no chão
  const LAP_LEN = 100;           // comprimento de uma volta
  const BASE_SPEED = 7;          // velocidade da 1ª volta (unidades/s)
  const SPEED_PER_LAP = 0.08;    // cada volta fica 8% mais rápida
  const MAX_SPEED = 14;

  // ---------- Medidas da tela ----------
  let W = 0, H = 0, dpr = 1, cx = 0, horizon = 0, roadH = 0, half = 0;

  // ---------- Estado ----------
  const st = {
    mode: 'idle',               // idle | countdown | running | paused
    prevMode: 'running',
    dist: 0, speed: 0, lap: 1,
    lane: 1, laneF: 1,
    t: 0, countT: 0, countN: 3,
    particles: [],
  };
  let raf = 0, last = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const portrait = H > W;
    cx = W / 2;
    horizon = H * (portrait ? 0.34 : 0.36);
    roadH = H - horizon;
    half = portrait ? W * 0.58 : Math.min(W * 0.46, roadH * 1.5);   // meia pista na base da tela
    if (st.mode !== 'idle') draw();
  }

  // ---------- Projeção 3D ----------
  const py = (z) => horizon + roadH / z;          // altura na tela de um ponto no chão
  const px = (x, z) => cx + x * half / z;         // posição horizontal
  const ps = (z) => half / z;                     // pixels por unidade naquela distância

  function rnd(i, salt = 0) {
    const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  // ---------- Céu: praia ao pôr do sol ----------
  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, '#170a3a');
    g.addColorStop(0.5, '#6a1b6e');
    g.addColorStop(0.82, '#ff5e7e');
    g.addColorStop(1, '#ffb36b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizon + 1);

    for (let i = 0; i < 50; i++) {
      const x = rnd(i, 1) * W, y = rnd(i, 2) * horizon * 0.6;
      const a = 0.25 + 0.5 * Math.abs(Math.sin(st.t * (0.6 + rnd(i, 3)) + i));
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x, y, 1.6, 1.6);
    }

    // sol listrado no fim da pista
    const seaH = Math.max(10, roadH * 0.045), seaTop = horizon - seaH;
    const r = Math.min(W * 0.2, horizon * 0.42), sy = seaTop - r * 0.3;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, seaTop); ctx.clip();
    const sg = ctx.createLinearGradient(0, sy - r, 0, sy + r);
    sg.addColorStop(0, '#fff3a6'); sg.addColorStop(0.5, '#ffb347'); sg.addColorStop(1, '#ff4d7a');
    ctx.shadowColor = 'rgba(255,150,90,.9)'; ctx.shadowBlur = r * 0.6;
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(cx, sy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(160,45,110,.6)';
    for (let i = 0; i < 5; i++) ctx.fillRect(cx - r, sy + r * (0.1 + i * 0.17), r * 2, r * (0.025 + i * 0.018));
    ctx.restore();

    // ilhas
    ctx.fillStyle = '#4a1a5e';
    ctx.beginPath(); ctx.moveTo(0, seaTop);
    for (let x = 0; x <= W; x += 8) {
      const k = x / W * 9;
      const y = Math.max(0, Math.sin(k * 1.3 + 1) * 0.5 + Math.sin(k * 2.9) * 0.3 - 0.15) * Math.abs(x - cx) / W * 2.2;
      ctx.lineTo(x, seaTop - y * seaH * 1.6);
    }
    ctx.lineTo(W, seaTop); ctx.closePath(); ctx.fill();

    // mar
    const mg = ctx.createLinearGradient(0, seaTop, 0, horizon);
    mg.addColorStop(0, '#ff7a8a'); mg.addColorStop(1, '#4a2390');
    ctx.fillStyle = mg; ctx.fillRect(0, seaTop, W, seaH + 1);
    ctx.fillStyle = 'rgba(255,230,170,.75)';
    for (let i = 0; i < 4; i++) {
      const w = r * (0.5 + i * 0.45) * (0.85 + 0.15 * Math.sin(st.t * 2 + i));
      ctx.fillRect(cx - w / 2, seaTop + (i + 0.5) * seaH / 4, w, Math.max(1, seaH * 0.07));
    }
  }

  // ---------- Chão e pista ----------
  function quad(x1, y1, w1, x2, y2, w2, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1); ctx.lineTo(x1 + w1, y1);
    ctx.lineTo(x2 + w2, y2); ctx.lineTo(x2 - w2, y2);
    ctx.closePath(); ctx.fill();
  }

  function drawGround() {
    const kFar = Math.ceil((st.dist + Z_FAR) / SEG);
    const kNear = Math.floor((st.dist + 0.8) / SEG);
    // areia (faixas claras e escuras)
    for (let k = kFar; k >= kNear; k--) {
      const y1 = py(Math.max(0.8, k * SEG - st.dist)), y2 = py((k + 1) * SEG - st.dist);
      ctx.fillStyle = (Math.floor(k / 2) % 2 + 2) % 2 ? '#6b3566' : '#5f2e5d';
      ctx.fillRect(0, y2 - 0.5, W, y1 - y2 + 1);
    }
    for (let k = kFar; k >= kNear; k--) {
      const z1 = Math.max(0.8, k * SEG - st.dist), z2 = (k + 1) * SEG - st.dist;
      if (z2 <= 0.8) continue;
      const y1 = py(z1) + 0.6, y2 = py(z2);
      const s1 = ps(z1), s2 = ps(z2);
      const alt = ((k % 2) + 2) % 2, alt4 = (Math.floor(k / 2) % 2 + 2) % 2;

      // zebra
      quad(cx, y1, s1 * 1.13, cx, y2, s2 * 1.13, alt ? '#ff3b4a' : '#f4f6ff');
      // asfalto
      quad(cx, y1, s1, cx, y2, s2, alt4 ? '#2b2444' : '#27203e');
      // linha da borda
      quad(cx - s1 * 0.97, y1, s1 * 0.012, cx - s2 * 0.97, y2, s2 * 0.012, 'rgba(255,255,255,.5)');
      quad(cx + s1 * 0.97, y1, s1 * 0.012, cx + s2 * 0.97, y2, s2 * 0.012, 'rgba(255,255,255,.5)');
      // faixas tracejadas
      if (alt4 && alt) {
        for (let i = 1; i < LANES; i++) {
          const lx = -1 + i * LANE_W;
          quad(cx + lx * s1, y1, s1 * 0.016, cx + lx * s2, y2, s2 * 0.016, 'rgba(255,255,255,.75)');
        }
      }
    }

    // linha de chegada
    const lapK = Math.floor(st.dist / LAP_LEN);
    for (let k = lapK; k <= lapK + 1; k++) {
      const z0 = k * LAP_LEN - st.dist + Z_KART;
      if (z0 < 0.6 || z0 > Z_FAR) continue;
      const cols = 12, rows = 2, len = 0.5;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const za = Math.max(0.8, z0 + r * len / rows), zb = z0 + (r + 1) * len / rows;
        if (zb <= 0.8) continue;
        const xm = -1 + (c + 0.5) * 2 / cols, hw = 1 / cols;
        quad(px(xm, za), py(za), hw * ps(za), px(xm, zb), py(zb), hw * ps(zb), (r + c) % 2 ? '#15172a' : '#f4f6ff');
      }
    }

    // névoa no horizonte
    const fg = ctx.createLinearGradient(0, horizon, 0, horizon + roadH * 0.22);
    fg.addColorStop(0, 'rgba(255,150,120,.75)'); fg.addColorStop(1, 'rgba(255,150,120,0)');
    ctx.fillStyle = fg; ctx.fillRect(0, horizon, W, roadH * 0.22);
  }

  // ---------- Objetos na beira da pista ----------
  function drawPalm(x, base, h, lean, alpha) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#2a1040'; ctx.fillStyle = '#231038';
    ctx.lineCap = 'round';
    const tx = x + lean * h * 0.25, ty = base - h;
    ctx.lineWidth = Math.max(1.5, h * 0.05);
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
    ctx.globalAlpha = 1;
  }

  function drawGantry(z) {
    const y = py(z), sc = ps(z);
    const xl = px(-1.2, z), xr = px(1.2, z), top = y - 1.7 * sc, bh = 0.38 * sc;
    ctx.fillStyle = '#2a2935';
    ctx.fillRect(xl - 0.04 * sc, top, 0.08 * sc, y - top);
    ctx.fillRect(xr - 0.04 * sc, top, 0.08 * sc, y - top);
    const cols = 16, cw = (xr - xl) / cols;
    for (let r = 0; r < 2; r++) for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 ? '#15172a' : '#f4f6ff';
      ctx.fillRect(xl + c * cw, top + r * bh / 2, cw + 0.5, bh / 2 + 0.5);
    }
    ctx.fillStyle = '#ff3b4a';
    ctx.fillRect(xl, top - 0.05 * sc, xr - xl, 0.05 * sc);
    ctx.fillRect(xl, top + bh, xr - xl, 0.05 * sc);
  }

  // Lista os objetos visíveis, do mais longe para o mais perto
  function sideObjects() {
    const list = [];
    const sp = 2.2;
    const k0 = Math.floor((st.dist + 0.9) / sp), k1 = Math.ceil((st.dist + Z_FAR) / sp);
    for (let k = k1; k >= k0; k--) {
      const z = k * sp - st.dist;
      if (z < 0.9) continue;
      [-1, 1].forEach((sd) => {
        if (rnd(k, sd + 5) < 0.3) return;
        list.push({ type: 'palm', z, x: sd * (1.5 + rnd(k, sd + 7) * 1.4), h: 1.5 + rnd(k, sd + 9) * 0.9, lean: rnd(k, sd + 11) - 0.5 });
      });
    }
    const lapK = Math.floor(st.dist / LAP_LEN);
    for (let k = lapK; k <= lapK + 1; k++) {
      const z = k * LAP_LEN - st.dist + Z_KART + 0.25;
      if (z > 0.9 && z < Z_FAR) list.push({ type: 'gantry', z });
    }
    return list.sort((a, b) => b.z - a.z);
  }

  function drawObject(o) {
    if (o.type === 'palm') {
      const alpha = Math.min(1, (Z_FAR - o.z) / 10);
      drawPalm(px(o.x, o.z), py(o.z), o.h * ps(o.z), o.lean, alpha);
    } else if (o.type === 'gantry') drawGantry(o.z);
  }

  // ---------- Kart ----------
  const kartX = () => (st.laneF - (LANES - 1) / 2) * LANE_W;

  function drawKart() {
    const sc = ps(Z_KART);
    const w = LANE_W * sc * 0.86;
    const frac = Math.min(1, st.speed / BASE_SPEED);
    const steer = Math.max(-1, Math.min(1, (st.lane - st.laneF) * 2.2));
    const x = px(kartX(), Z_KART), y = py(Z_KART);

    // poeira
    st.particles.forEach((p) => {
      ctx.fillStyle = `rgba(255,215,200,${p.a * 0.45})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });

    ctx.save();
    ctx.translate(x, y + Math.sin(st.t * 34) * w * 0.006 * frac);
    ctx.rotate(steer * 0.1);
    drawKartRear(ctx, w, { t: st.t, speed: frac, steer });
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawSky();
    drawGround();
    const objs = sideObjects();
    objs.filter((o) => o.z >= Z_KART).forEach(drawObject);
    drawKart();
    objs.filter((o) => o.z < Z_KART).forEach(drawObject);
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
        else { showCount('JÁ!'); Sound.beep(true); st.mode = 'running'; }
      }
    }

    st.dist += st.speed * dt;
    st.laneF += (st.lane - st.laneF) * Math.min(1, dt * 14);

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

    // poeira saindo das rodas traseiras
    const sc = ps(Z_KART), w = LANE_W * sc * 0.86;
    if (st.speed > 1 && Math.random() < dt * 40) {
      const sd = Math.random() < 0.5 ? -1 : 1;
      st.particles.push({
        x: px(kartX(), Z_KART) + sd * w * 0.38, y: py(Z_KART) - w * 0.03,
        vx: sd * w * (0.3 + Math.random() * 0.5), vy: w * (0.5 + Math.random() * 0.6),
        r: w * 0.04, a: 1,
      });
    }
    st.particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.r += w * 0.25 * dt; p.a -= dt * 2.4; });
    st.particles = st.particles.filter((p) => p.a > 0);

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
    touch = { x: e.clientX, done: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!touch || touch.done) return;
    const dx = e.clientX - touch.x;
    if (Math.abs(dx) > 22) { move(dx < 0 ? -1 : 1); touch.done = true; }
  });
  canvas.addEventListener('pointerup', (e) => {
    // toque simples: lado esquerdo ou direito do kart
    if (touch && !touch.done) move(e.clientX < px(kartX(), Z_KART) ? -1 : 1);
    touch = null;
  });
  canvas.addEventListener('pointercancel', () => { touch = null; });

  window.addEventListener('keydown', (e) => {
    if (!screen.classList.contains('active')) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { move(-1); e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { move(1); e.preventDefault(); }
    else if (k === 'escape' || k === 'p') { st.mode === 'paused' ? resume() : pause(); }
  });

  // ---------- Fluxo ----------
  function start() {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    screen.classList.add('active');
    Object.assign(st, {
      mode: 'countdown', dist: 0, speed: 0, lap: 1, lane: 1, laneF: 1,
      t: 0, countN: 3, countT: 0.75, particles: [],
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
