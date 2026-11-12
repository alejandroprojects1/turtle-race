// Cartão de pergunta: congela a corrida, confere a resposta e mostra a tartaruga desenhando.
const Quiz = (() => {
  const $ = (id) => document.getElementById(id);
  const el = {
    root: $('quiz'), prompt: $('quiz-prompt'), stage: $('quiz-stage'), code: $('quiz-code'), board: $('quiz-board'),
    options: $('quiz-options'), feedback: $('quiz-feedback'), msg: $('quiz-msg'), next: $('quiz-next'), streak: $('quiz-streak'),
  };
  let cur = null, cb = null, anim = 0, seen = [];

  function pick(level) {
    const lv = Math.max(1, Math.min(5, level));
    // 70% do nível da volta atual, 30% de revisão dos níveis anteriores
    let pool = QUESTIONS.filter((q) => q.level === lv);
    const older = QUESTIONS.filter((q) => q.level < lv);
    if (older.length && Math.random() < 0.3) pool = older;
    let fresh = pool.filter((q) => !seen.includes(q.id));
    if (!fresh.length) { seen = seen.filter((id) => !pool.some((q) => q.id === id)); fresh = pool; }
    const q = fresh[(Math.random() * fresh.length) | 0];
    seen.push(q.id);
    return q;
  }

  function addReview(id) {
    try {
      const list = JSON.parse(localStorage.getItem('tr-review') || '[]');
      if (!list.includes(id)) { list.push(id); localStorage.setItem('tr-review', JSON.stringify(list)); }
    } catch (e) { /* sem storage */ }
  }

  function ask(info, callbacks) {
    cb = callbacks;
    const q = info.question || pick(info.level);
    // embaralha as alternativas
    const order = q.options.map((_, i) => i).sort(() => Math.random() - 0.5);
    cur = { q, order, tries: 0, done: false };

    el.streak.textContent = info.streak > 1 ? `${info.streak} acertos seguidos` : '';
    el.streak.classList.toggle('show', info.streak > 1);
    el.prompt.textContent = q.prompt;
    el.code.innerHTML = q.code ? TurtleLang.highlight(q.code) : '';
    el.code.style.display = q.code ? '' : 'none';
    el.stage.classList.toggle('no-code', !q.code);
    el.stage.classList.remove('reveal');
    el.feedback.className = 'quiz-feedback';
    el.msg.textContent = '';

    const draws = q.options.filter((o) => o.draw).map((o) => TurtleLang.run(o.draw));
    const bounds = draws.length ? TurtleLang.union(draws) : null;
    el.options.innerHTML = '';
    el.options.classList.toggle('draws', draws.length > 0);
    order.forEach((oi, pos) => {
      const o = q.options[oi];
      const b = document.createElement('button');
      b.className = 'opt';
      b.dataset.i = oi;
      if (o.draw) {
        b.classList.add('opt-draw');
        b.setAttribute('aria-label', `Desenho ${pos + 1}`);
        const c = document.createElement('canvas');
        b.appendChild(c);
        requestAnimationFrame(() => TurtleLang.render(c, TurtleLang.run(o.draw), Infinity, { bounds }));
      } else if (o.code) {
        b.classList.add('opt-code');
        b.innerHTML = `<i>${pos + 1}</i><code>${TurtleLang.highlight(o.code)}</code>`;
      } else {
        b.innerHTML = `<i>${pos + 1}</i><span></span>`;
        b.lastChild.textContent = o.text;
      }
      b.addEventListener('click', () => choose(b, oi));
      el.options.appendChild(b);
    });

    el.root.classList.add('show');
    cancelAnimationFrame(anim);
    requestAnimationFrame(() => TurtleLang.render(el.board, { ops: [], bounds: { x0: -60, y0: -60, x1: 60, y1: 60 } }, 0, { turtle: true }));
  }

  function choose(btn, oi) {
    if (!cur || cur.done || btn.disabled) return;
    const q = cur.q;
    if (oi === q.answer) {
      cur.done = true;
      btn.classList.add('right');
      el.options.querySelectorAll('.opt').forEach((b) => { b.disabled = true; });
      el.feedback.className = 'quiz-feedback ok show';
      el.msg.innerHTML = '<b>Isso mesmo!</b> ';
      el.msg.appendChild(document.createTextNode(q.explain));
      Sound.correct();
      if (cb.onCorrect) cb.onCorrect(cur.tries === 0);
      play(q.demo || q.code || q.options[q.answer].draw || q.options[q.answer].code);
    } else {
      cur.tries++;
      btn.classList.add('wrong'); btn.disabled = true;
      el.feedback.className = 'quiz-feedback bad show';
      el.msg.innerHTML = '<b>Quase!</b> ';
      el.msg.appendChild(document.createTextNode('Dica: ' + q.hint));
      Sound.wrong();
      if (navigator.vibrate) navigator.vibrate(80);
      addReview(q.id);
      if (cb.onWrong) cb.onWrong();
    }
  }

  // A tartaruga desenha o código na lousa, destacando a linha que está rodando
  function play(code) {
    const res = TurtleLang.run(code);
    el.stage.classList.add('reveal');
    const showLines = cur.q.code === code;
    const t0 = performance.now();
    const speed = Math.max(1, res.total / 3.5);          // no máximo ~3,5 s de animação
    const step = (now) => {
      const t = (now - t0) / 1000 * speed;
      TurtleLang.render(el.board, res, t, { turtle: true });
      if (showLines) {
        const line = TurtleLang.lineAt(res, t);
        el.code.querySelectorAll('.ln').forEach((ln) => ln.classList.toggle('run', Number(ln.dataset.line) === line));
      }
      if (t < res.total + 0.2 && el.root.classList.contains('show')) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function close() {
    if (!cur || !cur.done) return;
    cancelAnimationFrame(anim);
    el.root.classList.remove('show');
    const done = cb.onClose;
    cur = null;
    Sound.click();
    if (done) done();
  }

  el.next.addEventListener('click', close);
  window.addEventListener('keydown', (e) => {
    if (!el.root.classList.contains('show') || !cur) return;
    if (e.key === 'Enter' && cur.done) { close(); e.preventDefault(); return; }
    const n = Number(e.key);
    if (n >= 1 && n <= cur.order.length) {
      const b = el.options.children[n - 1];
      if (b) b.click();
    }
  });

  return { ask, get current() { return cur; }, get open() { return el.root.classList.contains('show'); } };
})();
