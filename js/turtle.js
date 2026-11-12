// Mini interpretador de Python turtle.
// Entende: forward, backward, left, right, goto, color, begin_fill, end_fill
// (aceita também os prefixos "t." e "turtle.").
const TurtleLang = (() => {
  const COLORS = {
    red: '#e8262a', blue: '#2f7de1', green: '#2fae4a', yellow: '#f5c518', orange: '#ff8a1a',
    purple: '#8a4be0', pink: '#ff6fae', black: '#1d2433', brown: '#8a5a2b', white: '#ffffff',
  };
  const ARGS = { forward: 1, backward: 1, left: 1, right: 1, goto: 2, color: 1, begin_fill: 0, end_fill: 0 };

  // Lê o código e devolve a lista de comandos (ou um erro com a linha)
  function parse(code) {
    const cmds = [];
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/#.*$/, '').trim();
      if (!line || /^(import|from)\s/.test(line) || /=\s*turtle\.Turtle\(\)/.test(line)) continue;
      const m = line.match(/^(?:\w+\.)?(\w+)\s*\((.*)\)$/);
      if (!m || !(m[1] in ARGS)) return { error: `Linha ${i + 1}: não entendi "${line}"`, line: i };
      const name = m[1];
      const raw = m[2].trim() ? m[2].split(',').map((a) => a.trim()) : [];
      if (raw.length !== ARGS[name]) return { error: `Linha ${i + 1}: ${name} precisa de ${ARGS[name]} valor(es)`, line: i };
      let args;
      if (name === 'color') {
        const c = raw[0].match(/^["'](\w+)["']$/);
        if (!c || !COLORS[c[1]]) return { error: `Linha ${i + 1}: cor desconhecida`, line: i };
        args = [c[1]];
      } else {
        args = raw.map(Number);
        if (args.some((n) => !isFinite(n))) return { error: `Linha ${i + 1}: valor inválido`, line: i };
      }
      cmds.push({ name, args, line: i });
    }
    return { cmds };
  }

  // Executa o código e devolve os passos do desenho
  function run(code) {
    const parsed = parse(code);
    if (parsed.error) return { error: parsed.error, ops: [], total: 0, bounds: { x0: -10, y0: -10, x1: 10, y1: 10 } };
    let x = 0, y = 0, h = 0, color = 'black', fill = null;
    const ops = [];
    const b = { x0: 0, y0: 0, x1: 0, y1: 0 };
    const grow = (px, py) => { b.x0 = Math.min(b.x0, px); b.x1 = Math.max(b.x1, px); b.y0 = Math.min(b.y0, py); b.y1 = Math.max(b.y1, py); };
    const moveTo = (nx, ny, line) => {
      const len = Math.hypot(nx - x, ny - y);
      ops.push({ type: 'move', x0: x, y0: y, x1: nx, y1: ny, h, color: COLORS[color], dur: 0.15 + len / 160, line });
      x = nx; y = ny; grow(x, y);
      if (fill) fill.push([x, y]);
    };
    parsed.cmds.forEach(({ name, args, line }) => {
      const rad = h * Math.PI / 180;
      if (name === 'forward') moveTo(x + Math.cos(rad) * args[0], y + Math.sin(rad) * args[0], line);
      else if (name === 'backward') moveTo(x - Math.cos(rad) * args[0], y - Math.sin(rad) * args[0], line);
      else if (name === 'left' || name === 'right') {
        const nh = h + (name === 'left' ? args[0] : -args[0]);
        ops.push({ type: 'turn', x, y, h0: h, h1: nh, dur: 0.12 + Math.abs(args[0]) / 400, line });
        h = nh;
      } else if (name === 'goto') moveTo(args[0], args[1], line);
      else if (name === 'color') { color = args[0]; ops.push({ type: 'color', dur: 0.05, line }); }
      else if (name === 'begin_fill') { fill = [[x, y]]; ops.push({ type: 'begin', dur: 0.05, line }); }
      else if (name === 'end_fill') {
        if (fill) ops.push({ type: 'fill', pts: fill, color: COLORS[color], dur: 0.35, line });
        fill = null;
      }
    });
    let t = 0;
    ops.forEach((o) => { o.t0 = t; t += o.dur; });
    return { ops, total: t, bounds: b, end: { x, y, h } };
  }

  function union(list) {
    const b = { x0: 0, y0: 0, x1: 0, y1: 0 };
    list.forEach((r) => {
      b.x0 = Math.min(b.x0, r.bounds.x0); b.y0 = Math.min(b.y0, r.bounds.y0);
      b.x1 = Math.max(b.x1, r.bounds.x1); b.y1 = Math.max(b.y1, r.bounds.y1);
    });
    return b;
  }

  function drawTurtle(ctx, px, py, heading, size) {
    ctx.save();
    ctx.translate(px, py); ctx.rotate(-heading * Math.PI / 180);
    ctx.fillStyle = '#5fbf3a'; ctx.strokeStyle = '#236b2d'; ctx.lineWidth = size * 0.12;
    [[0.45, -0.6], [0.45, 0.6], [-0.5, -0.6], [-0.5, 0.6]].forEach(([a, c]) => { ctx.beginPath(); ctx.arc(a * size, c * size, size * 0.24, 0, Math.PI * 2); ctx.fill(); });
    ctx.beginPath(); ctx.arc(size * 0.95, 0, size * 0.34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2f9a42';
    ctx.beginPath(); ctx.ellipse(0, 0, size * 0.8, size * 0.62, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = size * 0.09;
    ctx.beginPath(); ctx.ellipse(0, 0, size * 0.4, size * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Desenha o resultado até o instante `time` (use Infinity para o desenho completo).
  // opts: { bounds, turtle (mostrar a tartaruga), pad }
  function render(canvas, res, time, opts = {}) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const b = opts.bounds || (opts.ghost ? union([res, opts.ghost]) : res.bounds);
    const pad = opts.pad != null ? opts.pad : Math.max(12, w * 0.14);
    const bw = Math.max(40, b.x1 - b.x0), bh = Math.max(40, b.y1 - b.y0);
    const sc = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh);
    const ox = w / 2 - (b.x0 + b.x1) / 2 * sc, oy = h / 2 + (b.y0 + b.y1) / 2 * sc;
    const X = (x) => ox + x * sc, Y = (y) => oy - y * sc;

    // quadriculado de fundo
    ctx.strokeStyle = 'rgba(40,60,110,.09)'; ctx.lineWidth = 1;
    const step = 50 * sc;
    if (step > 6) {
      ctx.beginPath();
      for (let gx = ox % step; gx < w; gx += step) { ctx.moveTo(gx, 0); ctx.lineTo(gx, h); }
      for (let gy = oy % step; gy < h; gy += step) { ctx.moveTo(0, gy); ctx.lineTo(w, gy); }
      ctx.stroke();
    }

    const lw = Math.max(2, Math.min(4, w * 0.022));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    let tx = 0, ty = 0, th = 0;
    // desenho-objetivo bem clarinho ao fundo
    if (opts.ghost) {
      ctx.globalAlpha = 0.2;
      opts.ghost.ops.forEach((o) => {
        if (o.type !== 'fill') return;
        ctx.fillStyle = o.color;
        ctx.beginPath(); o.pts.forEach(([px, py], i) => (i ? ctx.lineTo(X(px), Y(py)) : ctx.moveTo(X(px), Y(py)))); ctx.closePath(); ctx.fill();
      });
      ctx.globalAlpha = 0.28; ctx.lineWidth = lw; ctx.setLineDash([lw * 1.5, lw * 2]);
      opts.ghost.ops.forEach((o) => {
        if (o.type !== 'move') return;
        ctx.strokeStyle = o.color;
        ctx.beginPath(); ctx.moveTo(X(o.x0), Y(o.y0)); ctx.lineTo(X(o.x1), Y(o.y1)); ctx.stroke();
      });
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    // pinturas primeiro, depois as linhas por cima
    res.ops.forEach((o) => {
      if (o.type !== 'fill' || o.t0 > time) return;
      ctx.globalAlpha = Math.min(1, (time - o.t0) / o.dur) * 0.9;
      ctx.fillStyle = o.color;
      ctx.beginPath(); o.pts.forEach(([px, py], i) => (i ? ctx.lineTo(X(px), Y(py)) : ctx.moveTo(X(px), Y(py)))); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    });
    res.ops.forEach((o) => {
      if (o.t0 > time) return;
      const k = Math.min(1, (time - o.t0) / o.dur);
      if (o.type === 'move') {
        const ex = o.x0 + (o.x1 - o.x0) * k, ey = o.y0 + (o.y1 - o.y0) * k;
        ctx.strokeStyle = o.color; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(X(o.x0), Y(o.y0)); ctx.lineTo(X(ex), Y(ey)); ctx.stroke();
        tx = ex; ty = ey; th = o.h;
      } else if (o.type === 'turn') { tx = o.x; ty = o.y; th = o.h0 + (o.h1 - o.h0) * k; }
    });
    if (opts.turtle) drawTurtle(ctx, X(tx), Y(ty), th, Math.max(7, Math.min(12, w * 0.06)));
  }

  // Dois códigos fazem o mesmo desenho? (mesmas linhas, cores e pinturas, em qualquer ordem)
  function signature(res) {
    const r = (n) => Math.round(n);
    const segs = res.ops.filter((o) => o.type === 'move' && Math.hypot(o.x1 - o.x0, o.y1 - o.y0) > 0.5).map((o) => {
      const a = [r(o.x0), r(o.y0)], b = [r(o.x1), r(o.y1)];
      const [p1, p2] = a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]) ? [a, b] : [b, a];
      return `${p1}-${p2}-${o.color}`;
    });
    const fills = res.ops.filter((o) => o.type === 'fill').map((o) => o.color + ':' + o.pts.map(([x, y]) => `${r(x)},${r(y)}`).sort().join(';'));
    return [...new Set(segs)].sort().join('|') + '#' + fills.sort().join('|');
  }
  function same(codeA, codeB) {
    const a = run(codeA), b = run(codeB);
    return !a.error && !b.error && signature(a) === signature(b);
  }

  // Linha do código que está sendo executada no instante `time`
  function lineAt(res, time) {
    let line = -1;
    res.ops.forEach((o) => { if (o.t0 <= time) line = o.line; });
    return time >= res.total ? -1 : line;
  }

  // Colore o código (nome do comando, textos e números)
  function highlight(code) {
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return code.split('\n').map((src) => src.replace(/^(\s*\w+)|("[^"]*"?)|(-?\d+)|([^\w"]+)|(\w+)/g, (m, fn, str, num) => {
      if (fn) return `<span class="fn">${esc(fn)}</span>`;
      if (str) return `<span class="str">${esc(str)}</span>`;
      if (num) return `<span class="num">${esc(num)}</span>`;
      return esc(m);
    })).map((l, i) => `<span class="ln" data-line="${i}">${l || ' '}</span>`).join('');
  }

  return { run, render, union, lineAt, highlight, same, COLORS };
})();
