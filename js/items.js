// Desenho dos obstáculos e itens da pista.
// (x, y) = ponto no chão; sc = pixels por unidade de pista naquela distância.
const Items = (() => {
  function shadow(ctx, x, y, sc, w) {
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(x, y, w * sc, w * sc * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  }

  function cone(ctx, x, y, sc) {
    [-0.14, 0.14].forEach((o, i) => {
      const cx = x + o * sc, h = 0.3 * sc, w = 0.1 * sc, by = y - (i ? 0 : 0.01 * sc);
      shadow(ctx, cx, by, sc, 0.12);
      ctx.fillStyle = '#d95f0e';
      ctx.fillRect(cx - w * 1.25, by - h * 0.12, w * 2.5, h * 0.12);
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath(); ctx.moveTo(cx - w, by - h * 0.1); ctx.lineTo(cx - w * 0.22, by - h); ctx.lineTo(cx + w * 0.22, by - h); ctx.lineTo(cx + w, by - h * 0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(cx - w * 0.72, by - h * 0.42); ctx.lineTo(cx - w * 0.52, by - h * 0.64); ctx.lineTo(cx + w * 0.52, by - h * 0.64); ctx.lineTo(cx + w * 0.72, by - h * 0.42); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.15)';
      ctx.beginPath(); ctx.moveTo(cx, by - h * 0.1); ctx.lineTo(cx, by - h); ctx.lineTo(cx + w * 0.22, by - h); ctx.lineTo(cx + w, by - h * 0.1); ctx.closePath(); ctx.fill();
    });
  }

  function rock(ctx, x, y, sc) {
    shadow(ctx, x, y, sc, 0.27);
    const p = (px, py) => [x + px * sc, y - py * sc];
    ctx.fillStyle = '#7d8590';
    ctx.beginPath();
    [[-0.24, 0], [-0.2, 0.17], [-0.06, 0.3], [0.1, 0.27], [0.23, 0.13], [0.25, 0]].forEach((q, i) => { const [a, b] = p(...q); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); });
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a9b1bb';
    ctx.beginPath();
    [[-0.2, 0.17], [-0.06, 0.3], [0.1, 0.27], [0, 0.14]].forEach((q, i) => { const [a, b] = p(...q); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); });
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5c636d';
    ctx.beginPath();
    [[0, 0.14], [0.1, 0.27], [0.23, 0.13], [0.25, 0], [0.05, 0]].forEach((q, i) => { const [a, b] = p(...q); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); });
    ctx.closePath(); ctx.fill();
  }

  function tires(ctx, x, y, sc) {
    shadow(ctx, x, y, sc, 0.27);
    for (let i = 0; i < 3; i++) {
      const w = 0.44 * sc, h = 0.13 * sc, ty = y - (i + 1) * h * 0.95;
      ctx.fillStyle = i === 1 ? '#f4f6f8' : '#22232b';
      ctx.beginPath(); ctx.roundRect(x - w / 2, ty, w, h, h * 0.45); ctx.fill();
      ctx.fillStyle = i === 1 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.12)';
      ctx.beginPath(); ctx.roundRect(x - w / 2, ty, w, h * 0.35, h * 0.3); ctx.fill();
    }
  }

  function oil(ctx, x, y, sc, t) {
    ctx.fillStyle = 'rgba(16,17,24,.88)';
    ctx.beginPath();
    ctx.ellipse(x, y - 0.03 * sc, 0.28 * sc, 0.06 * sc, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 0.16 * sc, y - 0.05 * sc, 0.13 * sc, 0.035 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(150,110,255,${0.5 + 0.3 * Math.sin(t * 3)})`; ctx.lineWidth = Math.max(1, 0.012 * sc);
    ctx.beginPath(); ctx.ellipse(x - 0.05 * sc, y - 0.035 * sc, 0.14 * sc, 0.025 * sc, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,220,200,.6)';
    ctx.beginPath(); ctx.ellipse(x + 0.07 * sc, y - 0.03 * sc, 0.07 * sc, 0.014 * sc, 0, 0, Math.PI * 2); ctx.stroke();
  }

  function star(ctx, x, y, sc, t, e) {
    shadow(ctx, x, y, sc, 0.1);
    const cy = y - (0.3 + Math.sin(t * 4 + e.z) * 0.03) * sc, r = 0.15 * sc;
    const sx = Math.cos(t * 3 + e.z);
    ctx.save();
    ctx.translate(x, cy); ctx.scale(Math.abs(sx) < 0.25 ? 0.25 : sx, 1);
    ctx.shadowColor = 'rgba(255,210,60,.9)'; ctx.shadowBlur = r * 0.8;
    ctx.fillStyle = '#ffc83d'; ctx.strokeStyle = '#c98a00'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.2, r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function clock(ctx, x, y, sc, t, e) {
    shadow(ctx, x, y, sc, 0.13);
    const cy = y - (0.34 + Math.sin(t * 4 + e.z) * 0.03) * sc, r = 0.17 * sc;
    ctx.save();
    ctx.shadowColor = 'rgba(80,230,120,.95)'; ctx.shadowBlur = r;
    ctx.fillStyle = '#2fbf5b';
    ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillRect(x - r * 0.18, cy - r * 1.28, r * 0.36, r * 0.34);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, cy, r * 0.76, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1d2433'; ctx.lineWidth = Math.max(1.2, r * 0.13); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, cy - r * 0.5); ctx.moveTo(x, cy); ctx.lineTo(x + r * 0.36, cy + r * 0.12); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#17803a'; ctx.lineWidth = Math.max(2, r * 0.22); ctx.lineJoin = 'round';
    ctx.font = `900 ${r * 1.05}px "Exo 2", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.strokeText('+5s', x, cy - r * 1.5); ctx.fillText('+5s', x, cy - r * 1.5);
    ctx.restore();
  }

  function shield(ctx, x, y, sc, t, e) {
    shadow(ctx, x, y, sc, 0.13);
    const cy = y - (0.34 + Math.sin(t * 4 + e.z) * 0.03) * sc, r = 0.19 * sc;
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.3, cy - r * 0.3, r * 0.1, x, cy, r);
    g.addColorStop(0, 'rgba(210,245,255,.95)'); g.addColorStop(0.6, 'rgba(76,201,255,.75)'); g.addColorStop(1, 'rgba(40,120,255,.85)');
    ctx.shadowColor = 'rgba(76,201,255,.95)'; ctx.shadowBlur = r;
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // casco de tartaruga dentro da bolha
    ctx.fillStyle = '#3fae4a'; ctx.strokeStyle = '#1d6b2b'; ctx.lineWidth = Math.max(1, r * 0.1);
    ctx.beginPath(); ctx.ellipse(x, cy, r * 0.56, r * 0.48, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * r * 0.24, cy + Math.sin(a) * r * 0.22); }
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  // Bolha de escudo em volta do kart do jogador
  function bubble(ctx, x, y, w, t) {
    const r = w * 0.62, cy = y - w * 0.5;
    const g = ctx.createRadialGradient(x, cy, r * 0.5, x, cy, r);
    g.addColorStop(0, 'rgba(76,201,255,0)'); g.addColorStop(0.85, 'rgba(76,201,255,.22)'); g.addColorStop(1, 'rgba(160,230,255,.75)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, cy, r * (1 + Math.sin(t * 6) * 0.02), 0, Math.PI * 2); ctx.fill();
  }

  const table = { cone, rock, tires, oil, star, clock, shield };
  return { draw(ctx, e, x, y, sc, t) { table[e.type](ctx, x, y, sc, t, e); }, bubble };
})();
