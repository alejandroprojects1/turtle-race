// Cartão de pergunta: congela a corrida, confere a resposta e mostra a tartaruga desenhando.
// Tipos de exercício:
//   choice — escolher a alternativa (frase, código ou desenho)
//   blank  — completar a lacuna ___ do código
//   build  — montar o comando tocando nos blocos
//   order  — colocar as linhas na ordem certa
//   bug    — tocar na linha que está errada
const Quiz = (() => {
  const $ = (id) => document.getElementById(id);
  const el = {
    root: $('quiz'), prompt: $('quiz-prompt'), stage: $('quiz-stage'), code: $('quiz-code'), board: $('quiz-board'),
    options: $('quiz-options'), feedback: $('quiz-feedback'), msg: $('quiz-msg'), next: $('quiz-next'), streak: $('quiz-streak'),
    work: $('quiz-work'), tray: $('quiz-tray'), bank: $('quiz-bank'), check: $('quiz-check'), tag: $('quiz-tag-text'),
  };
  const MAX_TRIES = 2;            // em "montar" e "ordenar": depois disso a resposta é mostrada
  let cur = null, cb = null, anim = 0, seen = [];

  const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  const EMPTY = { ops: [], total: 0, bounds: { x0: -60, y0: -60, x1: 60, y1: 60 } };

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

  // Código "certo" de cada pergunta: é o que a tartaruga desenha depois do acerto
  function solution(q) {
    if (q.demo) return q.demo;
    if (q.type === 'blank') return q.code.replace('___', q.options[q.answer]);
    if (q.type === 'bug') return q.code.split('\n').map((l, i) => (i === q.answer ? q.fix : l)).join('\n');
    if (q.type === 'order') return q.lines.join('\n');
    if (q.type === 'build') return q.tokens.join('');
    return q.code || q.picture || q.options[q.answer].draw || q.options[q.answer].code;
  }

  // ---------- Resultado ----------
  function succeed(explainPrefix, revealed) {
    const q = cur.q;
    cur.done = true;
    el.feedback.className = 'quiz-feedback show ' + (revealed ? 'reveal' : 'ok');
    el.msg.innerHTML = `<b>${explainPrefix}</b> `;
    el.msg.appendChild(document.createTextNode(q.explain));
    el.work.classList.add('done');
    if (revealed) Sound.click(); else Sound.correct();
    if (cb.onCorrect) cb.onCorrect(cur.tries === 0, !!revealed);
    play(solution(q));
  }

  function fail() {
    const q = cur.q;
    cur.tries++;
    el.feedback.className = 'quiz-feedback bad show';
    el.msg.innerHTML = '<b>Quase!</b> ';
    el.msg.appendChild(document.createTextNode('Dica: ' + q.hint));
    Sound.wrong();
    if (navigator.vibrate) navigator.vibrate(80);
    addReview(q.id);
    if (cb.onWrong) cb.onWrong();
  }

  // ---------- Tipo: escolher a alternativa ----------
  function setupChoice(q) {
    const order = shuffle(q.options.map((_, i) => i));
    const draws = q.options.filter((o) => o.draw).map((o) => TurtleLang.run(o.draw));
    const bounds = draws.length ? TurtleLang.union(draws) : null;
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
      b.addEventListener('click', () => {
        if (cur.done || b.disabled) return;
        if (oi === q.answer) {
          b.classList.add('right');
          el.options.querySelectorAll('.opt').forEach((x) => { x.disabled = true; });
          succeed('Isso mesmo!');
        } else { b.classList.add('wrong'); b.disabled = true; fail(); }
      });
      el.options.appendChild(b);
    });
  }

  // ---------- Tipo: completar a lacuna ----------
  function setupBlank(q) {
    el.code.innerHTML = TurtleLang.highlight(q.code).replace('___', '<span class="blank">___</span>');
    const blank = el.code.querySelector('.blank');
    el.options.classList.add('chips');
    shuffle(q.options.map((_, i) => i)).forEach((oi) => {
      const b = document.createElement('button');
      b.className = 'opt opt-chip';
      b.dataset.i = oi;
      b.textContent = q.options[oi];
      b.addEventListener('click', () => {
        if (cur.done || b.disabled) return;
        blank.textContent = q.options[oi];
        blank.classList.remove('bad', 'good');
        void blank.offsetWidth;
        if (oi === q.answer) {
          blank.classList.add('good'); b.classList.add('right');
          el.options.querySelectorAll('.opt').forEach((x) => { x.disabled = true; });
          succeed('Isso mesmo!');
        } else { blank.classList.add('bad'); b.classList.add('wrong'); b.disabled = true; fail(); }
      });
      el.options.appendChild(b);
    });
  }

  // ---------- Tipo: achar o bug ----------
  function setupBug(q) {
    el.code.classList.add('pick');
    el.code.querySelectorAll('.ln').forEach((ln) => {
      ln.setAttribute('role', 'button');
      ln.addEventListener('click', () => {
        if (cur.done || ln.classList.contains('bad')) return;
        const i = Number(ln.dataset.line);
        if (i === q.answer) {
          ln.classList.add('fixed');
          ln.innerHTML = `<s>${ln.innerHTML}</s> ${TurtleLang.highlight(q.fix).replace(/<\/?span class="ln"[^>]*>|<\/span>$/g, '')}`;
          el.code.classList.remove('pick');
          succeed('Achou o bug!');
        } else { ln.classList.add('bad'); fail(); }
      });
    });
  }

  // ---------- Tipos: montar o comando e ordenar as linhas ----------
  function setupBlocks(q) {
    const lines = q.type === 'order';
    const correct = lines ? q.lines : q.tokens;
    const items = shuffle([...correct, ...(q.extra || [])].map((text, id) => ({ id, text })));
    cur.items = items; cur.tray = [];
    el.work.classList.add('show');
    el.work.classList.toggle('lines', lines);
    cur.goal = lines ? TurtleLang.run(q.lines.join('\n')) : null;

    const chip = (it, inTray) => {
      const b = document.createElement('button');
      b.className = 'blk';
      b.innerHTML = `<code>${TurtleLang.highlight(it.text)}</code>`;
      b.addEventListener('click', () => {
        if (cur.done) return;
        if (inTray) cur.tray = cur.tray.filter((id) => id !== it.id); else cur.tray.push(it.id);
        Sound.click();
        el.feedback.className = 'quiz-feedback';
        draw();
      });
      return b;
    };
    const draw = () => {
      el.tray.innerHTML = ''; el.bank.innerHTML = '';
      el.tray.classList.remove('bad');
      cur.tray.forEach((id) => el.tray.appendChild(chip(items.find((it) => it.id === id), true)));
      if (!cur.tray.length) el.tray.innerHTML = `<span class="tray-hint">${lines ? 'Toque nas linhas na ordem certa' : 'Toque nos blocos para montar'}</span>`;
      items.forEach((it) => {
        const b = chip(it, false);
        if (cur.tray.includes(it.id)) { b.classList.add('used'); b.disabled = true; }
        el.bank.appendChild(b);
      });
      el.check.disabled = !cur.tray.length;
      if (lines) {
        // a lousa mostra o objetivo pontilhado e o que a criança já montou por cima
        const res = TurtleLang.run(trayText());
        TurtleLang.render(el.board, res.error ? EMPTY : res, Infinity, { turtle: true, ghost: cur.goal });
      }
    };
    const trayText = () => cur.tray.map((id) => items.find((it) => it.id === id).text).join(lines ? '\n' : '');
    cur.redraw = draw;
    cur.isRight = () => {
      if (lines) return cur.tray.length === q.lines.length && TurtleLang.same(trayText(), q.lines.join('\n'), { pose: q.pose });
      return (q.accept || [q.tokens.join('')]).includes(trayText());
    };
    cur.reveal = () => {
      const pool = items.slice();
      cur.tray = correct.map((text) => pool.splice(pool.findIndex((it) => it.text === text), 1)[0].id);
      draw();
    };
    draw();
  }

  el.check.addEventListener('click', () => {
    if (!cur || cur.done || !cur.isRight) return;
    if (cur.isRight()) { el.tray.classList.add('good'); succeed('Isso mesmo!'); return; }
    el.tray.classList.remove('bad'); void el.tray.offsetWidth; el.tray.classList.add('bad');
    fail();
    if (cur.tries >= MAX_TRIES) { cur.reveal(); el.tray.classList.remove('bad'); succeed('Veja a resposta certa:', true); }
  });

  // ---------- Abrir a pergunta ----------
  function ask(info, callbacks) {
    cb = callbacks;
    const q = info.question || pick(info.level);
    const type = q.type || 'choice';
    cur = { q, type, tries: 0, done: false };

    el.root.classList.toggle('pit', !!info.pit);
    el.tag.textContent = info.pit ? 'Pit Stop' : 'Pergunta';
    el.streak.textContent = info.streak > 1 ? `${info.streak} acertos seguidos` : '';
    el.streak.classList.toggle('show', info.streak > 1);
    el.prompt.textContent = q.prompt;
    el.code.className = 'quiz-code';
    el.code.innerHTML = q.code ? TurtleLang.highlight(q.code) : '';
    el.code.style.display = q.code ? '' : 'none';
    // a lousa aparece desde o começo quando há código, um desenho-objetivo ou linhas para ordenar
    const picture = q.picture || (q.goal ? solution(q) : null);
    el.stage.className = 'quiz-stage' + (q.code ? '' : ' no-code') + (picture || type === 'order' ? ' with-board' : '');
    el.feedback.className = 'quiz-feedback';
    el.msg.textContent = '';
    el.options.innerHTML = ''; el.options.className = 'quiz-options';
    el.work.className = 'quiz-work'; el.tray.className = 'tray';

    el.root.classList.add('show');
    cancelAnimationFrame(anim);
    requestAnimationFrame(() => {
      if (!cur) return;
      if (type === 'order') cur.redraw();
      else if (picture) TurtleLang.render(el.board, TurtleLang.run(picture), Infinity, {});
      else TurtleLang.render(el.board, EMPTY, 0, { turtle: true });
    });

    if (type === 'choice') setupChoice(q);
    else if (type === 'blank') setupBlank(q);
    else if (type === 'bug') setupBug(q);
    else setupBlocks(q);
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
    if (e.key === 'Enter') {
      if (cur.done) close(); else if (!el.check.disabled && cur.isRight) el.check.click();
      e.preventDefault();
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= el.options.children.length) el.options.children[n - 1].click();
  });

  return { ask, solution, get current() { return cur; }, get open() { return el.root.classList.contains('show'); } };
})();
