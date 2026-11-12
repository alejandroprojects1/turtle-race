// Extras: pinturas do kart (Garagem), tela "Como jogar" e confete.

// ---------- Pinturas do kart ----------
// cost = quantas estrelas (no total) a criança precisa ter para liberar
const Skins = (() => {
  const list = [
    { id: 'red', name: 'Vermelho', cost: 0, swatch: '#e8262a', opts: {} },
    { id: 'blue', name: 'Azul', cost: 15, swatch: '#2f7de1',
      opts: { body: '#2f7de1', bodyDark: '#174a94', bodyLight: '#6fb0ff', helmet: ['#8fc4ff', '#2f7de1', '#174a94'], scarf: ['#ffc83d', '#ffe08a'] } },
    { id: 'green', name: 'Verde', cost: 30, swatch: '#17a673',
      opts: { body: '#17a673', bodyDark: '#0b6646', bodyLight: '#5ddcab', helmet: ['#a5f0d2', '#17a673', '#0b6646'], scarf: ['#ff7a1a', '#ffb36b'] } },
    { id: 'yellow', name: 'Amarelo', cost: 50, swatch: '#f2b01e',
      opts: { body: '#f2b01e', bodyDark: '#a87200', bodyLight: '#ffd96b', helmet: ['#ffe9a0', '#f2b01e', '#a87200'], scarf: ['#2f7de1', '#6fb0ff'] } },
    { id: 'purple', name: 'Roxo', cost: 80, swatch: '#8a4be0',
      opts: { body: '#8a4be0', bodyDark: '#532a93', bodyLight: '#b98bff', helmet: ['#d2b5ff', '#8a4be0', '#532a93'], scarf: ['#4fd1a5', '#8ff0cf'] } },
    { id: 'pink', name: 'Rosa', cost: 120, swatch: '#ff5fa2',
      opts: { body: '#ff5fa2', bodyDark: '#b82d6b', bodyLight: '#ffa3c9', helmet: ['#ffd0e4', '#ff5fa2', '#b82d6b'], scarf: ['#ffffff', '#ffe3ef'] } },
    { id: 'black', name: 'Preto e dourado', cost: 180, swatch: '#2a2b33',
      opts: { body: '#34353f', bodyDark: '#111218', bodyLight: '#6a6c7c', helmet: ['#ffe9a0', '#f2b01e', '#a87200'], scarf: ['#f2b01e', '#ffd96b'] } },
    { id: 'white', name: 'Branco', cost: 250, swatch: '#f4f6f8',
      opts: { body: '#e9edf3', bodyDark: '#aab2c0', bodyLight: '#ffffff', helmet: ['#ffffff', '#e9edf3', '#aab2c0'], scarf: ['#e8262a', '#ff5a55'] } },
  ];
  const load = () => { try { return JSON.parse(localStorage.getItem('tr-save')) || {}; } catch (e) { return {}; } };
  const store = (data) => { try { localStorage.setItem('tr-save', JSON.stringify(data)); } catch (e) { /* sem storage */ } };
  const stars = () => load().stars || 0;
  const unlocked = (s) => stars() >= s.cost;
  const current = () => {
    const s = list.find((x) => x.id === load().skin);
    return s && unlocked(s) ? s : list[0];
  };
  const number = () => String(load().number || 1);
  return {
    list, stars, unlocked, current, number,
    select(id) { const d = load(); d.skin = id; store(d); },
    setNumber(n) { const d = load(); d.number = n; store(d); },
    // opções de desenho do kart do jogador
    opts() { return { ...current().opts, number: number() }; },
  };
})();

