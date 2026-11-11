// Desenho do kart visto por trás (vetorial, no estilo da arte original).
// Origem no chão, no centro do kart. `w` é a largura total em pixels.
function drawKartRear(ctx, w, opt = {}) {
  const t = opt.t || 0, speed = opt.speed || 0, steer = opt.steer || 0;
  const body = opt.body || '#e8262a', bodyDark = opt.bodyDark || '#a3121a', bodyLight = opt.bodyLight || '#ff5a55';
  const skin = opt.skin || '#7fd13b';
  const u = w;                                   // 1 unidade = largura do kart
  const rr = (x, y, ww, hh, r) => { ctx.beginPath(); ctx.roundRect(x * u, y * u, ww * u, hh * u, r * u); };
  const lin = (x0, y0, x1, y1, stops) => {
    const g = ctx.createLinearGradient(x0 * u, y0 * u, x1 * u, y1 * u);
    stops.forEach(([p, c]) => g.addColorStop(p, c));
    return g;
  };

  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // sombra
  ctx.fillStyle = 'rgba(0,0,0,.42)';
  ctx.beginPath(); ctx.ellipse(0, 0, 0.54 * u, 0.075 * u, 0, 0, Math.PI * 2); ctx.fill();

  // rodas dianteiras (aparecem um pouco para fora, viram com a direção)
  [-1, 1].forEach((sd) => {
    ctx.fillStyle = '#17161f';
    rr(sd * 0.43 - 0.075 + steer * 0.03, -0.36, 0.15, 0.2, 0.05); ctx.fill();
  });

  // fogo do escapamento
  if (speed > 0.2) {
    [-0.11, 0.11].forEach((x) => {
      const len = (0.1 + Math.random() * 0.1) * speed;
      const g = ctx.createRadialGradient(x * u, -0.13 * u, 0, x * u, -0.13 * u, (0.05 + len) * u);
      g.addColorStop(0, 'rgba(255,245,200,.95)'); g.addColorStop(0.4, 'rgba(255,150,60,.75)'); g.addColorStop(1, 'rgba(255,60,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x * u, (-0.13 + len * 0.5) * u, 0.05 * u, (0.05 + len) * u, 0, 0, Math.PI * 2); ctx.fill();
    });
  }

  // pneus traseiros
  [-1, 1].forEach((sd) => {
    const x = sd > 0 ? 0.27 : -0.5;
    ctx.fillStyle = lin(x, 0, x + 0.23, 0, [[0, '#15141c'], [0.5, '#34323f'], [1, '#15141c']]);
    rr(x, -0.33, 0.23, 0.33, 0.07); ctx.fill();
    // sulcos do pneu, rolando
    ctx.save(); rr(x, -0.33, 0.23, 0.33, 0.07); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 0.014 * u;
    const roll = (t * (2 + speed * 9)) % 1;
    for (let i = -1; i < 7; i++) {
      const y = -0.33 + (i + roll) * 0.055;
      ctx.beginPath(); ctx.moveTo(x * u, y * u); ctx.lineTo((x + 0.115) * u, (y + 0.02) * u); ctx.lineTo((x + 0.23) * u, y * u); ctx.stroke();
    }
    ctx.restore();
  });

  // motor e para-choque
  ctx.fillStyle = lin(0, -0.28, 0, -0.04, [[0, '#4a4958'], [1, '#22212c']]);
  rr(-0.29, -0.28, 0.58, 0.24, 0.04); ctx.fill();
  ctx.fillStyle = '#17161f';
  rr(-0.33, -0.1, 0.66, 0.075, 0.03); ctx.fill();
  // canos de escape
  [-0.11, 0.11].forEach((x) => {
    ctx.fillStyle = '#b9bccb'; ctx.beginPath(); ctx.arc(x * u, -0.14 * u, 0.05 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#17161f'; ctx.beginPath(); ctx.arc(x * u, -0.14 * u, 0.032 * u, 0, Math.PI * 2); ctx.fill();
  });

  // carroceria
  ctx.fillStyle = lin(0, -0.47, 0, -0.2, [[0, bodyLight], [0.45, body], [1, bodyDark]]);
  ctx.beginPath();
  ctx.moveTo(-0.3 * u, -0.2 * u);
  ctx.lineTo(-0.33 * u, -0.34 * u);
  ctx.quadraticCurveTo(-0.3 * u, -0.46 * u, -0.18 * u, -0.47 * u);
  ctx.lineTo(0.18 * u, -0.47 * u);
  ctx.quadraticCurveTo(0.3 * u, -0.46 * u, 0.33 * u, -0.34 * u);
  ctx.lineTo(0.3 * u, -0.2 * u);
  ctx.closePath(); ctx.fill();
  // faixas brancas
  ctx.fillStyle = '#f4f6ff';
  ctx.fillRect(-0.055 * u, -0.47 * u, 0.04 * u, 0.27 * u);
  ctx.fillRect(0.015 * u, -0.47 * u, 0.04 * u, 0.27 * u);
  // lanternas
  [-1, 1].forEach((sd) => {
    ctx.fillStyle = '#ffd24a'; ctx.shadowColor = '#ffb020'; ctx.shadowBlur = 0.04 * u;
    rr(sd * 0.235 - 0.045, -0.3, 0.09, 0.035, 0.015); ctx.fill();
    ctx.shadowBlur = 0;
  });
  // número
  ctx.fillStyle = '#f4f6ff'; ctx.strokeStyle = '#17161f'; ctx.lineWidth = 0.014 * u;
  ctx.beginPath(); ctx.arc(0, -0.335 * u, 0.072 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#17161f';
  ctx.font = `900 ${0.11 * u}px "Exo 2", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(opt.number || '1', 0, -0.33 * u);

  // encosto do banco
  ctx.fillStyle = lin(0, -0.62, 0, -0.42, [[0, '#4a4958'], [1, '#2a2935']]);
  rr(-0.2, -0.62, 0.4, 0.2, 0.06); ctx.fill();

  // braços
  [-1, 1].forEach((sd) => {
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.ellipse(sd * 0.215 * u, -0.57 * u, 0.05 * u, 0.075 * u, sd * 0.5, 0, Math.PI * 2); ctx.fill();
  });

  // casco
  const sg = ctx.createRadialGradient(-0.05 * u, -0.66 * u, 0.02 * u, 0, -0.6 * u, 0.22 * u);
  sg.addColorStop(0, '#e79a45'); sg.addColorStop(0.6, '#b9642a'); sg.addColorStop(1, '#7a3d18');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.ellipse(0, -0.6 * u, 0.19 * u, 0.175 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(90,40,10,.75)'; ctx.lineWidth = 0.012 * u;
  const hex = (cx, cy, r) => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo((cx + Math.cos(a) * r) * u, (cy + Math.sin(a) * r) * u); } ctx.closePath(); ctx.stroke(); };
  hex(0, -0.6, 0.075);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; hex(Math.cos(a) * 0.13, -0.6 + Math.sin(a) * 0.13, 0.075); }
  ctx.restore();
  ctx.strokeStyle = '#6a3414'; ctx.lineWidth = 0.014 * u;
  ctx.beginPath(); ctx.ellipse(0, -0.6 * u, 0.19 * u, 0.175 * u, 0, 0, Math.PI * 2); ctx.stroke();

  // aerofólio
  ctx.fillStyle = '#2a2935';
  ctx.fillRect(-0.19 * u, -0.56 * u, 0.035 * u, 0.12 * u);
  ctx.fillRect(0.155 * u, -0.56 * u, 0.035 * u, 0.12 * u);
  ctx.fillStyle = lin(0, -0.6, 0, -0.52, [[0, bodyLight], [1, bodyDark]]);
  rr(-0.44, -0.6, 0.88, 0.085, 0.03); ctx.fill();
  ctx.fillStyle = '#f4f6ff';
  [-0.36, -0.31, 0.27, 0.32].forEach((x) => ctx.fillRect(x * u, -0.6 * u, 0.03 * u, 0.085 * u));
  ctx.fillStyle = bodyDark;
  rr(-0.47, -0.64, 0.05, 0.15, 0.015); ctx.fill();
  rr(0.42, -0.64, 0.05, 0.15, 0.015); ctx.fill();

  // pescoço
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(0, -0.76 * u, 0.075 * u, 0.06 * u, 0, 0, Math.PI * 2); ctx.fill();

  // cachecol ao vento
  const wave = (k) => Math.sin(t * 9 + k) * 0.025 * (0.4 + speed);
  ctx.fillStyle = '#d81f2a';
  ctx.beginPath();
  ctx.moveTo(0.06 * u, -0.77 * u);
  ctx.quadraticCurveTo(0.2 * u, (-0.86 + wave(0)) * u, 0.36 * u, (-0.8 + wave(1)) * u);
  ctx.quadraticCurveTo(0.3 * u, (-0.76 + wave(2)) * u, 0.37 * u, (-0.7 + wave(1.5)) * u);
  ctx.quadraticCurveTo(0.2 * u, (-0.72 + wave(0.5)) * u, 0.06 * u, -0.71 * u);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff3b3f';
  rr(-0.105, -0.78, 0.21, 0.06, 0.03); ctx.fill();

  // capacete
  const hy = -0.9, hr = 0.155;
  const hg = ctx.createRadialGradient(-0.05 * u, (hy - 0.06) * u, 0.01 * u, 0, hy * u, hr * u);
  hg.addColorStop(0, '#ff7a70'); hg.addColorStop(0.5, '#e8262a'); hg.addColorStop(1, '#a3121a');
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(0, hy * u, hr * u, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#f4f6ff';
  ctx.fillRect(-0.035 * u, (hy - hr) * u, 0.07 * u, hr * 2 * u);
  ctx.fillRect(-0.075 * u, (hy - hr) * u, 0.018 * u, hr * 2 * u);
  ctx.fillRect(0.057 * u, (hy - hr) * u, 0.018 * u, hr * 2 * u);
  // tira dos óculos
  ctx.fillStyle = '#2a2935';
  ctx.fillRect(-hr * u, (hy - 0.02) * u, hr * 2 * u, 0.05 * u);
  ctx.fillStyle = '#8a8d9e';
  ctx.fillRect(-0.03 * u, (hy - 0.025) * u, 0.06 * u, 0.06 * u);
  ctx.restore();
  // protetores de orelha
  [-1, 1].forEach((sd) => {
    ctx.fillStyle = '#c81c24';
    ctx.beginPath(); ctx.ellipse(sd * 0.155 * u, (hy + 0.03) * u, 0.03 * u, 0.05 * u, 0, 0, Math.PI * 2); ctx.fill();
  });

  ctx.restore();
}
