// Turtle Race — corrida em 3D (visão por trás do kart).
const Game = (() => {
  const $ = (id) => document.getElementById(id);
  const screen = $('game-screen');
  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d');
  const hud = {
    lap: $('hud-lap'), bar: $('hud-bar-fill'), kart: $('hud-bar-kart'),
    count: $('countdown'), banner: $('banner'), hint: $('hint'), pause: $('pause-overlay'),
    time: $('hud-time'), timeChip: $('hud-time-chip'), stars: $('hud-stars'), score: $('hud-score'), shield: $('hud-shield'),
    over: $('over-overlay'), turbo: $('hud-turbo'),
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
  const START_TIME = 60;         // segundos no começo da corrida
  const CLOCK_BONUS = 5;         // segundos que o relógio dá
  const HIT_PENALTY = 3;         // segundos perdidos ao errar uma pergunta
  const LIVES = 3;               // batidas que o kart aguenta
  const RIVALS = [
    { body: '#2f7de1', bodyDark: '#174a94', bodyLight: '#6fb0ff', helmet: ['#8fc4ff', '#2f7de1', '#174a94'], scarf: ['#ffc83d', '#ffe08a'], number: '2' },
    { body: '#f2b01e', bodyDark: '#a87200', bodyLight: '#ffd96b', helmet: ['#ffe9a0', '#f2b01e', '#a87200'], scarf: ['#2f7de1', '#6fb0ff'], number: '3' },
    { body: '#8a4be0', bodyDark: '#532a93', bodyLight: '#b98bff', helmet: ['#d2b5ff', '#8a4be0', '#532a93'], scarf: ['#4fd1a5', '#8ff0cf'], number: '4' },
    { body: '#17a673', bodyDark: '#0b6646', bodyLight: '#5ddcab', helmet: ['#a5f0d2', '#17a673', '#0b6646'], scarf: ['#ff7a1a', '#ffb36b'], number: '5' },
  ];

  // ---------- Cenários: um por volta ----------
  const GREENS = [['#2f8a3a', '#4fb14c', '#236b2d'], ['#3a9a3f', '#66c257', '#2a7732'], ['#277a45', '#45a85e', '#1c5c33']];
  const THEMES = [
    { name: 'Campo', sky: 'day', grass: ['#58b548', '#4fa942'], shoulder: ['#a58f6a', '#9c8762'], kerb: ['#e63946', '#f4f6f8'], road: ['#575c66', '#535862'], fog: '214,239,255', side: 'trees', greens: GREENS, trunk: '#6b4a2b' },
    { name: 'Praia', sky: 'beach', grass: ['#f2dba0', '#ead08f'], shoulder: ['#d9bd7a', '#cfb26e'], kerb: ['#2f9fe0', '#f4f6f8'], road: ['#5f626b', '#5a5d66'], fog: '255,244,220', side: 'palms' },
    { name: 'Cidade', sky: 'city', grass: ['#9aa0a9', '#9299a3'], shoulder: ['#737983', '#6d737d'], kerb: ['#f2b01e', '#2a2b33'], road: ['#4b4f58', '#474b54'], fog: '224,232,244', side: 'city' },
    { name: 'Noite', sky: 'night', grass: ['#1f4a33', '#1b422d'], shoulder: ['#4a4436', '#443f32'], kerb: ['#b02a35', '#c9cdd6'], road: ['#343741', '#31343d'], fog: '46,58,110', side: 'trees', lamps: true, trunk: '#3b2a1c',
      greens: [['#1d5a34', '#2c7a45', '#123d24'], ['#215f3a', '#33804a', '#143f27'], ['#184f3a', '#27704f', '#0f3526']] },
    { name: 'Arco-íris', sky: 'rainbow', grass: ['#7fe3a6', '#72d99b'], shoulder: ['#f7c6e6', '#f0b8dd'], kerb: 'rainbow', road: ['#5b5572', '#56506c'], fog: '255,228,246', side: 'trees', trunk: '#8a5a8a',
      greens: [['#ff7ab8', '#ffa6d2', '#d94f93'], ['#8a6bff', '#b39cff', '#6347d6'], ['#38c7c0', '#7fe6e0', '#1f9d97']] },
  ];
  // cenário de um ponto da pista (muda exatamente na linha de chegada)
  const themeAt = (zWorld) => THEMES[(((Math.floor((zWorld - Z_KART) / LAP_LEN)) % THEMES.length) + THEMES.length) % THEMES.length];

  // ---------- Medidas da tela ----------
  let W = 0, H = 0, dpr = 1, cx = 0, horizon = 0, roadH = 0, half = 0;

  // ---------- Estado ----------
  const st = {
    mode: 'idle',               // idle | countdown | running | paused | quiz | over
    prevMode: 'running',
    dist: 0, speed: 0, lap: 1,
    lane: 1, laneF: 1,
    t: 0, countT: 0, countN: 3,
    particles: [],
    time: START_TIME, score: 0, stars: 0, shield: false,
    inv: 0, shake: 0, ents: [], popups: [], prevDist: 0,
    nextRow: 0, nextClock: 0, nextShield: 0, nextFlag: 0, streak: 0,
    turbo: 0, skyFade: 0, skyFrom: null, lastPit: '',
    turboFill: 0, qTotal: 0, qFirst: 0, lives: LIVES,
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

  // ---------- Céu e paisagem ao fundo ----------
  function cloud(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 1.1, y + r * 0.25, r * 0.75, 0, Math.PI * 2);
    ctx.arc(x - r * 1.1, y + r * 0.3, r * 0.7, 0, Math.PI * 2);
    ctx.arc(x + r * 0.45, y - r * 0.45, r * 0.75, 0, Math.PI * 2);
    ctx.roundRect(x - r * 1.8, y + r * 0.3, r * 3.65, r * 0.7, r * 0.35);
    ctx.fill();
  }
  function ridge(base, amp, f1, f2, ph, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, horizon + 1);
    for (let x = 0; x <= W + 6; x += 6) {
      const k = x / W;
      const y = (Math.sin(k * f1 + ph) * 0.55 + Math.sin(k * f2 + ph * 2.3) * 0.3 + 0.6) * amp;
      ctx.lineTo(x, base - Math.max(0, y));
    }
    ctx.lineTo(W, horizon + 1); ctx.closePath(); ctx.fill();
  }
  function skyDay() {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, '#2f8fe6');
    g.addColorStop(0.6, '#7cc4f5');
    g.addColorStop(1, '#d6efff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizon + 1);

    // sol
    const sx = W * 0.8, sy = horizon * 0.3, sr = Math.min(W, H) * 0.06;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 5);
    sg.addColorStop(0, 'rgba(255,255,235,1)'); sg.addColorStop(0.18, 'rgba(255,250,200,.9)');
    sg.addColorStop(0.22, 'rgba(255,245,190,.35)'); sg.addColorStop(1, 'rgba(255,245,190,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, horizon);

    // nuvens andando devagar
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const r = (0.035 + rnd(i, 21) * 0.035) * Math.max(W, 420);
      const span = W + r * 8;
      const x = ((rnd(i, 22) * span + st.t * (4 + rnd(i, 23) * 6)) % span) - r * 4;
      cloud(x, horizon * (0.12 + rnd(i, 24) * 0.5), r);
    }

    // montanhas e morros, cada vez mais verdes de perto
    const a = roadH * 0.16;
    ridge(horizon, a * 1.25, 5.2, 11.5, 0.7, '#8fb4d9');
    ridge(horizon, a * 0.85, 7.4, 15.1, 2.1, '#6fa58e');
    ridge(horizon, a * 0.5, 10.3, 23.7, 4.2, '#4f9257');
    // linha de árvores ao longe
    ctx.fillStyle = '#3b7d45';
    ctx.beginPath(); ctx.moveTo(0, horizon + 1);
    const tw = Math.max(5, W * 0.012);
    for (let x = 0, i = 0; x <= W + tw; x += tw, i++) {
      ctx.lineTo(x, horizon - a * (0.1 + rnd(i, 31) * 0.14));
      ctx.lineTo(x + tw * 0.5, horizon - a * (0.2 + rnd(i, 32) * 0.16));
    }
    ctx.lineTo(W, horizon + 1); ctx.closePath(); ctx.fill();
  }

  function skyBeach() {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, '#1596e6'); g.addColorStop(0.65, '#74d0f7'); g.addColorStop(1, '#d9f6ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 1);
    const sx = W * 0.24, sy = horizon * 0.3, sr = Math.min(W, H) * 0.075;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 5);
    sg.addColorStop(0, 'rgba(255,255,240,1)'); sg.addColorStop(0.2, 'rgba(255,246,190,.95)');
    sg.addColorStop(0.24, 'rgba(255,240,170,.35)'); sg.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, horizon);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
      const r = (0.03 + rnd(i, 51) * 0.03) * Math.max(W, 420), span = W + r * 8;
      cloud(((rnd(i, 52) * span + st.t * (3 + rnd(i, 53) * 5)) % span) - r * 4, horizon * (0.15 + rnd(i, 54) * 0.35), r);
    }
    // mar com ilhas
    const seaH = roadH * 0.075, seaTop = horizon - seaH;
    ridge(seaTop + 1, seaH * 0.9, 9.5, 21.3, 1.3, '#3f9a63');
    const mg = ctx.createLinearGradient(0, seaTop, 0, horizon);
    mg.addColorStop(0, '#1487c4'); mg.addColorStop(1, '#58d6e0');
    ctx.fillStyle = mg; ctx.fillRect(0, seaTop, W, seaH + 1);
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 14; i++) {
      const y = seaTop + (0.15 + rnd(i, 55) * 0.8) * seaH;
      const w = (0.03 + rnd(i, 56) * 0.07) * W * (0.7 + 0.3 * Math.sin(st.t * 2 + i));
      ctx.fillRect(rnd(i, 57) * W - w / 2, y, w, Math.max(1, seaH * 0.05));
    }
  }

  function skyCity() {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, '#4a9be6'); g.addColorStop(0.7, '#a9d5f7'); g.addColorStop(1, '#eaf4fd');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 1);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      const r = (0.03 + rnd(i, 61) * 0.03) * Math.max(W, 420), span = W + r * 8;
      cloud(((rnd(i, 62) * span + st.t * (3 + rnd(i, 63) * 5)) % span) - r * 4, horizon * (0.1 + rnd(i, 64) * 0.35), r);
    }
    // prédios ao longe, em duas camadas
    [['#9fb4cf', 0.34, 71], ['#7f95b5', 0.22, 81]].forEach(([color, maxH, salt]) => {
      const bw = Math.max(14, W * 0.055);
      for (let x = -bw, i = 0; x < W + bw; i++) {
        const w = bw * (0.6 + rnd(i, salt) * 0.9), h = roadH * maxH * (0.35 + rnd(i, salt + 1) * 0.65);
        ctx.fillStyle = color;
        ctx.fillRect(x, horizon - h, w - 1, h + 1);
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        const ws = Math.max(2, w * 0.16);
        for (let wy = horizon - h + ws; wy < horizon - ws; wy += ws * 2) {
          for (let wx = x + ws; wx < x + w - ws * 1.5; wx += ws * 2) if (rnd(i * 31 + wy, salt + 2) < 0.6) ctx.fillRect(wx, wy, ws, ws);
        }
        x += w;
      }
    });
  }

  function skyNight() {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, '#060a22'); g.addColorStop(0.6, '#18245a'); g.addColorStop(1, '#3c4a8c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 1);
    for (let i = 0; i < 70; i++) {
      const a = 0.3 + 0.6 * Math.abs(Math.sin(st.t * (0.5 + rnd(i, 93)) + i));
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(rnd(i, 91) * W, rnd(i, 92) * horizon * 0.8, 1.7, 1.7);
    }
    // lua
    const mx = W * 0.22, my = horizon * 0.28, mr = Math.min(W, H) * 0.055;
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 4);
    mg.addColorStop(0, 'rgba(255,255,235,.5)'); mg.addColorStop(1, 'rgba(255,255,235,0)');
    ctx.fillStyle = mg; ctx.fillRect(0, 0, W, horizon);
    ctx.fillStyle = '#fdf8dc'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(190,190,170,.5)';
    ctx.beginPath(); ctx.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.2, 0, Math.PI * 2); ctx.arc(mx + mr * 0.3, my + mr * 0.3, mr * 0.14, 0, Math.PI * 2); ctx.fill();
    const a = roadH * 0.16;
    ridge(horizon, a * 1.25, 5.2, 11.5, 0.7, '#1a2552');
    ridge(horizon, a * 0.85, 7.4, 15.1, 2.1, '#141f40');
    ridge(horizon, a * 0.45, 10.3, 23.7, 4.2, '#0f2a26');
  }

  function skyRainbow() {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, '#6cc4ff'); g.addColorStop(0.6, '#c9b8ff'); g.addColorStop(1, '#ffd9ef');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 1);
    // arco-íris gigante atrás da pista
    const R = Math.max(W * 0.62, horizon * 0.9), band = R * 0.05;
    ['#ff5a6a', '#ff9d3d', '#ffe14a', '#5fd36a', '#4aa8ff', '#9a6bff'].forEach((c, i) => {
      ctx.strokeStyle = c; ctx.lineWidth = band + 1; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.arc(cx, horizon + R * 0.12, R - i * band, Math.PI, Math.PI * 2); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const r = (0.035 + rnd(i, 101) * 0.035) * Math.max(W, 420), span = W + r * 8;
      cloud(((rnd(i, 102) * span + st.t * (4 + rnd(i, 103) * 6)) % span) - r * 4, horizon * (0.2 + rnd(i, 104) * 0.6), r);
    }
    const a = roadH * 0.14;
    ridge(horizon, a * 1.1, 5.2, 11.5, 0.7, '#b9a6ff');
    ridge(horizon, a * 0.6, 8.4, 17.1, 2.1, '#8fe0b5');
  }

  const SKIES = { day: skyDay, beach: skyBeach, city: skyCity, night: skyNight, rainbow: skyRainbow };
  function drawSky() {
    const now = themeAt(st.dist + Z_KART);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, horizon + 1); ctx.clip();
    SKIES[now.sky]();
    // troca suave de céu ao passar pela chegada
    if (st.skyFade > 0 && st.skyFrom && st.skyFrom !== now) { ctx.globalAlpha = st.skyFade; SKIES[st.skyFrom.sky](); ctx.globalAlpha = 1; }
    ctx.restore();
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
    // grama (faixas claras e escuras, como grama aparada)
    for (let k = kFar; k >= kNear; k--) {
      const y1 = py(Math.max(0.8, k * SEG - st.dist)), y2 = py((k + 1) * SEG - st.dist);
      ctx.fillStyle = themeAt(k * SEG).grass[(Math.floor(k / 2) % 2 + 2) % 2 ? 0 : 1];
      ctx.fillRect(0, y2 - 0.5, W, y1 - y2 + 1);
    }
    for (let k = kFar; k >= kNear; k--) {
      const z1 = Math.max(0.8, k * SEG - st.dist), z2 = (k + 1) * SEG - st.dist;
      if (z2 <= 0.8) continue;
      const y1 = py(z1) + 0.6, y2 = py(z2);
      const s1 = ps(z1), s2 = ps(z2);
      const alt = ((k % 2) + 2) % 2, alt4 = (Math.floor(k / 2) % 2 + 2) % 2;
      const th = themeAt(k * SEG);

      // acostamento de terra
      quad(cx, y1, s1 * 1.24, cx, y2, s2 * 1.24, th.shoulder[alt4 ? 0 : 1]);
      // zebra
      quad(cx, y1, s1 * 1.13, cx, y2, s2 * 1.13, th.kerb === 'rainbow' ? `hsl(${(((k * 45) % 360) + 360) % 360},90%,62%)` : th.kerb[alt ? 0 : 1]);
      // asfalto
      quad(cx, y1, s1, cx, y2, s2, th.road[alt4 ? 0 : 1]);
      // remendos e manchas no asfalto
      if (rnd(k, 41) < 0.12) {
        const lx = -0.8 + rnd(k, 42) * 1.6, pw = 0.08 + rnd(k, 43) * 0.14;
        quad(cx + lx * s1, y1, s1 * pw, cx + lx * s2, y2, s2 * pw, 'rgba(25,27,33,.22)');
      }
      // linhas brancas das bordas
      quad(cx - s1 * 0.96, y1, s1 * 0.014, cx - s2 * 0.96, y2, s2 * 0.014, 'rgba(255,255,255,.9)');
      quad(cx + s1 * 0.96, y1, s1 * 0.014, cx + s2 * 0.96, y2, s2 * 0.014, 'rgba(255,255,255,.9)');
      // faixas tracejadas
      if (alt4 && alt) {
        for (let i = 1; i < LANES; i++) {
          const lx = -1 + i * LANE_W;
          quad(cx + lx * s1, y1, s1 * 0.014, cx + lx * s2, y2, s2 * 0.014, 'rgba(255,255,255,.85)');
        }
      }
      // guard-rail dos dois lados
      [-1, 1].forEach((sd) => {
        const xa = cx + sd * 1.36 * s1, xb = cx + sd * 1.36 * s2;
        ctx.fillStyle = alt ? '#c9ced6' : '#b4bac4';
        ctx.beginPath();
        ctx.moveTo(xa, y1 - 0.2 * s1); ctx.lineTo(xb, y2 - 0.2 * s2);
        ctx.lineTo(xb, y2 - 0.09 * s2); ctx.lineTo(xa, y1 - 0.09 * s1);
        ctx.closePath(); ctx.fill();
        if (alt) { ctx.fillStyle = '#7d838e'; ctx.fillRect(xb - 0.012 * s2, y2 - 0.2 * s2, 0.024 * s2, 0.2 * s2); }
      });
    }

    // marcas de pneu no meio de cada faixa (do horizonte até a câmera)
    for (let i = 0; i < LANES; i++) {
      const lx = -1 + (i + 0.5) * LANE_W;
      [-0.13, 0.13].forEach((o) => quad(px(lx + o, 0.8), py(0.8), ps(0.8) * 0.035, px(lx + o, Z_FAR), py(Z_FAR), ps(Z_FAR) * 0.035, 'rgba(30,32,38,.15)'));
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
    const fg = ctx.createLinearGradient(0, horizon, 0, horizon + roadH * 0.16);
    const fogc = themeAt(st.dist + Z_KART).fog;
    fg.addColorStop(0, `rgba(${fogc},.85)`); fg.addColorStop(1, `rgba(${fogc},0)`);
    ctx.fillStyle = fg; ctx.fillRect(0, horizon, W, roadH * 0.16);
  }

  // ---------- Objetos na beira da pista ----------
  function drawTree(x, base, h, kind, pal, trunk, alpha) {
    const [mid, light, dark] = pal;
    ctx.globalAlpha = alpha;
    // sombra no chão
    ctx.fillStyle = 'rgba(0,40,10,.22)';
    ctx.beginPath(); ctx.ellipse(x + h * 0.12, base, h * 0.32, h * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    // tronco
    const tw = h * 0.075;
    ctx.fillStyle = trunk;
    ctx.fillRect(x - tw / 2, base - h * 0.42, tw, h * 0.42);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(x, base - h * 0.42, tw / 2, h * 0.42);
    if (kind === 0) {
      // copa redonda
      const cy = base - h * 0.66, r = h * 0.3;
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(x + r * 0.35, cy + r * 0.3, r * 0.8, 0, Math.PI * 2); ctx.arc(x - r * 0.5, cy + r * 0.35, r * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = mid;
      ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.arc(x - r * 0.6, cy + r * 0.25, r * 0.62, 0, Math.PI * 2); ctx.arc(x + r * 0.62, cy + r * 0.2, r * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.arc(x - r * 0.28, cy - r * 0.3, r * 0.52, 0, Math.PI * 2); ctx.arc(x + r * 0.3, cy - r * 0.05, r * 0.32, 0, Math.PI * 2); ctx.fill();
    } else {
      // pinheiro
      for (let i = 0; i < 3; i++) {
        const top = base - h * (1 - i * 0.2), bot = base - h * (0.52 - i * 0.14), hw = h * (0.17 + i * 0.07);
        ctx.fillStyle = mid;
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + hw, bot); ctx.lineTo(x - hw, bot); ctx.closePath(); ctx.fill();
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + hw, bot); ctx.lineTo(x, bot); ctx.closePath(); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawPalm(x, base, h, lean, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(90,60,10,.2)';
    ctx.beginPath(); ctx.ellipse(x + h * 0.1, base, h * 0.26, h * 0.04, 0, 0, Math.PI * 2); ctx.fill();
    const tx = x + lean * h * 0.3, ty = base - h;
    ctx.strokeStyle = '#a9713d'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, h * 0.06);
    ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + lean * h * 0.05, base - h * 0.55, tx, ty); ctx.stroke();
    const sway = Math.sin(st.t * 1.5 + x * 0.01) * 0.06;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI + (i / 6) * Math.PI + sway;
      const len = h * (0.42 + 0.08 * Math.sin(i * 2.1));
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + len * 0.3;
      const mx = tx + Math.cos(a) * len * 0.55, my = ty + Math.sin(a) * len * 0.6 - len * 0.12;
      ctx.fillStyle = i % 2 ? '#2f9a42' : '#4fbf52';
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.quadraticCurveTo(mx, my + len * 0.22, tx, ty);
      ctx.fill();
    }
    ctx.fillStyle = '#7a4a22';
    ctx.beginPath(); ctx.arc(tx - h * 0.02, ty + h * 0.03, h * 0.03, 0, Math.PI * 2); ctx.arc(tx + h * 0.03, ty + h * 0.04, h * 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  const WALLS = ['#d9c3a8', '#a9bdd4', '#e0ae96', '#bccaa6', '#b5afd6', '#e6d28f'];
  function drawBuilding(o, alpha) {
    const sc = ps(o.z), base = py(o.z), x = px(o.x, o.z);
    const w = o.w * sc, h = o.h * sc, sd = Math.sign(o.x);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = WALLS[o.tone];
    ctx.fillRect(x - w / 2, base - h, w, h);
    // lateral virada para a rua, mais escura
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.fillRect(sd > 0 ? x - w / 2 : x + w / 2 - w * 0.14, base - h, w * 0.14, h);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(x - w / 2, base - h, w, Math.max(1, h * 0.03));
    if (sc > 14) {
      const cols = 3, rows = Math.floor(o.h / 0.5), ww = w * 0.16, gap = (w * 0.8 - cols * ww) / (cols + 1), rh = h / (rows + 0.6);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        ctx.fillStyle = rnd(o.id * 17 + r * 5 + c, 3) < 0.35 ? '#ffe9a0' : '#7fb6e6';
        const wx = (sd > 0 ? x - w / 2 + w * 0.17 : x - w / 2 + w * 0.03) + gap + c * (ww + gap);
        ctx.fillRect(wx, base - h + rh * (r + 0.45), ww, rh * 0.5);
      }
      ctx.fillStyle = '#5a4636';
      ctx.fillRect(x - w * 0.08, base - Math.min(h, sc * 0.42), w * 0.16, Math.min(h, sc * 0.42));
    }
    ctx.globalAlpha = 1;
  }

  function drawLamp(o, alpha) {
    const sc = ps(o.z), base = py(o.z), x = px(o.x, o.z), sd = Math.sign(o.x);
    const top = base - 1.35 * sc, ax = x - sd * 0.28 * sc;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#5d636e'; ctx.lineWidth = Math.max(1, 0.035 * sc); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, top); ctx.lineTo(ax, top); ctx.stroke();
    if (o.glow) {
      const g = ctx.createRadialGradient(ax, top, 0, ax, top, 0.6 * sc);
      g.addColorStop(0, 'rgba(255,236,160,.75)'); g.addColorStop(1, 'rgba(255,236,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ax, top, 0.6 * sc, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = o.glow ? '#fff3b8' : '#e8ecf2';
    ctx.beginPath(); ctx.ellipse(ax, top + 0.03 * sc, 0.07 * sc, 0.04 * sc, 0, 0, Math.PI * 2); ctx.fill();
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

  // Pórtico da bandeira de pergunta: atravessa a pista inteira
  function drawFlagGate(z) {
    const y = py(z), sc = ps(z);
    const xl = px(-1.1, z), xr = px(1.1, z), top = y - 1.45 * sc, bh = 0.42 * sc;
    // cortina de luz
    const cg = ctx.createLinearGradient(0, top + bh, 0, y);
    cg.addColorStop(0, 'rgba(255,214,74,.38)'); cg.addColorStop(1, 'rgba(255,214,74,.06)');
    ctx.fillStyle = cg; ctx.fillRect(xl, top + bh, xr - xl, y - top - bh);
    ctx.fillStyle = '#5b3fd6';
    ctx.fillRect(xl - 0.05 * sc, top, 0.1 * sc, y - top);
    ctx.fillRect(xr - 0.05 * sc, top, 0.1 * sc, y - top);
    const bg = ctx.createLinearGradient(xl, 0, xr, 0);
    bg.addColorStop(0, '#7a4dff'); bg.addColorStop(0.5, '#ffd64a'); bg.addColorStop(1, '#7a4dff');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(xl - 0.08 * sc, top - 0.02 * sc, xr - xl + 0.16 * sc, bh, 0.08 * sc); ctx.fill();
    if (bh > 9) {
      ctx.fillStyle = '#2a1466'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `italic 900 ${bh * 0.62}px "Exo 2", sans-serif`;
      ctx.fillText('?  PERGUNTA  ?', (xl + xr) / 2, top + bh * 0.5);
    }
  }

  // Lista os objetos visíveis, do mais longe para o mais perto
  function sideObjects() {
    const list = [];
    const sp = 1.5;
    const k0 = Math.floor((st.dist + 0.9) / sp), k1 = Math.ceil((st.dist + Z_FAR) / sp);
    for (let k = k1; k >= k0; k--) {
      const th = themeAt(k * sp);
      [-1, 1].forEach((sd) => {
        // postes de luz na cidade e à noite
        if ((th.side === 'city' || th.lamps) && k % 3 === 0) {
          const z = k * sp - st.dist;
          if (z > 0.9 && z < Z_FAR) list.push({ type: 'lamp', z, x: sd * 1.55, glow: !!th.lamps });
        }
        // duas fileiras de cada lado
        for (let row = 0; row < 2; row++) {
          const id = k * 4 + (sd > 0 ? 2 : 0) + row;
          if (th.side === 'city') {
            if (row) continue;
            const z = k * sp - st.dist;
            if (z < 0.9 || z > Z_FAR) continue;
            list.push({ type: 'building', z, id, x: sd * (2.45 + rnd(id, 7) * 0.2), w: 1.45, h: 1.8 + rnd(id, 9) * 2.6, tone: Math.floor(rnd(id, 13) * WALLS.length) });
            continue;
          }
          if (rnd(id, 5) < (th.side === 'palms' ? 0.4 : 0.22)) continue;
          const z = k * sp - st.dist + rnd(id, 6) * sp * 0.7;
          if (z < 0.9 || z > Z_FAR) continue;
          const o = { z, x: sd * (1.75 + row * 1.3 + rnd(id, 7) * 1.1), h: 1.3 + rnd(id, 9) * 1.1 + row * 0.4 };
          if (th.side === 'palms') list.push({ ...o, type: 'palm', h: o.h * 1.15, lean: rnd(id, 11) - 0.5 });
          else list.push({ ...o, type: 'tree', kind: rnd(id, 11) < 0.68 ? 0 : 1, pal: th.greens[Math.floor(rnd(id, 13) * 3)], trunk: th.trunk });
        }
      });
    }
    const lapK = Math.floor(st.dist / LAP_LEN);
    for (let k = lapK; k <= lapK + 1; k++) {
      const z = k * LAP_LEN - st.dist + Z_KART + 0.25;
      if (z > 0.9 && z < Z_FAR) list.push({ type: 'gantry', z });
    }
    st.ents.forEach((e) => {
      const z = e.z - st.dist;
      if (z > 0.75 && z < Z_FAR) list.push({ type: 'ent', z, e });
    });
    return list.sort((a, b) => b.z - a.z);
  }

  function drawObject(o) {
    const alpha = Math.min(1, (Z_FAR - o.z) / 8);
    if (o.type === 'tree') drawTree(px(o.x, o.z), py(o.z), o.h * ps(o.z), o.kind, o.pal, o.trunk, alpha);
    else if (o.type === 'palm') drawPalm(px(o.x, o.z), py(o.z), o.h * ps(o.z), o.lean, alpha);
    else if (o.type === 'building') drawBuilding(o, alpha);
    else if (o.type === 'lamp') drawLamp(o, alpha);
    else if (o.type === 'gantry') drawGantry(o.z);
    else if (o.type === 'ent') {
      const e = o.e, sc = ps(o.z);
      const x = px((e.laneF - (LANES - 1) / 2) * LANE_W, o.z), y = py(o.z);
      ctx.globalAlpha = Math.min(1, (Z_FAR - o.z) / 6);
      if (e.type === 'flag') drawFlagGate(o.z);
      else if (e.type === 'rival') {
        ctx.save(); ctx.translate(x, y); ctx.rotate((e.lane - e.laneF) * 0.2);
        drawKartRear(ctx, LANE_W * sc * 0.86, { t: st.t + e.z, speed: 0.6, steer: (e.lane - e.laneF) * 2, ...RIVALS[e.pal] });
        ctx.restore();
      } else Items.draw(ctx, e, x, y, sc * 1.3, st.t);
      ctx.globalAlpha = 1;
    }
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
      ctx.fillStyle = `rgba(225,225,225,${p.a * 0.4})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });

    ctx.save();
    ctx.translate(x, y + Math.sin(st.t * 34) * w * 0.006 * frac);
    ctx.rotate(steer * 0.1 + (st.inv > 0 ? Math.sin(st.t * 40) * 0.05 : 0));
    if (st.inv > 0 && Math.floor(st.t * 14) % 2) ctx.globalAlpha = 0.45;
    drawKartRear(ctx, w, { t: st.t, speed: st.turbo > 0 ? 2.2 : frac, steer, ...Skins.opts() });
    ctx.restore();
    if (st.shield) Items.bubble(ctx, x, y, w, st.t);
    if (st.turbo > 0) {
      // riscos de velocidade do turbo
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const a = rnd(i, 111) * Math.PI * 2, r0 = Math.max(W, H) * (0.35 + ((st.t * 1.6 + rnd(i, 112)) % 1) * 0.5);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, horizon + roadH * 0.3 + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r0 * 1.18, horizon + roadH * 0.3 + Math.sin(a) * r0 * 1.18);
        ctx.stroke();
      }
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (st.shake > 0) ctx.translate((Math.random() - 0.5) * 14 * st.shake, (Math.random() - 0.5) * 14 * st.shake);
    drawSky();
    drawGround();
    const objs = sideObjects();
    objs.filter((o) => o.z >= Z_KART).forEach(drawObject);
    drawKart();
    objs.filter((o) => o.z < Z_KART).forEach(drawObject);

    // textos que sobem ("+5s", "-3s"...)
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    st.popups.forEach((p) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.a * 2));
      ctx.font = `italic 900 ${Math.max(20, half * 0.1)}px "Exo 2", sans-serif`;
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(15,18,30,.85)'; ctx.fillStyle = p.color;
      const x = Math.max(W * 0.3, Math.min(W * 0.7, p.x));
      ctx.strokeText(p.text, x, p.y); ctx.fillText(p.text, x, p.y);
    });
    ctx.globalAlpha = 1;
  }

  // ---------- Obstáculos, itens e rivais ----------
  function popup(text, color) {
    st.popups.forEach((p) => { p.y -= 30; });
    st.popups.push({ text, color, x: px(kartX(), Z_KART), y: py(Z_KART) - ps(Z_KART) * LANE_W * 1.05, a: 1 });
  }

  function spawnRow(z) {
    const lap = Math.floor(z / LAP_LEN) + 1, inLap = z % LAP_LEN;
    if (inLap < 5 || inLap > LAP_LEN - 4) return;              // deixa a chegada livre
    if (Math.abs(z - st.nextFlag) < 4.5 || st.ents.some((e) => e.type === 'flag' && Math.abs(z - e.z) < 4.5)) return;   // e a bandeira também
    const hasRival = st.ents.some((e) => e.type === 'rival');
    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    const kinds = lap === 1 ? ['cone'] : lap === 2 ? ['cone', 'cone', 'rock', 'oil'] : ['cone', 'rock', 'oil', 'tires'];
    if (!hasRival && Math.random() < Math.min(0.32, 0.12 + 0.05 * lap)) {
      st.ents.push({ type: 'rival', lane: lanes[0], laneF: lanes[0], z, pal: (Math.random() * RIVALS.length) | 0, passed: false });
    } else {
      // com rival na pista só bloqueia 1 faixa, para sempre sobrar caminho
      const blocked = !hasRival && Math.random() < Math.min(0.5, (lap - 1) * 0.15) ? 2 : 1;
      for (let i = 0; i < blocked; i++) {
        st.ents.push({ type: kinds[(Math.random() * kinds.length) | 0], lane: lanes[i], laneF: lanes[i], z });
      }
    }
    const free = lanes[2];
    if (z >= st.nextClock) {
      st.ents.push({ type: 'clock', lane: free, laneF: free, z });
      st.nextClock = z + 60 + Math.random() * 35;
    } else if (z >= st.nextShield) {
      st.ents.push({ type: 'shield', lane: free, laneF: free, z });
      st.nextShield = z + 150 + Math.random() * 80;
    } else if (Math.random() < 0.55) {
      for (let j = 0; j < 3; j++) st.ents.push({ type: 'star', lane: free, laneF: free, z: z + j * 1.1 });
    }
  }

  const SOLID = { cone: 1, rock: 1, tires: 1, oil: 1 };

  function hit(e) {
    if (st.shield) {
      st.shield = false; st.inv = 1;
      hud.shield.classList.remove('on');
      popup('Escudo!', '#7fdcff'); Sound.shieldBreak();
      return;
    }
    if (e.type === 'oil') {
      st.time -= 1; st.inv = 0.9;
      const dir = st.lane === 0 ? 1 : st.lane === LANES - 1 ? -1 : (Math.random() < 0.5 ? -1 : 1);
      st.lane += dir;
      popup('Escorregou! -1s', '#c9a6ff'); Sound.slip();
    } else {
      // batida: perde uma vida
      st.lives--; st.inv = 1.8; st.shake = 1; st.speed *= 0.4;
      popup(st.lives > 0 ? '-1 vida' : 'Sem vidas!', '#ff5a5f'); Sound.crash();
      $('hud-lives').classList.remove('hurt'); void $('hud-lives').offsetWidth; $('hud-lives').classList.add('hurt');
    }
    if (navigator.vibrate) navigator.vibrate(120);
  }

  function updateEntities(dt, target) {
    // cria as próximas fileiras lá no horizonte
    while (st.nextRow < st.dist + Z_FAR) {
      spawnRow(st.nextRow);
      const lap = Math.floor(st.nextRow / LAP_LEN) + 1;
      st.nextRow += Math.max(5.5, 10 - lap * 0.9) * (0.8 + Math.random() * 0.4);
    }

    // bandeira de pergunta
    if (st.nextFlag < st.dist + Z_FAR) {
      st.ents.push({ type: 'flag', lane: 1, laneF: 1, z: st.nextFlag });
      let nf = st.nextFlag + 36 + Math.random() * 12;
      const inLap = nf % LAP_LEN;
      if (inLap < 8) nf += 8 - inLap; else if (inLap > LAP_LEN - 8) nf += LAP_LEN - inLap + 8;   // longe da chegada
      st.nextFlag = nf;
    }

    const zHit = Z_KART;
    st.ents.forEach((e) => {
      if (e.type === 'flag') {
        if (e.z - st.dist <= zHit) { e.gone = true; st.pendingQuiz = true; }
        return;
      }
      const prev = e.z - st.prevDist;
      if (e.type === 'rival') {
        e.z += target * 0.5 * dt;                               // rival anda mais devagar que o jogador
        // desvia sozinho dos obstáculos (só quando está longe do jogador)
        if (e.z - st.dist > 5 && Math.abs(e.lane - e.laneF) < 0.1) {
          const blocked = (ln, a, b) => st.ents.some((o) => SOLID[o.type] && o.lane === ln && o.z > e.z + a && o.z < e.z + b);
          if (blocked(e.lane, 0, 3.5)) {
            const opts = [e.lane - 1, e.lane + 1].filter((ln) => ln >= 0 && ln < LANES && !blocked(ln, -1, 4.5));
            if (opts.length) e.lane = opts[(Math.random() * opts.length) | 0];
          }
        }
        e.laneF += (e.lane - e.laneF) * Math.min(1, dt * 5);
      }
      const rel = e.z - st.dist;
      const reach = e.type === 'rival' ? 0.42 : 0.3;
      const touching = rel <= zHit + reach && prev >= zHit - reach && Math.abs(e.laneF - st.laneF) < 0.5;
      if (touching && !e.done) {
        if (e.type === 'star') { e.done = e.gone = true; st.stars++; st.score += 10; Sound.pickStar(); }
        else if (e.type === 'clock') { e.done = e.gone = true; st.time += CLOCK_BONUS; popup(`+${CLOCK_BONUS}s`, '#7dff9b'); Sound.pickClock(); }
        else if (e.type === 'shield') { e.done = e.gone = true; st.shield = true; hud.shield.classList.add('on'); popup('Escudo!', '#7fdcff'); Sound.pickShield(); }
        else if (st.turbo > 0) {
          // no turbo o kart passa por cima de tudo
          e.gone = true; st.score += e.type === 'rival' ? 20 : 5; Sound.overtake();
        } else if (st.inv <= 0) {
          const hadShield = st.shield;
          hit(e);
          if (e.type === 'rival') { e.z += 1.6; e.passed = true; }   // rival é empurrado para frente
          else { e.done = true; if (hadShield || e.type !== 'oil') e.gone = true; }
        }
      }
      if (e.type === 'rival' && !e.passed && rel < zHit - 0.6) {
        e.passed = true; st.score += 20;
        popup('Ultrapassou! +20', '#ffd24a'); Sound.overtake();
      }
      if (rel < 0.7) e.gone = true;
    });
    st.ents = st.ents.filter((e) => !e.gone);
  }

  // ---------- Bandeira de pergunta e Pit Stop ----------
  function resumeRace() {
    if (st.time <= 0) { gameOver(); return; }
    st.mode = 'running';
    st.inv = 1.5;                         // um instante de proteção para voltar ao volante
    last = performance.now();
    Sound.engineStart();
  }

  function openQuiz() {
    st.mode = 'quiz';
    Sound.engineStop(); Sound.flag();
    Quiz.ask({ level: st.lap, streak: st.streak }, {
      onWrong() {
        st.streak = 0; st.turboFill = 0;
        st.time = Math.max(0, st.time - HIT_PENALTY);
        hudUpdate();
      },
      onCorrect(first, revealed) {
        st.qTotal++;
        if (first) { st.qFirst++; st.streak++; st.turboFill++; } else { st.streak = 0; st.turboFill = 0; }
        st.score += revealed ? 0 : first ? 50 : 20;
        hudUpdate();
      },
      onClose() {
        resumeRace();
        if (st.mode !== 'running') return;
        if (st.turboFill >= 3) {
          // três acertos seguidos: turbo!
          st.turboFill = 0; st.turbo = 6;
          popup('TURBO!', '#ffd24a'); Sound.turbo();
        } else if (st.streak > 1) popup(`${st.streak} acertos seguidos!`, '#ffd24a');
        hudUpdate();
      },
    });
  }

  // Pit Stop: no fim de cada volta a criança monta um programa inteiro
  function openPit() {
    st.mode = 'quiz';
    Sound.engineStop(); Sound.flag();
    const level = Math.max(1, Math.min(5, st.lap - 1));
    let pool = PIT_STOPS.filter((q) => q.level === level && q.id !== st.lastPit);
    if (!pool.length) pool = PIT_STOPS.filter((q) => q.level === level);
    const question = pool[(Math.random() * pool.length) | 0];
    st.lastPit = question.id;
    let won = false;
    Quiz.ask({ question, streak: 0, pit: true }, {
      onWrong() { st.time = Math.max(0, st.time - HIT_PENALTY); hudUpdate(); },
      onCorrect(first, revealed) {
        won = !revealed;
        st.qTotal++; if (first) st.qFirst++;
        st.score += revealed ? 0 : first ? 100 : 50;
        hudUpdate();
      },
      onClose() {
        if (won && st.time > 0) $('pit-overlay').classList.add('show');
        else resumeRace();
      },
    });
  }

  document.querySelectorAll('#pit-overlay .up').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (st.mode !== 'quiz') return;
      const up = btn.dataset.up;
      $('pit-overlay').classList.remove('show');
      resumeRace();
      if (up === 'time') { st.time += 10; popup('+10s', '#7dff9b'); Sound.pickClock(); }
      else if (up === 'shield') { st.shield = true; hud.shield.classList.add('on'); popup('Escudo!', '#7fdcff'); Sound.pickShield(); }
      else { st.turbo = 6; popup('TURBO!', '#ffd24a'); Sound.turbo(); }
      hudUpdate();
    });
  });

  function gameOver() {
    st.mode = 'over';
    $('over-title').textContent = st.lives <= 0 ? 'Acabaram as vidas!' : 'Fim do tempo!';
    Sound.engineStop(); Sound.gameOver();
    let save = {};
    try { save = JSON.parse(localStorage.getItem('tr-save') || '{}'); } catch (e) { /* sem storage */ }
    const record = st.score > (save.best || 0);
    save.best = Math.max(save.best || 0, st.score);
    save.stars = (save.stars || 0) + st.stars;
    try { localStorage.setItem('tr-save', JSON.stringify(save)); } catch (e) { /* sem storage */ }
    $('best-score').textContent = save.best;
    $('total-stars').textContent = save.stars;
    $('over-score').textContent = st.score;
    $('over-laps').textContent = st.lap - 1;
    $('over-stars').textContent = st.stars;
    $('over-hits').textContent = `${st.qFirst}/${st.qTotal}`;
    $('over-record').classList.toggle('show', record);
    // avaliação: 1 estrela por terminar, 2 por ir bem, 3 por ir muito bem
    const laps = st.lap - 1;
    const rating = 1 + (laps >= 2 || st.score >= 400 ? 1 : 0) + (laps >= 4 || st.score >= 1000 ? 1 : 0);
    $('over-rating').querySelectorAll('svg').forEach((el, i) => {
      el.classList.remove('on');
      if (i < rating) setTimeout(() => { el.classList.add('on'); Sound.pickStar(); }, 350 + i * 350);
    });
    hud.over.classList.add('show');
    if (record || rating === 3) confetti(hud.over);
    Ranking.afterRace(st.score, laps, $('over-rank'));
  }

  // ---------- Atualização ----------
  function update(dt) {
    st.t += dt;
    const target = st.mode === 'running'
      ? Math.min(MAX_SPEED, BASE_SPEED * (1 + SPEED_PER_LAP * (st.lap - 1))) * (st.turbo > 0 ? 1.5 : 1)
      : 0;
    st.turbo = Math.max(0, st.turbo - (st.mode === 'running' ? dt : 0));
    st.skyFade = Math.max(0, st.skyFade - dt * 0.8);
    st.speed += (target - st.speed) * Math.min(1, dt * 1.6);

    if (st.mode === 'countdown') {
      st.countT -= dt;
      if (st.countT <= 0) {
        st.countN--;
        if (st.countN > 0) { showCount(String(st.countN)); Sound.beep(false); st.countT = 0.75; }
        else { showCount('JÁ!'); Sound.beep(true); st.mode = 'running'; }
      }
    }

    st.prevDist = st.dist;
    st.dist += st.speed * dt;
    st.inv = Math.max(0, st.inv - dt);
    st.shake = Math.max(0, st.shake - dt * 3);
    st.popups.forEach((p) => { p.y -= 60 * dt; p.a -= dt * 0.9; });
    st.popups = st.popups.filter((p) => p.a > 0);
    if (st.mode === 'running') {
      st.time -= dt;
      updateEntities(dt, target);
      if (st.lives <= 0) { hudUpdate(); draw(); gameOver(); return; }
      if (st.time <= 0) { st.time = 0; hudUpdate(); draw(); gameOver(); return; }
      if (st.pendingQuiz) { st.pendingQuiz = false; hudUpdate(); draw(); openQuiz(); return; }
      if (st.pendingPit) { st.pendingPit = false; hudUpdate(); draw(); openPit(); return; }
    }
    hudUpdate();
    st.laneF += (st.lane - st.laneF) * Math.min(1, dt * 14);

    // volta completa
    const lap = Math.floor(st.dist / LAP_LEN) + 1;
    if (lap !== st.lap) {
      st.score += 100 * st.lap;
      popup(`Volta completa! +${100 * st.lap}`, '#ffd24a');
      st.skyFrom = themeAt(st.dist + Z_KART - LAP_LEN); st.skyFade = 1;
      st.lap = lap;
      hud.lap.textContent = lap;
      showBanner(`Volta ${lap} · ${themeAt(st.dist + Z_KART).name}`);
      st.pendingPit = true;
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

  function hudUpdate() {
    const secs = Math.max(0, Math.ceil(st.time));
    if (hud.time.textContent !== String(secs)) {
      hud.time.textContent = secs;
      hud.timeChip.classList.toggle('low', secs <= 10);
      if (secs <= 10 && secs > 0 && st.mode === 'running') Sound.tick();
    }
    hud.stars.textContent = st.stars;
    hud.score.textContent = st.score;
    $('hud-lives').querySelectorAll('svg').forEach((h, i) => h.classList.toggle('off', i >= st.lives));
    const pips = hud.turbo.querySelectorAll('i');
    pips.forEach((pip, i) => pip.classList.toggle('on', st.turbo > 0 ? st.turbo > i * 2 : i < st.turboFill));
    hud.turbo.classList.toggle('active', st.turbo > 0);
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (st.mode === 'paused' || st.mode === 'idle' || st.mode === 'over' || st.mode === 'quiz' || st.mode === 'help') return;
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
      time: START_TIME, score: 0, stars: 0, shield: false, inv: 0, shake: 0,
      ents: [], popups: [], prevDist: 0,
      nextFlag: 30, streak: 0, turbo: 0, skyFade: 0, skyFrom: null, pendingPit: false,
      turboFill: 0, qTotal: 0, qFirst: 0, lives: LIVES,
      nextRow: 16, nextClock: 45 + Math.random() * 25, nextShield: 110 + Math.random() * 60,
    });
    hud.shield.classList.remove('on');
    hud.over.classList.remove('show');
    $('pit-overlay').classList.remove('show');
    st.pendingQuiz = false;
    hudUpdate();
    hud.lap.textContent = '1';
    hud.pause.classList.remove('show');
    hud.banner.classList.remove('show');
    hud.hint.classList.add('show');
    setTimeout(() => hud.hint.classList.remove('show'), 6000);
    resize();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    const go = () => {
      st.mode = 'countdown';
      showCount('3'); Sound.beep(false);
      Sound.engineStart();
      last = performance.now();
    };
    if (Help.seen()) go();
    else { st.mode = 'help'; draw(); Help.show(go); }
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
    hud.over.classList.remove('show');
    hud.pause.classList.remove('show');
    cancelAnimationFrame(raf);
    Sound.engineStop();
    screen.classList.remove('active');
    document.getElementById('title-screen').classList.add('active');
  }

  $('btn-pause').addEventListener('click', () => { Sound.click(); pause(); });
  $('btn-resume').addEventListener('click', () => { Sound.click(); resume(); });
  $('btn-exit').addEventListener('click', () => { Sound.click(); exit(); });
  $('btn-again').addEventListener('click', () => { Sound.click(); start(); });
  $('btn-menu').addEventListener('click', () => { Sound.click(); exit(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('resize', () => { if (screen.classList.contains('active')) resize(); });

  return { start, pause, resume, exit, move, get state() { return st; } };
})();