// ---------- Garagem ----------
const Garage = (() => {
  const $ = (id) => document.getElementById(id);
  const screen = $('garage-screen');
  const canvas = $('garage-canvas');
  let raf = 0, preview = null;

  function render() {
    const total = Skins.stars();
    $('garage-stars').textContent = total;
    const cur = Skins.current();
    if (!preview) preview = cur;
    const grid = $('skin-list');
    grid.innerHTML = '';
    Skins.list.forEach((s) => {
      const open = Skins.unlocked(s);
      const b = document.createElement('button');
      b.className = 'skin' + (s.id === cur.id ? ' on' : '') + (open ? '' : ' locked');
      b.innerHTML = `<i style="background:${s.swatch}"></i><b></b><small></small>`;
      b.querySelector('b').textContent = s.name;
      b.querySelector('small').textContent = s.id === cur.id ? 'Em uso' : open ? 'Liberado' : `Faltam ${s.cost - total} estrelas`;
      b.addEventListener('click', () => {
        preview = s;
        if (open) { Skins.select(s.id); Sound.pickStar(); } else Sound.wrong();
        render();
      });
      grid.appendChild(b);
    });
    $('garage-msg').textContent = Skins.unlocked(preview)
      ? `Pintura ${preview.name}`
      : `${preview.name}: libera com ${preview.cost} estrelas (você tem ${total})`;
    const nums = $('number-list');
    nums.innerHTML = '';
    for (let n = 1; n <= 9; n++) {
      const b = document.createElement('button');
      b.className = 'num' + (String(n) === Skins.number() ? ' on' : '');
      b.textContent = n;
      b.addEventListener('click', () => { Skins.setNumber(n); Sound.click(); render(); });
      nums.appendChild(b);
    }
  }

  function frame(t) {
    if (!screen.classList.contains('active')) return;
    raf = requestAnimationFrame(frame);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const kw = Math.min(w * 0.6, h * 0.82);
    // palco
    ctx.fillStyle = 'rgba(255,255,255,.07)';
    ctx.beginPath(); ctx.ellipse(w / 2, h * 0.9, kw * 0.75, kw * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(w / 2, h * 0.9 + Math.sin(t / 300) * 1.5);
    if (!Skins.unlocked(preview)) ctx.globalAlpha = 0.55;
    drawKartRear(ctx, kw, { t: t / 1000, speed: 0.5, steer: Math.sin(t / 900) * 0.4, ...preview.opts, number: Skins.number() });
    ctx.restore();
  }

  function open() {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    screen.classList.add('active');
    preview = Skins.current();
    render();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }
  function exit() {
    screen.classList.remove('active');
    $('title-screen').classList.add('active');
  }
  $('garage-back').addEventListener('click', () => { Sound.click(); exit(); });
  return { open, exit };
})();

// ---------- Como jogar ----------
const Help = (() => {
  const root = document.getElementById('help-overlay');
  let after = null;
  function show(callback) {
    after = callback || null;
    root.classList.add('show');
    // desenha os ícones com os mesmos desenhos da pista
    root.querySelectorAll('canvas[data-item]').forEach((c) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), size = c.clientWidth;
      c.width = c.height = Math.round(size * dpr);
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const type = c.dataset.item;
      const floats = type === 'star' || type === 'clock' || type === 'shield';
      Items.draw(ctx, { type, z: 0 }, size / 2, size * (floats ? 0.98 : 0.86), size * (floats ? 1.55 : 1.9), 0.4);
    });
  }
  document.getElementById('help-ok').addEventListener('click', () => {
    Sound.click();
    root.classList.remove('show');
    try {
      const d = JSON.parse(localStorage.getItem('tr-save')) || {};
      d.help = 1;
      localStorage.setItem('tr-save', JSON.stringify(d));
    } catch (e) { /* sem storage */ }
    const cb = after; after = null;
    if (cb) cb();
  });
  const seen = () => { try { return !!(JSON.parse(localStorage.getItem('tr-save')) || {}).help; } catch (e) { return true; } };
  return { show, seen, get open() { return root.classList.contains('show'); } };
})();

// ---------- Confete ----------
function confetti(container) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#ff2d3d', '#ffc83d', '#8be04e', '#4cc9ff', '#b98bff', '#ffffff'];
  const box = document.createElement('div');
  box.className = 'confetti';
  for (let i = 0; i < 44; i++) {
    const p = document.createElement('i');
    p.style.left = (Math.random() * 100) + '%';
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = (Math.random() * 0.6) + 's';
    p.style.animationDuration = (1.6 + Math.random() * 1.4) + 's';
    p.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
    p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    box.appendChild(p);
  }
  container.appendChild(box);
  setTimeout(() => box.remove(), 3600);
}
