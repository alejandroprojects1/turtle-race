// Faíscas de velocidade no fundo da tela inicial.
(() => {
  const canvas = document.getElementById('fx');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  const colors = ['255,255,255', '255,70,80', '90,205,255', '150,230,90'];
  let w = 0, h = 0, dpr = 1, parts = [], last = 0, running = true;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const n = Math.round(Math.min(70, (w * h) / 14000));
    parts = Array.from({ length: n }, () => spawn(true));
  }
  function spawn(anywhere) {
    const depth = Math.random();                 // 0 = longe, 1 = perto
    return {
      x: anywhere ? Math.random() * w : w + Math.random() * 80,
      y: Math.random() * h,
      len: 8 + depth * 70,
      speed: 120 + depth * 900,
      width: 0.6 + depth * 1.6,
      alpha: 0.12 + depth * 0.5,
      color: colors[(Math.random() * colors.length) | 0],
    };
  }
  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.x -= p.speed * dt;
      if (p.x + p.len < 0) parts[i] = spawn(false);
      const g = ctx.createLinearGradient(p.x, 0, p.x + p.len, 0);
      g.addColorStop(0, `rgba(${p.color},${p.alpha})`);
      g.addColorStop(1, `rgba(${p.color},0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = p.width;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.len, p.y);
      ctx.stroke();
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });
  resize();
  requestAnimationFrame(frame);
})();
